import requests
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from src.models.user import db
from src.models.empresa import Pagamento, Assinatura

class MercadoPagoService:
    """Serviço para integração com a API do Mercado Pago"""
    
    def __init__(self, access_token: str, environment: str = 'sandbox'):
        self.access_token = access_token
        self.environment = environment
        
        if environment == 'production':
            self.base_url = 'https://api.mercadopago.com'
        else:
            self.base_url = 'https://api.mercadopago.com'  # Mesmo endpoint para sandbox
        
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'X-Idempotency-Key': None  # Será definido por requisição
        }
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None, idempotency_key: str = None) -> Dict:
        """Faz requisição para a API do Mercado Pago"""
        try:
            url = f"{self.base_url}{endpoint}"
            headers = self.headers.copy()
            
            if idempotency_key:
                headers['X-Idempotency-Key'] = idempotency_key
            
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            error_data = {}
            if hasattr(e, 'response') and e.response:
                try:
                    error_data = e.response.json()
                except:
                    error_data = {'message': e.response.text}
            
            raise Exception(f"Erro na API do Mercado Pago: {error_data.get('message', str(e))}")
    
    def create_payment_preference(self, payment_data: Dict) -> Dict:
        """Cria uma preferência de pagamento"""
        try:
            preference_data = {
                "items": payment_data['items'],
                "payer": payment_data.get('payer', {}),
                "payment_methods": {
                    "excluded_payment_methods": [],
                    "excluded_payment_types": [],
                    "installments": payment_data.get('installments', 12)
                },
                "back_urls": {
                    "success": payment_data.get('success_url'),
                    "failure": payment_data.get('failure_url'),
                    "pending": payment_data.get('pending_url')
                },
                "auto_return": "approved",
                "external_reference": payment_data.get('external_reference'),
                "notification_url": payment_data.get('notification_url'),
                "expires": payment_data.get('expires', True),
                "expiration_date_from": payment_data.get('expiration_date_from'),
                "expiration_date_to": payment_data.get('expiration_date_to')
            }
            
            # Remover campos None
            preference_data = {k: v for k, v in preference_data.items() if v is not None}
            
            idempotency_key = f"pref_{payment_data.get('external_reference')}_{int(datetime.now().timestamp())}"
            
            response = self._make_request(
                'POST', 
                '/checkout/preferences', 
                preference_data,
                idempotency_key
            )
            
            return {
                'id': response['id'],
                'init_point': response['init_point'],
                'sandbox_init_point': response.get('sandbox_init_point'),
                'collector_id': response['collector_id'],
                'client_id': response['client_id'],
                'date_created': response['date_created']
            }
            
        except Exception as e:
            raise Exception(f"Erro ao criar preferência de pagamento: {str(e)}")
    
    def get_payment_info(self, payment_id: str) -> Dict:
        """Obtém informações de um pagamento"""
        try:
            response = self._make_request('GET', f'/v1/payments/{payment_id}')
            
            return {
                'id': response['id'],
                'status': response['status'],
                'status_detail': response['status_detail'],
                'transaction_amount': response['transaction_amount'],
                'currency_id': response['currency_id'],
                'payment_method_id': response['payment_method_id'],
                'payment_type_id': response['payment_type_id'],
                'date_created': response['date_created'],
                'date_approved': response.get('date_approved'),
                'date_last_updated': response['date_last_updated'],
                'payer': response.get('payer', {}),
                'external_reference': response.get('external_reference'),
                'description': response.get('description'),
                'installments': response.get('installments'),
                'card': response.get('card', {}),
                'captured': response.get('captured'),
                'live_mode': response.get('live_mode')
            }
            
        except Exception as e:
            raise Exception(f"Erro ao obter informações do pagamento: {str(e)}")
    
    def create_subscription(self, subscription_data: Dict) -> Dict:
        """Cria uma assinatura recorrente"""
        try:
            # Mercado Pago usa "preapproval" para assinaturas
            preapproval_data = {
                "reason": subscription_data['reason'],
                "auto_recurring": {
                    "frequency": subscription_data.get('frequency', 1),
                    "frequency_type": subscription_data.get('frequency_type', 'months'),
                    "transaction_amount": subscription_data['amount'],
                    "currency_id": subscription_data.get('currency_id', 'BRL'),
                    "start_date": subscription_data.get('start_date'),
                    "end_date": subscription_data.get('end_date')
                },
                "payer_email": subscription_data['payer_email'],
                "back_url": subscription_data.get('back_url'),
                "external_reference": subscription_data.get('external_reference'),
                "notification_url": subscription_data.get('notification_url')
            }
            
            # Remover campos None
            preapproval_data = {k: v for k, v in preapproval_data.items() if v is not None}
            
            idempotency_key = f"sub_{subscription_data.get('external_reference')}_{int(datetime.now().timestamp())}"
            
            response = self._make_request(
                'POST', 
                '/preapproval', 
                preapproval_data,
                idempotency_key
            )
            
            return {
                'id': response['id'],
                'init_point': response['init_point'],
                'sandbox_init_point': response.get('sandbox_init_point'),
                'status': response['status'],
                'date_created': response['date_created']
            }
            
        except Exception as e:
            raise Exception(f"Erro ao criar assinatura: {str(e)}")
    
    def get_subscription_info(self, subscription_id: str) -> Dict:
        """Obtém informações de uma assinatura"""
        try:
            response = self._make_request('GET', f'/preapproval/{subscription_id}')
            
            return {
                'id': response['id'],
                'status': response['status'],
                'reason': response['reason'],
                'external_reference': response.get('external_reference'),
                'payer_email': response.get('payer_email'),
                'date_created': response['date_created'],
                'last_modified': response.get('last_modified'),
                'auto_recurring': response.get('auto_recurring', {}),
                'summarized': response.get('summarized', {})
            }
            
        except Exception as e:
            raise Exception(f"Erro ao obter informações da assinatura: {str(e)}")
    
    def cancel_subscription(self, subscription_id: str) -> Dict:
        """Cancela uma assinatura"""
        try:
            cancel_data = {"status": "cancelled"}
            
            response = self._make_request(
                'PUT', 
                f'/preapproval/{subscription_id}', 
                cancel_data
            )
            
            return {
                'id': response['id'],
                'status': response['status'],
                'last_modified': response.get('last_modified')
            }
            
        except Exception as e:
            raise Exception(f"Erro ao cancelar assinatura: {str(e)}")
    
    def create_pix_payment(self, pix_data: Dict) -> Dict:
        """Cria um pagamento PIX"""
        try:
            payment_data = {
                "transaction_amount": pix_data['amount'],
                "description": pix_data['description'],
                "payment_method_id": "pix",
                "payer": {
                    "email": pix_data['payer_email'],
                    "first_name": pix_data.get('payer_name', ''),
                    "identification": {
                        "type": pix_data.get('payer_doc_type', 'CPF'),
                        "number": pix_data.get('payer_doc_number', '')
                    }
                },
                "external_reference": pix_data.get('external_reference'),
                "notification_url": pix_data.get('notification_url')
            }
            
            # Remover campos vazios
            payment_data = {k: v for k, v in payment_data.items() if v}
            
            idempotency_key = f"pix_{pix_data.get('external_reference')}_{int(datetime.now().timestamp())}"
            
            response = self._make_request(
                'POST', 
                '/v1/payments', 
                payment_data,
                idempotency_key
            )
            
            return {
                'id': response['id'],
                'status': response['status'],
                'qr_code': response.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code'),
                'qr_code_base64': response.get('point_of_interaction', {}).get('transaction_data', {}).get('qr_code_base64'),
                'ticket_url': response.get('point_of_interaction', {}).get('transaction_data', {}).get('ticket_url'),
                'date_created': response['date_created'],
                'date_of_expiration': response.get('date_of_expiration')
            }
            
        except Exception as e:
            raise Exception(f"Erro ao criar pagamento PIX: {str(e)}")
    
    def process_webhook_notification(self, notification_data: Dict) -> Dict:
        """Processa notificação de webhook do Mercado Pago"""
        try:
            notification_type = notification_data.get('type')
            data_id = notification_data.get('data', {}).get('id')
            
            if not notification_type or not data_id:
                raise Exception("Dados de notificação incompletos")
            
            result = {'type': notification_type, 'id': data_id}
            
            if notification_type == 'payment':
                payment_info = self.get_payment_info(data_id)
                result['payment'] = payment_info
                
                # Atualizar pagamento no banco de dados
                self._update_payment_status(data_id, payment_info)
                
            elif notification_type == 'preapproval':
                subscription_info = self.get_subscription_info(data_id)
                result['subscription'] = subscription_info
                
                # Atualizar assinatura no banco de dados
                self._update_subscription_status(data_id, subscription_info)
            
            return result
            
        except Exception as e:
            raise Exception(f"Erro ao processar notificação: {str(e)}")
    
    def _update_payment_status(self, transaction_id: str, payment_info: Dict):
        """Atualiza status do pagamento no banco de dados"""
        try:
            pagamento = Pagamento.query.filter_by(transaction_id=transaction_id).first()
            
            if pagamento:
                # Mapear status do Mercado Pago para nosso sistema
                status_mapping = {
                    'approved': 'aprovado',
                    'pending': 'pendente',
                    'in_process': 'processando',
                    'rejected': 'rejeitado',
                    'cancelled': 'cancelado',
                    'refunded': 'estornado',
                    'charged_back': 'contestado'
                }
                
                pagamento.status = status_mapping.get(payment_info['status'], payment_info['status'])
                pagamento.gateway_response = payment_info
                
                if payment_info['status'] == 'approved':
                    pagamento.data_pagamento = datetime.now()
                    
                    # Ativar assinatura se pagamento aprovado
                    if pagamento.assinatura:
                        pagamento.assinatura.status = 'ativa'
                        pagamento.assinatura.empresa.status = 'ativo'
                
                db.session.commit()
                
        except Exception as e:
            print(f"Erro ao atualizar status do pagamento: {str(e)}")
    
    def _update_subscription_status(self, subscription_id: str, subscription_info: Dict):
        """Atualiza status da assinatura no banco de dados"""
        try:
            # Buscar assinatura pelo external_reference
            external_ref = subscription_info.get('external_reference')
            if external_ref:
                assinatura = Assinatura.query.filter_by(id=int(external_ref.split('_')[-1])).first()
                
                if assinatura:
                    # Mapear status do Mercado Pago para nosso sistema
                    status_mapping = {
                        'authorized': 'ativa',
                        'paused': 'suspensa',
                        'cancelled': 'cancelada',
                        'finished': 'finalizada'
                    }
                    
                    assinatura.status = status_mapping.get(subscription_info['status'], subscription_info['status'])
                    
                    if subscription_info['status'] == 'cancelled':
                        assinatura.data_cancelamento = datetime.now()
                        assinatura.empresa.status = 'suspenso'
                    
                    db.session.commit()
                    
        except Exception as e:
            print(f"Erro ao atualizar status da assinatura: {str(e)}")
    
    def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict:
        """Realiza estorno de um pagamento"""
        try:
            refund_data = {}
            if amount:
                refund_data['amount'] = amount
            
            response = self._make_request(
                'POST', 
                f'/v1/payments/{payment_id}/refunds',
                refund_data if refund_data else None
            )
            
            return {
                'id': response['id'],
                'payment_id': response['payment_id'],
                'amount': response['amount'],
                'status': response['status'],
                'date_created': response['date_created']
            }
            
        except Exception as e:
            raise Exception(f"Erro ao processar estorno: {str(e)}")
    
    def get_payment_methods(self) -> Dict:
        """Obtém métodos de pagamento disponíveis"""
        try:
            response = self._make_request('GET', '/v1/payment_methods')
            
            return {
                'payment_methods': response,
                'credit_cards': [pm for pm in response if pm['payment_type_id'] == 'credit_card'],
                'debit_cards': [pm for pm in response if pm['payment_type_id'] == 'debit_card'],
                'digital_wallets': [pm for pm in response if pm['payment_type_id'] == 'digital_wallet'],
                'bank_transfers': [pm for pm in response if pm['payment_type_id'] == 'bank_transfer']
            }
            
        except Exception as e:
            raise Exception(f"Erro ao obter métodos de pagamento: {str(e)}")

# Instância global do serviço (será configurada na inicialização da app)
mercadopago_service = None

def init_mercadopago_service(access_token: str, environment: str = 'sandbox'):
    """Inicializa o serviço do Mercado Pago"""
    global mercadopago_service
    mercadopago_service = MercadoPagoService(access_token, environment)
    return mercadopago_service

