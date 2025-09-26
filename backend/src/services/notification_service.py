from datetime import datetime, timedelta
from typing import List, Dict, Optional
from flask_socketio import SocketIO, emit, join_room, leave_room
from sqlalchemy import and_, or_
from ..models.produto import Produto
from ..models.user import User
from ..utils.logger import BusinessLogger

class NotificationService:
    def __init__(self, socketio: SocketIO, db):
        self.socketio = socketio
        self.db = db
        self.logger = BusinessLogger()
        self.connected_users = {}  # user_id -> session_id mapping
        
    def connect_user(self, user_id: int, session_id: str):
        """Conecta um usuário ao sistema de notificações"""
        self.connected_users[user_id] = session_id
        join_room(f"user_{user_id}")
        self.logger.log_event(
            'user_connected',
            user_id=user_id,
            session_id=session_id
        )
        
    def disconnect_user(self, user_id: int):
        """Desconecta um usuário do sistema de notificações"""
        if user_id in self.connected_users:
            leave_room(f"user_{user_id}")
            del self.connected_users[user_id]
            self.logger.log_event(
                'user_disconnected',
                user_id=user_id
            )
    
    def send_notification(self, user_id: int, notification: Dict):
        """Envia uma notificação para um usuário específico"""
        notification_data = {
            'id': f"{datetime.now().timestamp()}_{user_id}",
            'timestamp': datetime.now().isoformat(),
            'read': False,
            **notification
        }
        
        # Enviar via WebSocket se o usuário estiver conectado
        if user_id in self.connected_users:
            self.socketio.emit(
                'notification',
                notification_data,
                room=f"user_{user_id}"
            )
        
        # Log da notificação
        self.logger.log_event(
            'notification_sent',
            user_id=user_id,
            notification_type=notification.get('type'),
            message=notification.get('message')
        )
        
        return notification_data
    
    def send_bulk_notification(self, user_ids: List[int], notification: Dict):
        """Envia uma notificação para múltiplos usuários"""
        results = []
        for user_id in user_ids:
            result = self.send_notification(user_id, notification)
            results.append(result)
        return results
    
    def check_expiring_products(self, days_ahead: int = 7):
        """Verifica produtos próximos ao vencimento e envia notificações"""
        try:
            cutoff_date = datetime.now().date() + timedelta(days=days_ahead)
            
            # Buscar produtos vencendo
            expiring_products = self.db.session.query(Produto).filter(
                and_(
                    Produto.data_validade <= cutoff_date,
                    Produto.data_validade >= datetime.now().date(),
                    Produto.ativo == True
                )
            ).all()
            
            # Agrupar por usuário
            user_products = {}
            for product in expiring_products:
                if product.usuario_id not in user_products:
                    user_products[product.usuario_id] = []
                user_products[product.usuario_id].append(product)
            
            # Enviar notificações
            notifications_sent = 0
            for user_id, products in user_products.items():
                days_until_expiry = (products[0].data_validade - datetime.now().date()).days
                
                if len(products) == 1:
                    message = f"O produto '{products[0].nome}' vence em {days_until_expiry} dias"
                else:
                    message = f"{len(products)} produtos vencem em {days_until_expiry} dias"
                
                notification = {
                    'type': 'warning' if days_until_expiry > 3 else 'error',
                    'title': 'Produtos Vencendo',
                    'message': message,
                    'data': {
                        'products': [
                            {
                                'id': p.id,
                                'nome': p.nome,
                                'data_validade': p.data_validade.isoformat(),
                                'categoria': p.categoria
                            } for p in products
                        ],
                        'days_until_expiry': days_until_expiry
                    }
                }
                
                self.send_notification(user_id, notification)
                notifications_sent += 1
            
            self.logger.log_event(
                'expiry_check_completed',
                products_found=len(expiring_products),
                notifications_sent=notifications_sent
            )
            
            return {
                'products_found': len(expiring_products),
                'notifications_sent': notifications_sent
            }
            
        except Exception as e:
            self.logger.log_event(
                'expiry_check_error',
                error=str(e)
            )
            raise
    
    def check_low_stock(self, threshold: int = 10):
        """Verifica produtos com estoque baixo e envia notificações"""
        try:
            low_stock_products = self.db.session.query(Produto).filter(
                and_(
                    Produto.quantidade <= threshold,
                    Produto.quantidade > 0,
                    Produto.ativo == True
                )
            ).all()
            
            # Agrupar por usuário
            user_products = {}
            for product in low_stock_products:
                if product.usuario_id not in user_products:
                    user_products[product.usuario_id] = []
                user_products[product.usuario_id].append(product)
            
            # Enviar notificações
            notifications_sent = 0
            for user_id, products in user_products.items():
                if len(products) == 1:
                    message = f"Estoque baixo: '{products[0].nome}' ({products[0].quantidade} unidades)"
                else:
                    message = f"{len(products)} produtos com estoque baixo"
                
                notification = {
                    'type': 'warning',
                    'title': 'Estoque Baixo',
                    'message': message,
                    'data': {
                        'products': [
                            {
                                'id': p.id,
                                'nome': p.nome,
                                'quantidade': p.quantidade,
                                'categoria': p.categoria
                            } for p in products
                        ]
                    }
                }
                
                self.send_notification(user_id, notification)
                notifications_sent += 1
            
            self.logger.log_event(
                'low_stock_check_completed',
                products_found=len(low_stock_products),
                notifications_sent=notifications_sent
            )
            
            return {
                'products_found': len(low_stock_products),
                'notifications_sent': notifications_sent
            }
            
        except Exception as e:
            self.logger.log_event(
                'low_stock_check_error',
                error=str(e)
            )
            raise
    
    def send_welcome_notification(self, user_id: int):
        """Envia notificação de boas-vindas para novos usuários"""
        notification = {
            'type': 'success',
            'title': 'Bem-vindo ao Validade Inteligente!',
            'message': 'Sua conta foi criada com sucesso. Comece adicionando seus primeiros produtos.',
            'data': {
                'action': 'welcome',
                'redirect': '/produtos/novo'
            }
        }
        
        return self.send_notification(user_id, notification)
    
    def send_product_added_notification(self, user_id: int, product_name: str):
        """Envia notificação quando um produto é adicionado"""
        notification = {
            'type': 'success',
            'title': 'Produto Adicionado',
            'message': f"'{product_name}' foi adicionado ao seu estoque.",
            'data': {
                'action': 'product_added',
                'product_name': product_name
            }
        }
        
        return self.send_notification(user_id, notification)
    
    def send_sale_registered_notification(self, user_id: int, product_name: str, quantity: int):
        """Envia notificação quando uma venda é registrada"""
        notification = {
            'type': 'info',
            'title': 'Venda Registrada',
            'message': f"Venda de {quantity}x '{product_name}' registrada com sucesso.",
            'data': {
                'action': 'sale_registered',
                'product_name': product_name,
                'quantity': quantity
            }
        }
        
        return self.send_notification(user_id, notification)
    
    def get_user_notifications(self, user_id: int, limit: int = 50) -> List[Dict]:
        """Recupera notificações recentes de um usuário (simulado)"""
        # Em uma implementação real, isso viria de um banco de dados
        # Por enquanto, retornamos notificações de exemplo
        return [
            {
                'id': f"notif_{i}",
                'type': 'info',
                'title': f'Notificação {i}',
                'message': f'Esta é uma notificação de exemplo {i}',
                'timestamp': (datetime.now() - timedelta(hours=i)).isoformat(),
                'read': i > 3
            } for i in range(1, min(limit + 1, 11))
        ]