from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from src.models.user import db
from src.models.produto import Produto
from src.models.ia_vectorization import (
    EmbeddingProduto, PredicaoIA, SessaoChat, MensagemChat, 
    RecomendacaoIA, AnaliseTexto
)
from src.services.openai_service import openai_service
from src.utils.decorators import empresa_access_required, feature_required
import time
import json

ia_bp = Blueprint('ia', __name__)

@ia_bp.route('/ia/predicoes/vencimento', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('ia_preditiva')
def predict_expiry_risk():
    """Prediz risco de vencimento para produtos"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        produto_ids = data.get('produto_ids', [])
        if not produto_ids:
            return jsonify({'error': 'Lista de produtos é obrigatória'}), 400
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        results = []
        
        for produto_id in produto_ids:
            produto = Produto.query.filter_by(
                id=produto_id, empresa_id=empresa_id
            ).first()
            
            if not produto:
                results.append({
                    'produto_id': produto_id,
                    'erro': 'Produto não encontrado'
                })
                continue
            
            # Verificar se já existe predição recente
            predicao_recente = PredicaoIA.query.filter_by(
                produto_id=produto_id,
                tipo_predicao='expiry_risk'
            ).filter(
                PredicaoIA.created_at >= datetime.now() - timedelta(hours=6)
            ).first()
            
            if predicao_recente:
                results.append({
                    'produto_id': produto_id,
                    'produto_nome': produto.nome,
                    'predicao': predicao_recente.resultado,
                    'confianca': float(predicao_recente.confianca) if predicao_recente.confianca else None,
                    'cached': True,
                    'created_at': predicao_recente.created_at.isoformat()
                })
                continue
            
            # Gerar nova predição
            start_time = time.time()
            
            try:
                prediction = openai_service.predict_expiry_risk(produto)
                processing_time = int((time.time() - start_time) * 1000)
                
                # Salvar predição no banco
                predicao = PredicaoIA(
                    empresa_id=empresa_id,
                    produto_id=produto_id,
                    tipo_predicao='expiry_risk',
                    entrada={
                        'produto_data': openai_service._prepare_product_data(produto)
                    },
                    resultado=prediction,
                    confianca=prediction.get('confianca', 0.0),
                    modelo_utilizado=openai_service.chat_model,
                    tempo_processamento=processing_time
                )
                
                db.session.add(predicao)
                
                results.append({
                    'produto_id': produto_id,
                    'produto_nome': produto.nome,
                    'predicao': prediction,
                    'confianca': prediction.get('confianca', 0.0),
                    'cached': False,
                    'processing_time_ms': processing_time
                })
                
            except Exception as e:
                results.append({
                    'produto_id': produto_id,
                    'produto_nome': produto.nome,
                    'erro': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'results': results,
            'total_processed': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/sugestoes/precos', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('ia_preditiva')
def suggest_pricing():
    """Gera sugestões de preços usando IA"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        produto_ids = data.get('produto_ids', [])
        if not produto_ids:
            return jsonify({'error': 'Lista de produtos é obrigatória'}), 400
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        results = []
        
        for produto_id in produto_ids:
            produto = Produto.query.filter_by(
                id=produto_id, empresa_id=empresa_id
            ).first()
            
            if not produto:
                results.append({
                    'produto_id': produto_id,
                    'erro': 'Produto não encontrado'
                })
                continue
            
            try:
                start_time = time.time()
                suggestion = openai_service.generate_pricing_suggestions(produto)
                processing_time = int((time.time() - start_time) * 1000)
                
                # Salvar predição
                predicao = PredicaoIA(
                    empresa_id=empresa_id,
                    produto_id=produto_id,
                    tipo_predicao='pricing',
                    entrada={
                        'produto_data': openai_service._prepare_product_data(produto)
                    },
                    resultado=suggestion,
                    confianca=suggestion.get('confianca', 0.0),
                    modelo_utilizado=openai_service.chat_model,
                    tempo_processamento=processing_time
                )
                
                db.session.add(predicao)
                
                results.append({
                    'produto_id': produto_id,
                    'produto_nome': produto.nome,
                    'sugestao': suggestion,
                    'processing_time_ms': processing_time
                })
                
            except Exception as e:
                results.append({
                    'produto_id': produto_id,
                    'produto_nome': produto.nome,
                    'erro': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'results': results,
            'total_processed': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/analise/estoque', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('ia_preditiva')
def analyze_inventory():
    """Analisa padrões de estoque usando IA"""
    try:
        empresa_id = request.empresa_id
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        # Verificar análise recente
        analise_recente = PredicaoIA.query.filter_by(
            empresa_id=empresa_id,
            tipo_predicao='inventory_analysis'
        ).filter(
            PredicaoIA.created_at >= datetime.now() - timedelta(hours=12)
        ).first()
        
        if analise_recente:
            return jsonify({
                'analise': analise_recente.resultado,
                'confianca': float(analise_recente.confianca) if analise_recente.confianca else None,
                'cached': True,
                'created_at': analise_recente.created_at.isoformat()
            })
        
        # Gerar nova análise
        start_time = time.time()
        analysis = openai_service.analyze_inventory_patterns(empresa_id)
        processing_time = int((time.time() - start_time) * 1000)
        
        # Salvar análise
        predicao = PredicaoIA(
            empresa_id=empresa_id,
            tipo_predicao='inventory_analysis',
            entrada={'empresa_id': empresa_id},
            resultado=analysis,
            confianca=analysis.get('score_otimizacao', 0.0),
            modelo_utilizado=openai_service.chat_model,
            tempo_processamento=processing_time
        )
        
        db.session.add(predicao)
        db.session.commit()
        
        return jsonify({
            'analise': analysis,
            'confianca': analysis.get('score_otimizacao', 0.0),
            'cached': False,
            'processing_time_ms': processing_time,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/alertas/inteligentes', methods=['GET'])
@jwt_required()
@empresa_access_required
@feature_required('alertas_inteligentes')
def get_smart_alerts():
    """Obtém alertas inteligentes gerados pela IA"""
    try:
        empresa_id = request.empresa_id
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        alerts = openai_service.generate_smart_alerts(empresa_id)
        
        return jsonify({
            'alertas': alerts,
            'total': len(alerts),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/chat/sessoes', methods=['GET'])
@jwt_required()
@empresa_access_required
@feature_required('chat_ia')
def list_chat_sessions():
    """Lista sessões de chat do usuário"""
    try:
        empresa_id = request.empresa_id
        user_id = request.user_id
        
        sessoes = SessaoChat.query.filter_by(
            empresa_id=empresa_id,
            usuario_id=user_id
        ).order_by(SessaoChat.updated_at.desc()).limit(20).all()
        
        return jsonify({
            'sessoes': [sessao.to_dict() for sessao in sessoes]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/chat/sessoes', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('chat_ia')
def create_chat_session():
    """Cria nova sessão de chat"""
    try:
        empresa_id = request.empresa_id
        user_id = request.user_id
        data = request.get_json()
        
        sessao = SessaoChat(
            empresa_id=empresa_id,
            usuario_id=user_id,
            titulo=data.get('titulo', 'Nova conversa'),
            contexto=data.get('contexto', {})
        )
        
        db.session.add(sessao)
        db.session.commit()
        
        return jsonify({
            'sessao': sessao.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/chat/sessoes/<int:sessao_id>/mensagens', methods=['GET'])
@jwt_required()
@empresa_access_required
@feature_required('chat_ia')
def get_chat_messages(sessao_id):
    """Obtém mensagens de uma sessão de chat"""
    try:
        empresa_id = request.empresa_id
        user_id = request.user_id
        
        sessao = SessaoChat.query.filter_by(
            id=sessao_id,
            empresa_id=empresa_id,
            usuario_id=user_id
        ).first_or_404()
        
        mensagens = MensagemChat.query.filter_by(
            sessao_id=sessao_id
        ).order_by(MensagemChat.created_at.asc()).all()
        
        return jsonify({
            'sessao': sessao.to_dict(),
            'mensagens': [msg.to_dict() for msg in mensagens]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/chat/sessoes/<int:sessao_id>/mensagens', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('chat_ia')
def send_chat_message(sessao_id):
    """Envia mensagem no chat e obtém resposta da IA"""
    try:
        empresa_id = request.empresa_id
        user_id = request.user_id
        data = request.get_json()
        
        if not data.get('mensagem'):
            return jsonify({'error': 'Mensagem é obrigatória'}), 400
        
        sessao = SessaoChat.query.filter_by(
            id=sessao_id,
            empresa_id=empresa_id,
            usuario_id=user_id
        ).first_or_404()
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        # Salvar mensagem do usuário
        mensagem_user = MensagemChat(
            sessao_id=sessao_id,
            tipo='user',
            conteudo=data['mensagem']
        )
        db.session.add(mensagem_user)
        
        # Gerar resposta da IA
        start_time = time.time()
        
        response = openai_service.chat_with_data(
            empresa_id=empresa_id,
            question=data['mensagem'],
            context=sessao.contexto
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Salvar resposta da IA
        mensagem_ia = MensagemChat(
            sessao_id=sessao_id,
            tipo='assistant',
            conteudo=response['resposta'],
            metadados={
                'modelo': response.get('modelo'),
                'empresa_id': empresa_id
            },
            tempo_resposta=processing_time
        )
        db.session.add(mensagem_ia)
        
        # Atualizar sessão
        sessao.updated_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'mensagem_user': mensagem_user.to_dict(),
            'mensagem_ia': mensagem_ia.to_dict(),
            'processing_time_ms': processing_time
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/recomendacoes', methods=['GET'])
@jwt_required()
@empresa_access_required
@feature_required('recomendacoes_ia')
def list_recommendations():
    """Lista recomendações da IA para a empresa"""
    try:
        empresa_id = request.empresa_id
        status = request.args.get('status', 'pendente')
        prioridade = request.args.get('prioridade')
        tipo = request.args.get('tipo')
        
        query = RecomendacaoIA.query.filter_by(empresa_id=empresa_id)
        
        if status:
            query = query.filter(RecomendacaoIA.status == status)
        
        if prioridade:
            query = query.filter(RecomendacaoIA.prioridade == prioridade)
        
        if tipo:
            query = query.filter(RecomendacaoIA.tipo_recomendacao == tipo)
        
        recomendacoes = query.filter(
            RecomendacaoIA.valida_ate.is_(None) | 
            (RecomendacaoIA.valida_ate >= datetime.now())
        ).order_by(
            RecomendacaoIA.prioridade.desc(),
            RecomendacaoIA.created_at.desc()
        ).all()
        
        return jsonify({
            'recomendacoes': [rec.to_dict() for rec in recomendacoes],
            'total': len(recomendacoes)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/recomendacoes/<int:recomendacao_id>/implementar', methods=['POST'])
@jwt_required()
@empresa_access_required
def implement_recommendation(recomendacao_id):
    """Marca recomendação como implementada"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        recomendacao = RecomendacaoIA.query.filter_by(
            id=recomendacao_id,
            empresa_id=empresa_id
        ).first_or_404()
        
        feedback = data.get('feedback', {})
        recomendacao.mark_as_implemented(feedback)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Recomendação marcada como implementada',
            'recomendacao': recomendacao.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/embeddings/produtos', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('busca_inteligente')
def generate_product_embeddings():
    """Gera embeddings para produtos"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        produto_ids = data.get('produto_ids', [])
        force_regenerate = data.get('force_regenerate', False)
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        if not produto_ids:
            # Gerar para todos os produtos da empresa
            produtos = Produto.query.filter_by(
                empresa_id=empresa_id, status='ativo'
            ).all()
        else:
            produtos = Produto.query.filter(
                Produto.id.in_(produto_ids),
                Produto.empresa_id == empresa_id
            ).all()
        
        results = []
        
        for produto in produtos:
            try:
                # Verificar se já existe embedding
                existing_embedding = EmbeddingProduto.query.filter_by(
                    produto_id=produto.id
                ).first()
                
                if existing_embedding and not force_regenerate:
                    results.append({
                        'produto_id': produto.id,
                        'status': 'skipped',
                        'message': 'Embedding já existe'
                    })
                    continue
                
                # Gerar embedding
                embedding_vector = openai_service.generate_product_embedding(produto)
                
                if existing_embedding:
                    # Atualizar embedding existente
                    existing_embedding.set_embedding_array(np.array(embedding_vector))
                    existing_embedding.updated_at = datetime.now()
                    existing_embedding.versao_modelo = openai_service.embedding_model
                else:
                    # Criar novo embedding
                    new_embedding = EmbeddingProduto(
                        produto_id=produto.id,
                        versao_modelo=openai_service.embedding_model,
                        metadados={
                            'produto_nome': produto.nome,
                            'categoria': produto.categoria.nome if produto.categoria else None
                        }
                    )
                    new_embedding.set_embedding_array(np.array(embedding_vector))
                    db.session.add(new_embedding)
                
                results.append({
                    'produto_id': produto.id,
                    'produto_nome': produto.nome,
                    'status': 'success'
                })
                
            except Exception as e:
                results.append({
                    'produto_id': produto.id,
                    'produto_nome': produto.nome,
                    'status': 'error',
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'results': results,
            'total_processed': len(results),
            'successful': len([r for r in results if r['status'] == 'success']),
            'errors': len([r for r in results if r['status'] == 'error'])
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/busca/produtos', methods=['POST'])
@jwt_required()
@empresa_access_required
@feature_required('busca_inteligente')
def search_products_by_similarity():
    """Busca produtos por similaridade semântica"""
    try:
        empresa_id = request.empresa_id
        data = request.get_json()
        
        query_text = data.get('query')
        limit = min(data.get('limit', 10), 50)
        
        if not query_text:
            return jsonify({'error': 'Texto de busca é obrigatório'}), 400
        
        if not openai_service:
            return jsonify({'error': 'Serviço de IA não configurado'}), 500
        
        # Gerar embedding da consulta
        query_embedding = openai_service.generate_embedding(query_text)
        
        # Buscar produtos similares
        similar_embeddings = EmbeddingProduto.find_similar(
            query_embedding, limit=limit
        )
        
        # Filtrar por empresa e obter produtos
        results = []
        for embedding in similar_embeddings:
            produto = embedding.produto
            if produto and produto.empresa_id == empresa_id and produto.status == 'ativo':
                produto_data = produto.to_dict()
                produto_data['similarity_score'] = 0.8  # Placeholder - calcular similaridade real
                results.append(produto_data)
        
        return jsonify({
            'query': query_text,
            'results': results,
            'total': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ia_bp.route('/ia/historico/predicoes', methods=['GET'])
@jwt_required()
@empresa_access_required
def get_prediction_history():
    """Obtém histórico de predições da empresa"""
    try:
        empresa_id = request.empresa_id
        tipo = request.args.get('tipo')
        produto_id = request.args.get('produto_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = PredicaoIA.query.filter_by(empresa_id=empresa_id)
        
        if tipo:
            query = query.filter(PredicaoIA.tipo_predicao == tipo)
        
        if produto_id:
            query = query.filter(PredicaoIA.produto_id == produto_id)
        
        predicoes = query.order_by(PredicaoIA.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        predicoes_data = []
        for predicao in predicoes.items:
            predicao_data = predicao.to_dict()
            if predicao.produto:
                predicao_data['produto_nome'] = predicao.produto.nome
            predicoes_data.append(predicao_data)
        
        return jsonify({
            'predicoes': predicoes_data,
            'total': predicoes.total,
            'pages': predicoes.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

