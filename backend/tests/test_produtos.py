"""
Testes para produtos do Auto Trade AI / Validade Inteligente
"""
import pytest
import json
from datetime import datetime, timedelta
from src.models.produto import Produto, db

class TestProdutos:
    """Testes para rotas de produtos"""
    
    def test_create_produto_success(self, client, auth_headers):
        """Teste de criação de produto bem-sucedida"""
        produto_data = {
            'nome': 'Produto Teste',
            'categoria': 'Categoria Teste',
            'data_validade': '2024-12-31',
            'quantidade': 10,
            'preco': 29.99,
            'fornecedor': 'Fornecedor Teste',
            'codigo_barras': '1234567890123'
        }
        
        response = client.post('/api/produtos', 
                             data=json.dumps(produto_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['produto']['nome'] == produto_data['nome']
        assert data['produto']['categoria'] == produto_data['categoria']
    
    def test_create_produto_missing_fields(self, client, auth_headers):
        """Teste de criação de produto com campos obrigatórios ausentes"""
        produto_data = {
            'nome': 'Produto Incompleto'
            # Outros campos obrigatórios ausentes
        }
        
        response = client.post('/api/produtos', 
                             data=json.dumps(produto_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 400
    
    def test_create_produto_without_auth(self, client):
        """Teste de criação de produto sem autenticação"""
        produto_data = {
            'nome': 'Produto Teste',
            'categoria': 'Categoria Teste',
            'data_validade': '2024-12-31',
            'quantidade': 10,
            'preco': 29.99
        }
        
        response = client.post('/api/produtos', 
                             data=json.dumps(produto_data),
                             content_type='application/json')
        
        assert response.status_code == 401
    
    def test_list_produtos_success(self, client, auth_headers):
        """Teste de listagem de produtos bem-sucedida"""
        # Primeiro criar alguns produtos
        produtos_data = [
            {
                'nome': 'Produto 1',
                'categoria': 'Categoria 1',
                'data_validade': '2024-12-31',
                'quantidade': 10,
                'preco': 19.99,
                'fornecedor': 'Fornecedor 1',
                'codigo_barras': '1111111111111'
            },
            {
                'nome': 'Produto 2',
                'categoria': 'Categoria 2',
                'data_validade': '2024-11-30',
                'quantidade': 5,
                'preco': 39.99,
                'fornecedor': 'Fornecedor 2',
                'codigo_barras': '2222222222222'
            }
        ]
        
        for produto_data in produtos_data:
            client.post('/api/produtos', 
                       data=json.dumps(produto_data),
                       content_type='application/json',
                       headers=auth_headers)
        
        # Listar produtos
        response = client.get('/api/produtos', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'produtos' in data
        assert len(data['produtos']) >= 2
    
    def test_get_produto_by_id_success(self, client, auth_headers):
        """Teste de busca de produto por ID bem-sucedida"""
        # Criar produto
        produto_data = {
            'nome': 'Produto Específico',
            'categoria': 'Categoria Específica',
            'data_validade': '2024-12-31',
            'quantidade': 15,
            'preco': 49.99,
            'fornecedor': 'Fornecedor Específico',
            'codigo_barras': '3333333333333'
        }
        
        create_response = client.post('/api/produtos', 
                                    data=json.dumps(produto_data),
                                    content_type='application/json',
                                    headers=auth_headers)
        
        produto_id = create_response.get_json()['produto']['id']
        
        # Buscar produto por ID
        response = client.get(f'/api/produtos/{produto_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['produto']['nome'] == produto_data['nome']
    
    def test_get_produto_not_found(self, client, auth_headers):
        """Teste de busca de produto inexistente"""
        response = client.get('/api/produtos/99999', headers=auth_headers)
        
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
    
    def test_update_produto_success(self, client, auth_headers):
        """Teste de atualização de produto bem-sucedida"""
        # Criar produto
        produto_data = {
            'nome': 'Produto Original',
            'categoria': 'Categoria Original',
            'data_validade': '2024-12-31',
            'quantidade': 20,
            'preco': 59.99,
            'fornecedor': 'Fornecedor Original',
            'codigo_barras': '4444444444444'
        }
        
        create_response = client.post('/api/produtos', 
                                    data=json.dumps(produto_data),
                                    content_type='application/json',
                                    headers=auth_headers)
        
        produto_id = create_response.get_json()['produto']['id']
        
        # Atualizar produto
        update_data = {
            'nome': 'Produto Atualizado',
            'preco': 69.99,
            'quantidade': 25
        }
        
        response = client.put(f'/api/produtos/{produto_id}', 
                            data=json.dumps(update_data),
                            content_type='application/json',
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['produto']['nome'] == update_data['nome']
        assert data['produto']['preco'] == update_data['preco']
    
    def test_delete_produto_success(self, client, auth_headers):
        """Teste de exclusão de produto bem-sucedida"""
        # Criar produto
        produto_data = {
            'nome': 'Produto Para Deletar',
            'categoria': 'Categoria Delete',
            'data_validade': '2024-12-31',
            'quantidade': 1,
            'preco': 9.99,
            'fornecedor': 'Fornecedor Delete',
            'codigo_barras': '5555555555555'
        }
        
        create_response = client.post('/api/produtos', 
                                    data=json.dumps(produto_data),
                                    content_type='application/json',
                                    headers=auth_headers)
        
        produto_id = create_response.get_json()['produto']['id']
        
        # Deletar produto
        response = client.delete(f'/api/produtos/{produto_id}', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'Produto deletado com sucesso'
        
        # Verificar se produto foi deletado
        get_response = client.get(f'/api/produtos/{produto_id}', headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_get_produtos_vencendo_success(self, client, auth_headers):
        """Teste de busca de produtos próximos ao vencimento"""
        # Criar produto próximo ao vencimento
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        produto_data = {
            'nome': 'Produto Vencendo',
            'categoria': 'Categoria Vencendo',
            'data_validade': tomorrow,
            'quantidade': 5,
            'preco': 19.99,
            'fornecedor': 'Fornecedor Vencendo',
            'codigo_barras': '6666666666666'
        }
        
        client.post('/api/produtos', 
                   data=json.dumps(produto_data),
                   content_type='application/json',
                   headers=auth_headers)
        
        # Buscar produtos vencendo
        response = client.get('/api/produtos/vencendo', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'produtos' in data
        # Deve encontrar pelo menos o produto criado
        assert len(data['produtos']) >= 1
    
    def test_register_sale_success(self, client, auth_headers):
        """Teste de registro de venda bem-sucedido"""
        # Criar produto
        produto_data = {
            'nome': 'Produto Venda',
            'categoria': 'Categoria Venda',
            'data_validade': '2024-12-31',
            'quantidade': 100,
            'preco': 29.99,
            'fornecedor': 'Fornecedor Venda',
            'codigo_barras': '7777777777777'
        }
        
        create_response = client.post('/api/produtos', 
                                    data=json.dumps(produto_data),
                                    content_type='application/json',
                                    headers=auth_headers)
        
        produto_id = create_response.get_json()['produto']['id']
        
        # Registrar venda
        venda_data = {
            'produto_id': produto_id,
            'quantidade': 5,
            'preco_venda': 35.99
        }
        
        response = client.post('/api/vendas', 
                             data=json.dumps(venda_data),
                             content_type='application/json',
                             headers=auth_headers)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['venda']['quantidade'] == venda_data['quantidade']
        assert data['venda']['preco_venda'] == venda_data['preco_venda']