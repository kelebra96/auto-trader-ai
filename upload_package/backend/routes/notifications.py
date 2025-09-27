from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
# from services.notification_service import NotificationService
# from middleware.security import validate_json, log_request
from marshmallow import Schema, fields
import time
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

class NotificationPreferencesSchema(Schema):
    expiry_alerts = fields.Boolean()
    stock_alerts = fields.Boolean()
    email_notifications = fields.Boolean()
    push_notifications = fields.Boolean()
    alert_days_before = fields.Integer()

@notifications_bp.route('/notifications', methods=['GET'])
# @jwt_required()  # Temporariamente removido para teste
def get_notifications():
    """Recupera notificações do usuário"""
    try:
        user_id = 1  # ID fixo para teste
        limit = request.args.get('limit', 50, type=int)
        
        # Em uma implementação real, isso viria do serviço de notificações
        # Por enquanto, retornamos dados simulados
        notifications = [
            {
                'id': f"notif_{i}",
                'type': 'warning' if i % 3 == 0 else 'info',
                'title': 'Produto Vencendo' if i % 3 == 0 else 'Informação',
                'message': f'O produto "Exemplo {i}" vence em {i} dias' if i % 3 == 0 else f'Notificação informativa {i}',
                'timestamp': f'2024-02-{10-i:02d}T10:00:00Z',
                'read': i > 3,
                'data': {
                    'product_id': i if i % 3 == 0 else None,
                    'days_until_expiry': i if i % 3 == 0 else None
                }
            } for i in range(1, min(limit + 1, 11))
        ]
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'total': len(notifications),
            'unread_count': len([n for n in notifications if not n['read']])
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao recuperar notificações',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Marca uma notificação como lida"""
    try:
        user_id = get_jwt_identity()
        
        # Em uma implementação real, isso atualizaria o banco de dados
        # Por enquanto, apenas retornamos sucesso
        
        return jsonify({
            'success': True,
            'message': 'Notificação marcada como lida'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao marcar notificação como lida',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Marca todas as notificações como lidas"""
    try:
        user_id = get_jwt_identity()
        
        # Em uma implementação real, isso atualizaria o banco de dados
        # Por enquanto, apenas retornamos sucesso
        
        return jsonify({
            'success': True,
            'message': 'Todas as notificações foram marcadas como lidas'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao marcar notificações como lidas',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Recupera preferências de notificação do usuário"""
    try:
        user_id = get_jwt_identity()
        
        # Em uma implementação real, isso viria do banco de dados
        preferences = {
            'expiry_alerts': True,
            'stock_alerts': True,
            'email_notifications': True,
            'push_notifications': False,
            'alert_days_before': 7
        }
        
        return jsonify({
            'success': True,
            'preferences': preferences
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao recuperar preferências',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Atualiza preferências de notificação do usuário"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Em uma implementação real, isso atualizaria o banco de dados
        # Por enquanto, apenas retornamos os dados recebidos
        
        return jsonify({
            'success': True,
            'message': 'Preferências atualizadas com sucesso',
            'preferences': data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao atualizar preferências',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/test', methods=['POST'])
@jwt_required()
def send_test_notification():
    """Envia uma notificação de teste (apenas para desenvolvimento)"""
    try:
        user_id = get_jwt_identity()
        
        # Simular envio de notificação de teste
        test_notification = {
            'id': f"test_{user_id}_{int(time.time())}",
            'type': 'info',
            'title': 'Notificação de Teste',
            'message': 'Esta é uma notificação de teste do sistema.',
            'timestamp': datetime.now().isoformat(),
            'read': False,
            'data': {
                'test': True
            }
        }
        
        return jsonify({
            'success': True,
            'message': 'Notificação de teste enviada',
            'notification': test_notification
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao enviar notificação de teste',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/check-expiring', methods=['POST'])
@jwt_required()
def check_expiring_products():
    """Força verificação de produtos vencendo"""
    try:
        user_id = get_jwt_identity()
        days_ahead = request.json.get('days_ahead', 7) if request.json else 7
        
        # Em uma implementação real, isso chamaria o serviço de notificações
        # Por enquanto, retornamos dados simulados
        
        result = {
            'products_found': 3,
            'notifications_sent': 1
        }
        
        return jsonify({
            'success': True,
            'message': 'Verificação de produtos vencendo concluída',
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao verificar produtos vencendo',
            'error': str(e)
        }), 500

@notifications_bp.route('/notifications/check-stock', methods=['POST'])
@jwt_required()
def check_low_stock():
    """Força verificação de estoque baixo"""
    try:
        user_id = get_jwt_identity()
        threshold = request.json.get('threshold', 10) if request.json else 10
        
        # Em uma implementação real, isso chamaria o serviço de notificações
        # Por enquanto, retornamos dados simulados
        
        result = {
            'products_found': 2,
            'notifications_sent': 1
        }
        
        return jsonify({
            'success': True,
            'message': 'Verificação de estoque baixo concluída',
            'result': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Erro ao verificar estoque baixo',
            'error': str(e)
        }), 500