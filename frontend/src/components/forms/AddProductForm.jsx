import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { useNotifications } from "../../contexts/NotificationContext";
import { productService } from "../../services/api";

const AddProductForm = ({
  onClose,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState([]);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    categoria: "",
    fornecedor_id: "",
  });

  // Carregar fornecedores
  useEffect(() => {
    const loadFornecedores = async () => {
      try {
        // Usar supplierService para garantir baseURL e token (axios interceptors)
        const { supplierService } = require("../../services/api");
        const data = await supplierService.getSuppliers();
        setFornecedores(data || []);
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
        addNotification({
          type: "error",
          title: "Erro",
          message: error.message || "Erro ao carregar fornecedores",
        });
      }
    };

    loadFornecedores();
  }, []);

  // Preencher formulário com dados iniciais quando estiver editando
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        codigo: initialData.codigo || "",
        nome: initialData.nome || "",
        categoria: initialData.categoria || "",
        fornecedor_id: initialData.fornecedor_id?.toString() || "",
      });
    }
  }, [initialData, isEditing]);

  const categorias = [
    "Laticínios",
    "Padaria",
    "Frios",
    "Bebidas",
    "Carnes",
    "Frutas e Verduras",
    "Congelados",
    "Higiene",
    "Limpeza",
    "Outros",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (
        !formData.codigo ||
        !formData.nome ||
        !formData.categoria ||
        !formData.fornecedor_id
      ) {
        addNotification({
          type: "error",
          title: "Erro de Validação",
          message: "Por favor, preencha todos os campos obrigatórios.",
        });
        setLoading(false);
        return;
      }

      const productData = {
        codigo: formData.codigo,
        nome: formData.nome,
        categoria: formData.categoria,
        fornecedor_id: parseInt(formData.fornecedor_id),
      };

      if (isEditing) {
        await productService.updateProduct(initialData.id, productData);
      } else {
        await productService.createProduct(productData);
      }

      addNotification({
        type: "success",
        title: isEditing ? "Produto Atualizado" : "Produto Adicionado",
        message: `${formData.nome} foi ${
          isEditing ? "atualizado" : "adicionado"
        } com sucesso!`,
      });

      onSuccess && onSuccess(productData);
      (onClose || onCancel)();
    } catch (error) {
      console.error(
        `Erro ao ${isEditing ? "editar" : "adicionar"} produto:`,
        error
      );
      addNotification({
        type: "error",
        title: "Erro",
        message:
          error.message ||
          `Erro ao ${
            isEditing ? "editar" : "adicionar"
          } produto. Tente novamente.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Código do Produto */}
        <div>
          <label
            htmlFor="codigo"
            className="block text-sm font-medium text-gray-700 mb-1">
            Código do Produto *
          </label>
          <input
            type="text"
            id="codigo"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 001, ABC123"
            required
          />
        </div>

        {/* Nome do Produto */}
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700 mb-1">
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
          <label
            htmlFor="categoria"
            className="block text-sm font-medium text-gray-700 mb-1">
            Categoria *
          </label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required>
            <option value="">Selecione uma categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Fornecedor */}
        <div>
          <label
            htmlFor="fornecedor_id"
            className="block text-sm font-medium text-gray-700 mb-1">
            Fornecedor *
          </label>
          <select
            id="fornecedor_id"
            name="fornecedor_id"
            value={formData.fornecedor_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required>
            <option value="">Selecione um fornecedor</option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome} ({fornecedor.codigo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose || onCancel}
          disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing
              ? "Atualizando..."
              : "Adicionando..."
            : isEditing
            ? "Atualizar Produto"
            : "Adicionar Produto"}
        </Button>
      </div>
    </form>
  );
};

export default AddProductForm;
