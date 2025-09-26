import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import jinja2
from src.models.auditoria import LogAuditoria, ConfiguracaoSistema
import json

class EmailService:
    """Serviço para envio de e-mails"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        self.from_name = os.getenv('FROM_NAME', 'Validade Inteligente')
        
        # Configurar Jinja2 para templates
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'emails')
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
    
    def send_email(self, to_emails: List[str], subject: str, html_body: str, 
                   text_body: str = None, attachments: List[Dict] = None,
                   reply_to: str = None) -> Dict[str, Any]:
        """Envia e-mail"""
        try:
            if not self.smtp_username or not self.smtp_password:
                return {
                    'success': False,
                    'error': 'Configurações de e-mail não definidas',
                    'code': 'EMAIL_NOT_CONFIGURED'
                }
            
            # Criar mensagem
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Adicionar corpo do e-mail
            if text_body:
                text_part = MIMEText(text_body, 'plain', 'utf-8')
                msg.attach(text_part)
            
            html_part = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Adicionar anexos
            if attachments:
                for attachment in attachments:
                    self._add_attachment(msg, attachment)
            
            # Enviar e-mail
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            # Log de sucesso
            LogAuditoria.log_system_event(
                'email_sent',
                details={
                    'to': to_emails,
                    'subject': subject,
                    'attachments_count': len(attachments) if attachments else 0
                },
                nivel='info'
            )
            
            return {
                'success': True,
                'message': 'E-mail enviado com sucesso',
                'recipients': to_emails
            }
            
        except Exception as e:
            # Log de erro
            LogAuditoria.log_system_event(
                'email_send_failed',
                details={
                    'to': to_emails,
                    'subject': subject,
                    'error': str(e)
                },
                nivel='error'
            )
            
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail: {str(e)}',
                'code': 'EMAIL_SEND_ERROR'
            }
    
    def send_template_email(self, template_name: str, to_emails: List[str], 
                          subject: str, template_data: Dict[str, Any],
                          attachments: List[Dict] = None) -> Dict[str, Any]:
        """Envia e-mail usando template"""
        try:
            # Carregar template HTML
            html_template = self.jinja_env.get_template(f"{template_name}.html")
            html_body = html_template.render(**template_data)
            
            # Tentar carregar template de texto
            text_body = None
            try:
                text_template = self.jinja_env.get_template(f"{template_name}.txt")
                text_body = text_template.render(**template_data)
            except jinja2.TemplateNotFound:
                pass
            
            return self.send_email(
                to_emails=to_emails,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
                attachments=attachments
            )
            
        except jinja2.TemplateNotFound:
            return {
                'success': False,
                'error': f'Template {template_name} não encontrado',
                'code': 'TEMPLATE_NOT_FOUND'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao processar template: {str(e)}',
                'code': 'TEMPLATE_ERROR'
            }
    
    def send_support_ticket_created(self, chamado_data: Dict[str, Any]) -> Dict[str, Any]:
        """Envia e-mail de criação de chamado"""
        try:
            template_data = {
                'chamado': chamado_data,
                'empresa_nome': chamado_data.get('empresa', {}).get('nome', ''),
                'usuario_nome': chamado_data.get('usuario', {}).get('nome', ''),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            # Enviar para o usuário
            user_result = self.send_template_email(
                template_name='chamado_criado_usuario',
                to_emails=[chamado_data.get('usuario', {}).get('email', '')],
                subject=f"Chamado #{chamado_data['numero']} - {chamado_data['titulo']}",
                template_data=template_data
            )
            
            # Enviar para equipe de suporte
            support_emails = self._get_support_team_emails()
            if support_emails:
                support_result = self.send_template_email(
                    template_name='chamado_criado_suporte',
                    to_emails=support_emails,
                    subject=f"Novo Chamado #{chamado_data['numero']} - {chamado_data['categoria']}",
                    template_data=template_data
                )
            
            return user_result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail de chamado: {str(e)}',
                'code': 'SUPPORT_EMAIL_ERROR'
            }
    
    def send_support_ticket_response(self, chamado_data: Dict[str, Any], 
                                   mensagem_data: Dict[str, Any]) -> Dict[str, Any]:
        """Envia e-mail de resposta ao chamado"""
        try:
            template_data = {
                'chamado': chamado_data,
                'mensagem': mensagem_data,
                'empresa_nome': chamado_data.get('empresa', {}).get('nome', ''),
                'usuario_nome': chamado_data.get('usuario', {}).get('nome', ''),
                'atendente_nome': mensagem_data.get('usuario', {}).get('nome', ''),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            # Determinar destinatário baseado em quem enviou a mensagem
            if mensagem_data.get('usuario', {}).get('perfil') in ['admin', 'suporte']:
                # Resposta da equipe para o cliente
                to_email = chamado_data.get('usuario', {}).get('email', '')
                template_name = 'chamado_resposta_cliente'
                subject = f"Resposta ao Chamado #{chamado_data['numero']}"
            else:
                # Nova mensagem do cliente para a equipe
                to_emails = self._get_support_team_emails()
                template_name = 'chamado_resposta_suporte'
                subject = f"Nova Mensagem - Chamado #{chamado_data['numero']}"
                
                if to_emails:
                    return self.send_template_email(
                        template_name=template_name,
                        to_emails=to_emails,
                        subject=subject,
                        template_data=template_data
                    )
                else:
                    return {'success': True, 'message': 'Nenhum e-mail de suporte configurado'}
            
            if to_email:
                return self.send_template_email(
                    template_name=template_name,
                    to_emails=[to_email],
                    subject=subject,
                    template_data=template_data
                )
            else:
                return {'success': False, 'error': 'E-mail do destinatário não encontrado'}
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail de resposta: {str(e)}',
                'code': 'RESPONSE_EMAIL_ERROR'
            }
    
    def send_support_ticket_status_change(self, chamado_data: Dict[str, Any], 
                                        old_status: str, new_status: str) -> Dict[str, Any]:
        """Envia e-mail de mudança de status do chamado"""
        try:
            template_data = {
                'chamado': chamado_data,
                'old_status': old_status,
                'new_status': new_status,
                'empresa_nome': chamado_data.get('empresa', {}).get('nome', ''),
                'usuario_nome': chamado_data.get('usuario', {}).get('nome', ''),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            return self.send_template_email(
                template_name='chamado_status_alterado',
                to_emails=[chamado_data.get('usuario', {}).get('email', '')],
                subject=f"Chamado #{chamado_data['numero']} - Status Alterado",
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail de status: {str(e)}',
                'code': 'STATUS_EMAIL_ERROR'
            }
    
    def send_sla_alert(self, chamado_data: Dict[str, Any], alert_type: str) -> Dict[str, Any]:
        """Envia alerta de SLA"""
        try:
            template_data = {
                'chamado': chamado_data,
                'alert_type': alert_type,
                'empresa_nome': chamado_data.get('empresa', {}).get('nome', ''),
                'usuario_nome': chamado_data.get('usuario', {}).get('nome', ''),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            support_emails = self._get_support_team_emails()
            if not support_emails:
                return {'success': False, 'error': 'Nenhum e-mail de suporte configurado'}
            
            subject_map = {
                'resposta_vencida': f"🚨 SLA VENCIDO - Chamado #{chamado_data['numero']} sem resposta",
                'resolucao_vencida': f"🚨 SLA VENCIDO - Chamado #{chamado_data['numero']} não resolvido",
                'resposta_alerta': f"⚠️ SLA ALERTA - Chamado #{chamado_data['numero']} próximo do vencimento",
                'resolucao_alerta': f"⚠️ SLA ALERTA - Chamado #{chamado_data['numero']} próximo do vencimento"
            }
            
            return self.send_template_email(
                template_name='sla_alert',
                to_emails=support_emails,
                subject=subject_map.get(alert_type, f"Alerta SLA - Chamado #{chamado_data['numero']}"),
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar alerta SLA: {str(e)}',
                'code': 'SLA_EMAIL_ERROR'
            }
    
    def send_password_reset(self, user_data: Dict[str, Any], reset_token: str) -> Dict[str, Any]:
        """Envia e-mail de reset de senha"""
        try:
            # URL base do frontend
            frontend_url = os.getenv('FRONTEND_URL', 'https://app.validadeinteligente.com')
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"
            
            template_data = {
                'user': user_data,
                'reset_url': reset_url,
                'reset_token': reset_token,
                'expires_hours': 2,
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            return self.send_template_email(
                template_name='password_reset',
                to_emails=[user_data['email']],
                subject='Redefinição de Senha - Validade Inteligente',
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail de reset: {str(e)}',
                'code': 'RESET_EMAIL_ERROR'
            }
    
    def send_welcome_email(self, user_data: Dict[str, Any], empresa_data: Dict[str, Any]) -> Dict[str, Any]:
        """Envia e-mail de boas-vindas"""
        try:
            template_data = {
                'user': user_data,
                'empresa': empresa_data,
                'login_url': os.getenv('FRONTEND_URL', 'https://app.validadeinteligente.com'),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            return self.send_template_email(
                template_name='welcome',
                to_emails=[user_data['email']],
                subject='Bem-vindo ao Validade Inteligente!',
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar e-mail de boas-vindas: {str(e)}',
                'code': 'WELCOME_EMAIL_ERROR'
            }
    
    def send_payment_confirmation(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Envia confirmação de pagamento"""
        try:
            template_data = {
                'payment': payment_data,
                'user': payment_data.get('user', {}),
                'empresa': payment_data.get('empresa', {}),
                'plano': payment_data.get('plano', {}),
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            return self.send_template_email(
                template_name='payment_confirmation',
                to_emails=[payment_data.get('user', {}).get('email', '')],
                subject=f"Pagamento Confirmado - {payment_data.get('plano', {}).get('nome', 'Plano')}",
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar confirmação de pagamento: {str(e)}',
                'code': 'PAYMENT_EMAIL_ERROR'
            }
    
    def send_subscription_expiry_warning(self, empresa_data: Dict[str, Any], days_remaining: int) -> Dict[str, Any]:
        """Envia aviso de vencimento de assinatura"""
        try:
            template_data = {
                'empresa': empresa_data,
                'days_remaining': days_remaining,
                'renewal_url': f"{os.getenv('FRONTEND_URL', 'https://app.validadeinteligente.com')}/billing",
                'data_atual': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            # Buscar e-mails dos administradores da empresa
            admin_emails = self._get_company_admin_emails(empresa_data['id'])
            
            if not admin_emails:
                return {'success': False, 'error': 'Nenhum administrador encontrado'}
            
            return self.send_template_email(
                template_name='subscription_expiry_warning',
                to_emails=admin_emails,
                subject=f"Assinatura vence em {days_remaining} dias - Validade Inteligente",
                template_data=template_data
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar aviso de vencimento: {str(e)}',
                'code': 'EXPIRY_EMAIL_ERROR'
            }
    
    def _add_attachment(self, msg: MIMEMultipart, attachment: Dict[str, Any]):
        """Adiciona anexo ao e-mail"""
        try:
            with open(attachment['path'], 'rb') as file:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {attachment["filename"]}'
            )
            
            msg.attach(part)
            
        except Exception as e:
            print(f"Erro ao adicionar anexo {attachment.get('filename', '')}: {str(e)}")
    
    def _get_support_team_emails(self) -> List[str]:
        """Obtém e-mails da equipe de suporte"""
        try:
            # Buscar configuração de e-mails de suporte
            support_emails = ConfiguracaoSistema.get_config('support_emails', [])
            
            if not support_emails:
                # Fallback: buscar usuários com perfil de suporte
                from src.models.user import Usuario
                support_users = Usuario.query.filter(
                    Usuario.perfil.in_(['admin', 'suporte']),
                    Usuario.status == 'ativo'
                ).all()
                
                support_emails = [user.email for user in support_users if user.email]
            
            return support_emails
            
        except Exception as e:
            print(f"Erro ao obter e-mails de suporte: {str(e)}")
            return []
    
    def _get_company_admin_emails(self, empresa_id: int) -> List[str]:
        """Obtém e-mails dos administradores da empresa"""
        try:
            from src.models.user import Usuario
            
            admins = Usuario.query.filter(
                Usuario.empresa_id == empresa_id,
                Usuario.perfil.in_(['admin', 'gerente']),
                Usuario.status == 'ativo'
            ).all()
            
            return [admin.email for admin in admins if admin.email]
            
        except Exception as e:
            print(f"Erro ao obter e-mails de administradores: {str(e)}")
            return []
    
    def test_email_configuration(self) -> Dict[str, Any]:
        """Testa configuração de e-mail"""
        try:
            if not self.smtp_username or not self.smtp_password:
                return {
                    'success': False,
                    'error': 'Configurações SMTP não definidas'
                }
            
            # Tentar conectar ao servidor SMTP
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
            
            return {
                'success': True,
                'message': 'Configuração de e-mail válida',
                'smtp_server': self.smtp_server,
                'smtp_port': self.smtp_port,
                'from_email': self.from_email
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro na configuração de e-mail: {str(e)}'
            }

# Instância global do serviço
email_service = EmailService()

