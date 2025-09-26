import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useNotifications } from '../../contexts/NotificationContext';
import { productService } from '../../services/api';

const AddProductForm = ({ onClose, onSuccess, onCancel, initialData, isEditing = false }) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    preco: '',
    estoque: '',
    data_validade: '',
    codigo_barras: '',
    descricao: '',
    fornecedor: '',
    localizacao: ''
  });

  // Preencher formulário com dados iniciais quando estiver editando
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        nome: initialData.nome || '',
        categoria: initialData.categoria || '',
        preco: initialData.preco?.toString() || '',
        estoque: initialData.estoque?.toString() || '',
        data_validade: initialData.data_validade || '',
        codigo_barras: initialData.codigo_barras || '',
        descricao: initialData.descricao || '',
        fornecedor: initialData.fornecedor || '',
        localizacao: initialData.localizacao || ''
      });
    }
  }, [initialData, isEditing]);

  const categorias = [
    'Laticínios',
    'Padaria',
    'Frios',
    'Bebidas',
    'Carnes',
    'Frutas e Verduras',
    'Congelados',
    'Higiene',
    'Limpeza',
    'Outros'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (!formData.nome || !formData.categoria || !formData.preco || !formData.estoque) {
        addNotification({
          type: 'error',
          title: 'Erro de Validação',
          message: 'Por favor, preencha todos os campos obrigatórios.'
        });
        setLoading(false);
        return;
      }

      const productData = {
        ...formData,
        preco_venda: parseFloat(formData.preco),
        quantidade: parseInt(formData.estoque)
      };
      
      // Remover campos que não existem no backend
      delete productData.preco;
      delete productData.estoque;

      if (isEditing) {
        await productService.updateProduct(initialData.id, productData);
      } else {
        await productService.createProduct(productData);
      }

      addNotification({
        type: 'success',
        title: isEditing ? 'Produto Atualizado' : 'Produto Adicionado',
        message: `${formData.nome} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`
      });

      onSuccess && onSuccess(productData);
      (onClose || onCancel)();
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'editar' : 'adicionar'} produto:`, error);
      addNotification({
        type: 'error',
        title: 'Erro',
        message: error.message || `Erro ao ${isEditing ? 'editar' : 'adicionar'} produto. Tente novamente.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome do Produto */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Leite Integral 1L"
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria *
          </label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Preço */}
        <div>
          <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">
            Preço (R$) *
          </label>
          <input
            type="number"
            id="preco"
            name="preco"
            value={formData.preco}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
            required
          />
        </div>

        {/* Estoque */}
        <div>
          <label htmlFor="estoque" className="block text-sm font-medium text-gray-700 mb-1">
            Quantidade em Estoque *
          </label>
          <input
            type="number"
            id="estoque"
            name="estoque"
            value={formData.estoque}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            required
          />
        </div>

        {/* Data de Validade */}
        <div>
          <label htmlFor="data_validade" className="block text-sm font-medium text-gray-700 mb-1">
            Data de Validade
          </label>
          <input
            type="date"
            id="data_validade"
            name="data_validade"
            value={formData.data_validade}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Código de Barras */}
        <div>
          <label htmlFor="codigo_barras" className="block text-sm font-medium text-gray-700 mb-1">
            Código de Barras
          </label>
          <input
            type="text"
            id="codigo_barras"
            name="codigo_barras"
            value={formData.codigo_barras}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 7891234567890"
          />
        </div>

        {/* Fornecedor */}
        <div>
          <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700 mb-1">
            Fornecedor
          </label>
          <input
            type="text"
            id="fornecedor"
            name="fornecedor"
            value={formData.fornecedor}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome do fornecedor"
          />
        </div>

        {/* Localização */}
        <div>
          <label htmlFor="localizacao" className="block text-sm font-medium text-gray-700 mb-1">
            Localização no Estoque
          </label>
          <input
            type="text"
            id="localizacao"
            name="localizacao"
            value={formData.localizacao}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Prateleira A1, Geladeira 2"
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          value={formData.descricao}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Descrição adicional do produto..."
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading 
            ? (isEditing ? 'Atualizando...' : 'Adicionando...') 
            : (isEditing ? 'Atualizar Produto' : 'Adicionar Produto')
          }
        </Button>
      </div>
    </form>
  );
};

export default AddProductForm;