import jwt
import bcrypt
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from flask import request, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from src.models.user import db, Usuario
from src.models.auditoria import SessaoUsuario, TentativaLogin, LogAuditoria, ConfiguracaoSistema
from src.utils.validators import validate_email, validate_password_strength
import hashlib
import hmac

class AuthService:
    """Serviço avançado de autenticação e segurança"""
    
    def __init__(self):
        self.max_login_attempts = 5
        self.lockout_duration_minutes = 30
        self.session_timeout_hours = 24
        self.refresh_token_days = 7
        self.password_reset_timeout_hours = 2
    
    def authenticate_user(self, email: str, password: str, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """Autentica usuário com verificações de segurança"""
        try:
            # Normalizar email
            email = email.lower().strip()
            
            # Validar formato do email
            if not validate_email(email):
                self._record_failed_attempt(email, ip_address, user_agent, 'invalid_email')
                return {'success': False, 'error': 'Email inválido', 'code': 'INVALID_EMAIL'}
            
            # Verificar se IP ou email estão bloqueados
            if self._is_blocked(email, ip_address):
                self._record_failed_attempt(email, ip_address, user_agent, 'blocked')
                return {'success': False, 'error': 'Conta temporariamente bloqueada', 'code': 'ACCOUNT_BLOCKED'}
            
            # Buscar usuário
            user = Usuario.query.filter_by(email=email).first()
            
            if not user:
                self._record_failed_attempt(email, ip_address, user_agent, 'user_not_found')
                return {'success': False, 'error': 'Credenciais inválidas', 'code': 'INVALID_CREDENTIALS'}
            
            # Verificar se usuário está ativo
            if not user.is_active():
                self._record_failed_attempt(email, ip_address, user_agent, 'user_inactive', user.id)
                return {'success': False, 'error': 'Conta inativa', 'code': 'ACCOUNT_INACTIVE'}
            
            # Verificar senha
            if not self._verify_password(password, user.password_hash):
                self._record_failed_attempt(email, ip_address, user_agent, 'wrong_password', user.id)
                return {'success': False, 'error': 'Credenciais inválidas', 'code': 'INVALID_CREDENTIALS'}
            
            # Verificar se empresa está ativa
            if user.empresa and not user.empresa.is_active():
                self._record_failed_attempt(email, ip_address, user_agent, 'company_inactive', user.id)
                return {'success': False, 'error': 'Empresa inativa', 'code': 'COMPANY_INACTIVE'}
            
            # Verificar assinatura
            if user.empresa and not user.empresa.is_subscription_valid():
                self._record_failed_attempt(email, ip_address, user_agent, 'subscription_expired', user.id)
                return {'success': False, 'error': 'Assinatura vencida', 'code': 'SUBSCRIPTION_EXPIRED'}
            
            # Login bem-sucedido
            tokens = self._create_user_session(user, ip_address, user_agent)
            
            # Registrar tentativa bem-sucedida
            TentativaLogin.record_attempt(email, ip_address, True, user_agent, None, user.id)
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'login_success',
                usuario_id=user.id,
                success=True,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Atualizar último login
            user.ultimo_login = datetime.now()
            user.tentativas_login = 0
            db.session.commit()
            
            return {
                'success': True,
                'user': user.to_dict(),
                'tokens': tokens,
                'session_expires_at': tokens['expires_at']
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def refresh_user_session(self, refresh_token: str, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """Renova sessão do usuário usando refresh token"""
        try:
            # Decodificar refresh token
            try:
                token_data = decode_token(refresh_token)
                jti = token_data['jti']
                user_id = token_data['sub']
            except Exception:
                return {'success': False, 'error': 'Token inválido', 'code': 'INVALID_TOKEN'}
            
            # Buscar sessão
            sessao = SessaoUsuario.query.filter_by(token_jti=jti, ativo=True).first()
            
            if not sessao or not sessao.is_valid():
                return {'success': False, 'error': 'Sessão inválida', 'code': 'INVALID_SESSION'}
            
            # Buscar usuário
            user = Usuario.query.get(user_id)
            if not user or not user.is_active():
                return {'success': False, 'error': 'Usuário inativo', 'code': 'USER_INACTIVE'}
            
            # Criar nova sessão
            new_tokens = self._create_user_session(user, ip_address, user_agent)
            
            # Revogar sessão antiga
            sessao.revoke('token_refresh')
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'token_refresh',
                usuario_id=user.id,
                success=True,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.session.commit()
            
            return {
                'success': True,
                'tokens': new_tokens,
                'session_expires_at': new_tokens['expires_at']
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def logout_user(self, access_token: str, ip_address: str = None) -> Dict[str, Any]:
        """Faz logout do usuário e revoga sessão"""
        try:
            # Decodificar token
            try:
                token_data = decode_token(access_token)
                jti = token_data['jti']
                user_id = token_data['sub']
            except Exception:
                return {'success': False, 'error': 'Token inválido', 'code': 'INVALID_TOKEN'}
            
            # Buscar e revogar sessão
            sessao = SessaoUsuario.query.filter_by(token_jti=jti, ativo=True).first()
            if sessao:
                sessao.revoke('logout')
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'logout',
                usuario_id=user_id,
                success=True,
                ip_address=ip_address
            )
            
            db.session.commit()
            
            return {'success': True, 'message': 'Logout realizado com sucesso'}
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def logout_all_sessions(self, user_id: int, except_current: str = None, ip_address: str = None) -> Dict[str, Any]:
        """Faz logout de todas as sessões do usuário"""
        try:
            revoked_count = SessaoUsuario.revoke_all_user_sessions(
                user_id, except_jti=except_current, motivo='logout_all'
            )
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'logout_all_sessions',
                usuario_id=user_id,
                success=True,
                ip_address=ip_address,
                dados_novos={'sessions_revoked': revoked_count}
            )
            
            return {
                'success': True,
                'message': f'{revoked_count} sessões encerradas',
                'sessions_revoked': revoked_count
            }
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def change_password(self, user_id: int, current_password: str, new_password: str, ip_address: str = None) -> Dict[str, Any]:
        """Altera senha do usuário"""
        try:
            user = Usuario.query.get(user_id)
            if not user:
                return {'success': False, 'error': 'Usuário não encontrado', 'code': 'USER_NOT_FOUND'}
            
            # Verificar senha atual
            if not self._verify_password(current_password, user.password_hash):
                LogAuditoria.log_auth_event(
                    'password_change_failed',
                    usuario_id=user_id,
                    success=False,
                    ip_address=ip_address,
                    dados_novos={'reason': 'wrong_current_password'}
                )
                return {'success': False, 'error': 'Senha atual incorreta', 'code': 'WRONG_PASSWORD'}
            
            # Validar nova senha
            password_validation = validate_password_strength(new_password)
            if not password_validation['valid']:
                return {
                    'success': False,
                    'error': 'Senha não atende aos critérios de segurança',
                    'code': 'WEAK_PASSWORD',
                    'feedback': password_validation['feedback']
                }
            
            # Verificar se não é a mesma senha
            if self._verify_password(new_password, user.password_hash):
                return {'success': False, 'error': 'Nova senha deve ser diferente da atual', 'code': 'SAME_PASSWORD'}
            
            # Alterar senha
            user.password_hash = self._hash_password(new_password)
            user.updated_at = datetime.now()
            
            # Revogar todas as sessões exceto a atual
            current_jti = getattr(request, 'jwt_jti', None)
            SessaoUsuario.revoke_all_user_sessions(user_id, except_jti=current_jti, motivo='password_change')
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'password_change_success',
                usuario_id=user_id,
                success=True,
                ip_address=ip_address
            )
            
            db.session.commit()
            
            return {'success': True, 'message': 'Senha alterada com sucesso'}
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def request_password_reset(self, email: str, ip_address: str = None) -> Dict[str, Any]:
        """Solicita reset de senha"""
        try:
            email = email.lower().strip()
            
            user = Usuario.query.filter_by(email=email).first()
            if not user:
                # Por segurança, não revelar se o email existe
                return {'success': True, 'message': 'Se o email existir, você receberá instruções de reset'}
            
            # Gerar token de reset
            reset_token = secrets.token_urlsafe(32)
            reset_expires = datetime.now() + timedelta(hours=self.password_reset_timeout_hours)
            
            user.token_reset = reset_token
            user.token_reset_expira = reset_expires
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'password_reset_requested',
                usuario_id=user.id,
                success=True,
                ip_address=ip_address
            )
            
            db.session.commit()
            
            # TODO: Enviar email com token de reset
            
            return {'success': True, 'message': 'Se o email existir, você receberá instruções de reset'}
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def reset_password(self, token: str, new_password: str, ip_address: str = None) -> Dict[str, Any]:
        """Reseta senha usando token"""
        try:
            # Buscar usuário pelo token
            user = Usuario.query.filter_by(token_reset=token).first()
            
            if not user or not user.token_reset_expira or datetime.now() > user.token_reset_expira:
                return {'success': False, 'error': 'Token inválido ou expirado', 'code': 'INVALID_TOKEN'}
            
            # Validar nova senha
            password_validation = validate_password_strength(new_password)
            if not password_validation['valid']:
                return {
                    'success': False,
                    'error': 'Senha não atende aos critérios de segurança',
                    'code': 'WEAK_PASSWORD',
                    'feedback': password_validation['feedback']
                }
            
            # Alterar senha
            user.password_hash = self._hash_password(new_password)
            user.token_reset = None
            user.token_reset_expira = None
            user.updated_at = datetime.now()
            
            # Revogar todas as sessões
            SessaoUsuario.revoke_all_user_sessions(user.id, motivo='password_reset')
            
            # Log de auditoria
            LogAuditoria.log_auth_event(
                'password_reset_success',
                usuario_id=user.id,
                success=True,
                ip_address=ip_address
            )
            
            db.session.commit()
            
            return {'success': True, 'message': 'Senha resetada com sucesso'}
            
        except Exception as e:
            db.session.rollback()
            return {'success': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def validate_session(self, access_token: str) -> Dict[str, Any]:
        """Valida sessão do usuário"""
        try:
            # Decodificar token
            try:
                token_data = decode_token(access_token)
                jti = token_data['jti']
                user_id = token_data['sub']
            except Exception:
                return {'valid': False, 'error': 'Token inválido', 'code': 'INVALID_TOKEN'}
            
            # Buscar sessão
            sessao = SessaoUsuario.query.filter_by(token_jti=jti, ativo=True).first()
            
            if not sessao or not sessao.is_valid():
                return {'valid': False, 'error': 'Sessão inválida', 'code': 'INVALID_SESSION'}
            
            # Buscar usuário
            user = Usuario.query.get(user_id)
            if not user or not user.is_active():
                return {'valid': False, 'error': 'Usuário inativo', 'code': 'USER_INACTIVE'}
            
            # Atualizar último acesso
            sessao.refresh_access()
            db.session.commit()
            
            return {
                'valid': True,
                'user': user.to_dict(),
                'session': sessao.to_dict()
            }
            
        except Exception as e:
            return {'valid': False, 'error': 'Erro interno do servidor', 'code': 'INTERNAL_ERROR'}
    
    def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """Obtém sessões ativas do usuário"""
        try:
            sessoes = SessaoUsuario.query.filter_by(
                usuario_id=user_id, ativo=True
            ).order_by(SessaoUsuario.ultimo_acesso.desc()).all()
            
            return [sessao.to_dict() for sessao in sessoes]
            
        except Exception as e:
            return []
    
    def _create_user_session(self, user: Usuario, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """Cria nova sessão para o usuário"""
        # Gerar JTI único
        jti = str(uuid.uuid4())
        
        # Calcular tempos de expiração
        access_expires = timedelta(hours=self.session_timeout_hours)
        refresh_expires = timedelta(days=self.refresh_token_days)
        
        # Criar tokens
        access_token = create_access_token(
            identity=user.id,
            expires_delta=access_expires,
            additional_claims={
                'empresa_id': user.empresa_id,
                'perfil': user.perfil,
                'jti': jti
            }
        )
        
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=refresh_expires,
            additional_claims={'jti': jti}
        )
        
        # Salvar sessão no banco
        sessao = SessaoUsuario(
            usuario_id=user.id,
            token_jti=jti,
            token_access=access_token,
            token_refresh=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            dispositivo=self._extract_device_info(user_agent),
            expires_at=datetime.now() + access_expires,
            refresh_expires_at=datetime.now() + refresh_expires
        )
        
        db.session.add(sessao)
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(access_expires.total_seconds()),
            'expires_at': sessao.expires_at.isoformat(),
            'jti': jti
        }
    
    def _hash_password(self, password: str) -> str:
        """Gera hash da senha"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        """Verifica senha contra hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False
    
    def _record_failed_attempt(self, email: str, ip_address: str, user_agent: str, motivo: str, user_id: int = None):
        """Registra tentativa de login falhada"""
        TentativaLogin.record_attempt(
            email=email,
            ip_address=ip_address,
            success=False,
            user_agent=user_agent,
            motivo_falha=motivo,
            usuario_id=user_id
        )
    
    def _is_blocked(self, email: str, ip_address: str) -> bool:
        """Verifica se email ou IP estão bloqueados"""
        # Verificar bloqueio explícito
        if TentativaLogin.is_blocked(email=email) or TentativaLogin.is_blocked(ip_address=ip_address):
            return True
        
        # Verificar limite de tentativas
        email_attempts = TentativaLogin.get_failed_attempts_count(email=email, hours=1)
        ip_attempts = TentativaLogin.get_failed_attempts_count(ip_address=ip_address, hours=1)
        
        return email_attempts >= self.max_login_attempts or ip_attempts >= self.max_login_attempts
    
    def _extract_device_info(self, user_agent: str) -> str:
        """Extrai informações do dispositivo do user agent"""
        if not user_agent:
            return 'Desconhecido'
        
        user_agent = user_agent.lower()
        
        if 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            return 'Mobile'
        elif 'tablet' in user_agent or 'ipad' in user_agent:
            return 'Tablet'
        else:
            return 'Desktop'
    
    def cleanup_expired_data(self):
        """Limpa dados expirados"""
        try:
            # Limpar sessões expiradas
            session_cleanup = SessaoUsuario.cleanup_expired_sessions()
            
            # Limpar tentativas de login antigas
            login_cleanup = TentativaLogin.cleanup_old_attempts()
            
            # Limpar logs de auditoria antigos
            log_retention_days = ConfiguracaoSistema.get_config('log_retention_days', 30)
            audit_cleanup = LogAuditoria.cleanup_old_logs(log_retention_days)
            
            return {
                'sessions_expired': session_cleanup['expired'],
                'sessions_deleted': session_cleanup['deleted'],
                'login_attempts_deleted': login_cleanup,
                'audit_logs_deleted': audit_cleanup
            }
            
        except Exception as e:
            return {'error': str(e)}

# Instância global do serviço
auth_service = AuthService()

