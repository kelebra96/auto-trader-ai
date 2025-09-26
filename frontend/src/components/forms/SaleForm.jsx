import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  CreditCard,
  FileText,
} from "lucide-react";

const SaleForm = ({ isOpen, onClose, onSaleCreated }) => {
  const [formData, setFormData] = useState({
    produto_id: "",
    quantidade: "",
    preco_unitario: "",
    metodo_pagamento: "dinheiro",
    observacoes: "",
    data_venda: new Date().toISOString().split("T")[0],
  });
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchProdutos();
    }
  }, [isOpen]);

  const fetchProdutos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/produtos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProdutos(
          data.produtos.filter((p) => p.status === "ativo" && p.quantidade > 0)
        );
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/vendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantidade: parseInt(formData.quantidade),
          preco_unitario: parseFloat(formData.preco_unitario),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSaleCreated && onSaleCreated(data.venda);
        onClose();
        setFormData({
          produto_id: "",
          quantidade: "",
          preco_unitario: "",
          metodo_pagamento: "dinheiro",
          observacoes: "",
          data_venda: new Date().toISOString().split("T")[0],
        });
      } else {
        setError(data.error || "Erro ao registrar venda");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectedProduct = produtos.find(
    (p) => p.id === parseInt(formData.produto_id)
  );
  const valorTotal =
    formData.quantidade && formData.preco_unitario
      ? (
          parseInt(formData.quantidade) * parseFloat(formData.preco_unitario)
        ).toFixed(2)
      : "0.00";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            Registrar Venda
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package className="inline mr-1" size={16} />
              Produto
            </label>
            <select
              name="produto_id"
              value={formData.produto_id}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Selecione um produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} (Estoque: {produto.quantidade})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Categoria:</strong> {selectedProduct.categoria}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Preço de Venda:</strong> R${" "}
                {selectedProduct.preco_venda}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Estoque Disponível:</strong>{" "}
                {selectedProduct.quantidade}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade
            </label>
            <input
              type="number"
              name="quantidade"
              value={formData.quantidade}
              onChange={handleChange}
              min="1"
              max={selectedProduct?.quantidade || 999}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="inline mr-1" size={16} />
              Preço Unitário (R$)
            </label>
            <input
              type="number"
              name="preco_unitario"
              value={formData.preco_unitario}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-lg font-semibold text-blue-800">
              Valor Total: R$ {valorTotal}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline mr-1" size={16} />
              Data da Venda
            </label>
            <input
              type="date"
              name="data_venda"
              value={formData.data_venda}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CreditCard className="inline mr-1" size={16} />
              Método de Pagamento
            </label>
            <select
              name="metodo_pagamento"
              value={formData.metodo_pagamento}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
              <option value="boleto">Boleto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="inline mr-1" size={16} />
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre a venda (opcional)"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? "Registrando..." : "Registrar Venda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;
