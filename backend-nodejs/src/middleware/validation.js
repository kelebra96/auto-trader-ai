const Joi = require("joi");
const { AppError } = require("./errorHandler");

// Middleware de validação
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message.replace(/"/g, ""))
        .join(", ");

      throw new AppError(errorMessage, 400);
    }

    next();
  };
};

// Schemas de validação para autenticação
const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter um formato válido",
      "any.required": "Email é obrigatório",
    }),
    senha: Joi.string().min(6).required().messages({
      "string.min": "Senha deve ter pelo menos 6 caracteres",
      "any.required": "Senha é obrigatória",
    }),
    nome_estabelecimento: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome do estabelecimento deve ter pelo menos 2 caracteres",
      "string.max": "Nome do estabelecimento deve ter no máximo 100 caracteres",
      "any.required": "Nome do estabelecimento é obrigatório",
    }),
    papel: Joi.string().valid("admin", "usuario").default("usuario").messages({
      "any.only": "Papel deve ser admin ou usuario",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter um formato válido",
      "any.required": "Email é obrigatório",
    }),
    senha: Joi.string().required().messages({
      "any.required": "Senha é obrigatória",
    }),
  }),

  changePassword: Joi.object({
    senha_atual: Joi.string().required().messages({
      "any.required": "Senha atual é obrigatória",
    }),
    nova_senha: Joi.string().min(6).required().messages({
      "string.min": "Nova senha deve ter pelo menos 6 caracteres",
      "any.required": "Nova senha é obrigatória",
    }),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter um formato válido",
      "any.required": "Email é obrigatório",
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Token é obrigatório",
    }),
    nova_senha: Joi.string().min(6).required().messages({
      "string.min": "Nova senha deve ter pelo menos 6 caracteres",
      "any.required": "Nova senha é obrigatória",
    }),
  }),
};

// Schemas de validação para usuários
const userSchemas = {
  update: Joi.object({
    nome_estabelecimento: Joi.string().min(2).max(100).messages({
      "string.min": "Nome do estabelecimento deve ter pelo menos 2 caracteres",
      "string.max": "Nome do estabelecimento deve ter no máximo 100 caracteres",
    }),
    email: Joi.string().email().messages({
      "string.email": "Email deve ter um formato válido",
    }),
    papel: Joi.string().valid("admin", "usuario").messages({
      "any.only": "Papel deve ser admin ou usuario",
    }),
    ativo: Joi.boolean(),
  }),

  create: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email deve ter um formato válido",
      "any.required": "Email é obrigatório",
    }),
    senha: Joi.string().min(6).required().messages({
      "string.min": "Senha deve ter pelo menos 6 caracteres",
      "any.required": "Senha é obrigatória",
    }),
    nome_estabelecimento: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome do estabelecimento deve ter pelo menos 2 caracteres",
      "string.max": "Nome do estabelecimento deve ter no máximo 100 caracteres",
      "any.required": "Nome do estabelecimento é obrigatório",
    }),
    papel: Joi.string().valid("admin", "usuario").default("usuario").messages({
      "any.only": "Papel deve ser admin ou usuario",
    }),
    ativo: Joi.boolean().default(true),
  }),
};

// Schemas de validação para produtos
const productSchemas = {
  create: Joi.object({
    nome: Joi.string().min(2).max(100).required().messages({
      "string.min": "Nome deve ter pelo menos 2 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
      "any.required": "Nome é obrigatório",
    }),
    codigo_barras: Joi.string().max(50).messages({
      "string.max": "Código de barras deve ter no máximo 50 caracteres",
    }),
    preco: Joi.number().positive().precision(2).required().messages({
      "number.positive": "Preço deve ser um valor positivo",
      "any.required": "Preço é obrigatório",
    }),
    categoria: Joi.string().max(50).messages({
      "string.max": "Categoria deve ter no máximo 50 caracteres",
    }),
    descricao: Joi.string().max(500).messages({
      "string.max": "Descrição deve ter no máximo 500 caracteres",
    }),
    fornecedor_id: Joi.number().integer().positive().messages({
      "number.integer": "ID do fornecedor deve ser um número inteiro",
      "number.positive": "ID do fornecedor deve ser positivo",
    }),
    empresa_id: Joi.number().integer().positive().required().messages({
      "number.integer": "ID da empresa deve ser um número inteiro",
      "number.positive": "ID da empresa deve ser positivo",
      "any.required": "ID da empresa é obrigatório",
    }),
  }),

  update: Joi.object({
    nome: Joi.string().min(2).max(100).messages({
      "string.min": "Nome deve ter pelo menos 2 caracteres",
      "string.max": "Nome deve ter no máximo 100 caracteres",
    }),
    codigo_barras: Joi.string().max(50).allow("").messages({
      "string.max": "Código de barras deve ter no máximo 50 caracteres",
    }),
    preco: Joi.number().positive().precision(2).messages({
      "number.positive": "Preço deve ser um valor positivo",
    }),
    categoria: Joi.string().max(50).allow("").messages({
      "string.max": "Categoria deve ter no máximo 50 caracteres",
    }),
    descricao: Joi.string().max(500).allow("").messages({
      "string.max": "Descrição deve ter no máximo 500 caracteres",
    }),
    fornecedor_id: Joi.number().integer().positive().allow(null).messages({
      "number.integer": "ID do fornecedor deve ser um número inteiro",
      "number.positive": "ID do fornecedor deve ser positivo",
    }),
  }),
};

// Schema de validação para parâmetros de ID
const idSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.integer": "ID deve ser um número inteiro",
    "number.positive": "ID deve ser positivo",
    "any.required": "ID é obrigatório",
  }),
});

// Schema de validação para query parameters de paginação
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.integer": "Página deve ser um número inteiro",
    "number.min": "Página deve ser maior que 0",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.integer": "Limite deve ser um número inteiro",
    "number.min": "Limite deve ser maior que 0",
    "number.max": "Limite deve ser no máximo 100",
  }),
  search: Joi.string().max(100).allow("").messages({
    "string.max": "Busca deve ter no máximo 100 caracteres",
  }),
  sort: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Ordenação deve ser asc ou desc",
  }),
  sortBy: Joi.string().max(50).default("createdAt").messages({
    "string.max": "Campo de ordenação deve ter no máximo 50 caracteres",
  }),
});

// Schemas adicionais para novos endpoints
const empresaSchemas = {
  create: Joi.object({
    nome: Joi.string().required().min(1).max(200),
    // Aceita 14 dígitos ou formato mascarado XX.XXX.XXX/XXXX-XX
    cnpj: Joi.string()
      .required()
      .pattern(/^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/),
    endereco: Joi.string().allow("").max(500),
    telefone: Joi.string().allow("").max(20),
    email: Joi.string().email().allow("").max(100),
    ativa: Joi.boolean().default(true),
  }),

  update: Joi.object({
    nome: Joi.string().min(1).max(200),
    cnpj: Joi.string().pattern(/^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/),
    endereco: Joi.string().allow("").max(500),
    telefone: Joi.string().allow("").max(20),
    email: Joi.string().email().allow("").max(100),
    ativa: Joi.boolean(),
  }),
};

const fornecedorSchemas = {
  create: Joi.object({
    nome: Joi.string().required().min(1).max(200),
    cnpj: Joi.string()
      .allow("")
      .pattern(/^\d{14}$/),
    endereco: Joi.string().allow("").max(500),
    telefone: Joi.string().allow("").max(20),
    email: Joi.string().email().allow("").max(100),
    contato: Joi.string().allow("").max(100),
    ativo: Joi.boolean().default(true),
    empresa_id: Joi.number().integer().required(),
  }),

  update: Joi.object({
    nome: Joi.string().min(1).max(200),
    cnpj: Joi.string()
      .allow("")
      .pattern(/^\d{14}$/),
    endereco: Joi.string().allow("").max(500),
    telefone: Joi.string().allow("").max(20),
    email: Joi.string().email().allow("").max(100),
    contato: Joi.string().allow("").max(100),
    ativo: Joi.boolean(),
    empresa_id: Joi.number().integer(),
  }),
};

const entradaSchemas = {
  create: Joi.object({
    quantidade: Joi.number().integer().min(1).required(),
    preco_unitario: Joi.number().precision(2).min(0.01).required(),
    data_validade: Joi.date().allow(null),
    lote: Joi.string().allow("").max(50),
    observacoes: Joi.string().allow(""),
    produto_id: Joi.number().integer().required(),
    fornecedor_id: Joi.number().integer().required(),
    empresa_id: Joi.number().integer().required(),
    data_entrada: Joi.date().default(() => new Date()),
  }),

  update: Joi.object({
    quantidade: Joi.number().integer().min(1),
    preco_unitario: Joi.number().precision(2).min(0.01),
    data_validade: Joi.date().allow(null),
    lote: Joi.string().allow("").max(50),
    observacoes: Joi.string().allow(""),
    produto_id: Joi.number().integer(),
    fornecedor_id: Joi.number().integer(),
    data_entrada: Joi.date(),
  }),
};

const vendaSchemas = {
  create: Joi.object({
    quantidade: Joi.number().integer().min(1).required(),
    preco_unitario: Joi.number().precision(2).min(0.01).required(),
    desconto: Joi.number().precision(2).min(0).default(0),
    observacoes: Joi.string().allow(""),
    produto_id: Joi.number().integer().required(),
    empresa_id: Joi.number().integer().required(),
    data_venda: Joi.date().default(() => new Date()),
  }),

  update: Joi.object({
    quantidade: Joi.number().integer().min(1),
    preco_unitario: Joi.number().precision(2).min(0.01),
    desconto: Joi.number().precision(2).min(0),
    observacoes: Joi.string().allow(""),
    data_venda: Joi.date(),
  }),
};

const alertaSchemas = {
  create: Joi.object({
    tipo: Joi.string()
      .valid("estoque_baixo", "produto_vencendo", "produto_vencido")
      .required(),
    titulo: Joi.string().required().min(1).max(200),
    mensagem: Joi.string().required(),
    produto_id: Joi.number().integer().allow(null),
  }),
};

const configuracaoSchemas = {
  updateUsuario: Joi.object({
    tema: Joi.string().valid("claro", "escuro", "auto"),
    idioma: Joi.string().min(2).max(5),
    timezone: Joi.string().min(1).max(50),
    notificacoes_email: Joi.boolean(),
    notificacoes_push: Joi.boolean(),
    formato_data: Joi.string().min(1).max(20),
    formato_moeda: Joi.string().min(3).max(10),
  }),

  updateAlerta: Joi.object({
    dias_aviso_vencimento: Joi.number().integer().min(1),
    alerta_estoque_baixo: Joi.boolean(),
    alerta_produto_vencendo: Joi.boolean(),
    alerta_produto_vencido: Joi.boolean(),
  }),
};

// Objeto consolidado de schemas para facilitar o uso
const schemas = {
  // Schemas gerais
  idParam: idSchema,
  pagination: paginationSchema,

  // Schemas de autenticação
  register: authSchemas.register,
  login: authSchemas.login,
  changePassword: authSchemas.changePassword,
  forgotPassword: authSchemas.forgotPassword,
  resetPassword: authSchemas.resetPassword,

  // Schemas de usuário
  createUser: userSchemas.create,
  updateUser: userSchemas.update,

  // Schemas de produto
  createProduct: productSchemas.create,
  updateProduct: productSchemas.update,

  // Schemas de empresa
  createEmpresa: empresaSchemas.create,
  updateEmpresa: empresaSchemas.update,

  // Schemas de fornecedor
  createFornecedor: fornecedorSchemas.create,
  updateFornecedor: fornecedorSchemas.update,

  // Schemas de entrada
  createEntrada: entradaSchemas.create,
  updateEntrada: entradaSchemas.update,

  // Schemas de venda
  createVenda: vendaSchemas.create,
  updateVenda: vendaSchemas.update,

  // Schemas de alerta
  createAlerta: alertaSchemas.create,

  // Schemas de configuração
  updateConfiguracaoUsuario: configuracaoSchemas.updateUsuario,
  updateConfiguracaoAlerta: configuracaoSchemas.updateAlerta,
};

module.exports = {
  validate,
  schemas,
  authSchemas,
  userSchemas,
  productSchemas,
  empresaSchemas,
  fornecedorSchemas,
  entradaSchemas,
  vendaSchemas,
  alertaSchemas,
  configuracaoSchemas,
  idSchema,
  paginationSchema,
};
