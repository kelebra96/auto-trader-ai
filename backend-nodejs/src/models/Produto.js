module.exports = (sequelize, DataTypes) => {
  const Produto = sequelize.define('Produto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do produto não pode estar vazio'
        },
        len: {
          args: [2, 100],
          msg: 'Nome do produto deve ter entre 2 e 100 caracteres'
        }
      }
    },
    codigo_barras: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Código de barras deve ter no máximo 50 caracteres'
        }
      }
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Preço deve ser um valor decimal válido'
        },
        min: {
          args: [0],
          msg: 'Preço deve ser maior ou igual a zero'
        }
      }
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Categoria deve ter no máximo 50 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Descrição deve ter no máximo 500 caracteres'
        }
      }
    },
    estoque_atual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Estoque atual deve ser um número inteiro'
        },
        min: {
          args: [0],
          msg: 'Estoque atual deve ser maior ou igual a zero'
        }
      }
    },
    estoque_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'Estoque mínimo deve ser um número inteiro'
        },
        min: {
          args: [0],
          msg: 'Estoque mínimo deve ser maior ou igual a zero'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    fornecedor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fornecedores',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'produtos',
    timestamps: true,
    indexes: [
      {
        fields: ['empresa_id']
      },
      {
        fields: ['fornecedor_id']
      },
      {
        fields: ['ativo']
      },
      {
        fields: ['nome']
      },
      {
        fields: ['codigo_barras']
      },
      {
        fields: ['categoria']
      },
      {
        fields: ['estoque_atual']
      },
      {
        fields: ['estoque_minimo']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['codigo_barras', 'empresa_id'],
        where: {
          codigo_barras: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    ],
    hooks: {
      beforeValidate: (produto) => {
        // Normalizar nome
        if (produto.nome) {
          produto.nome = produto.nome.trim();
        }
        
        // Normalizar código de barras
        if (produto.codigo_barras) {
          produto.codigo_barras = produto.codigo_barras.trim();
        }
        
        // Normalizar categoria
        if (produto.categoria) {
          produto.categoria = produto.categoria.trim();
        }
        
        // Normalizar descrição
        if (produto.descricao) {
          produto.descricao = produto.descricao.trim();
        }
      }
    }
  });

  // Definir associações
  Produto.associate = (models) => {
    // Um produto pertence a uma empresa
    Produto.belongsTo(models.Empresa, {
      foreignKey: 'empresa_id',
      as: 'empresa',
      onDelete: 'CASCADE'
    });

    // Um produto pode pertencer a um fornecedor
    Produto.belongsTo(models.Fornecedor, {
      foreignKey: 'fornecedor_id',
      as: 'fornecedor',
      onDelete: 'SET NULL'
    });

    // Um produto pode ter várias entradas
    Produto.hasMany(models.EntradaProduto, {
      foreignKey: 'produto_id',
      as: 'entradas',
      onDelete: 'CASCADE'
    });

    // Um produto pode ter várias vendas
    Produto.hasMany(models.Venda, {
      foreignKey: 'produto_id',
      as: 'vendas',
      onDelete: 'CASCADE'
    });

    // Um produto pode ter vários alertas
    Produto.hasMany(models.Alerta, {
      foreignKey: 'produto_id',
      as: 'alertas',
      onDelete: 'CASCADE'
    });
  };

  // Métodos de instância
  Produto.prototype.isActive = function() {
    return this.ativo === true;
  };

  // Verificar se está com estoque baixo
  Produto.prototype.isLowStock = function() {
    return this.estoque_atual <= this.estoque_minimo;
  };

  // Verificar se está sem estoque
  Produto.prototype.isOutOfStock = function() {
    return this.estoque_atual === 0;
  };

  // Calcular valor total do estoque
  Produto.prototype.getStockValue = function() {
    return parseFloat(this.preco) * this.estoque_atual;
  };

  // Atualizar estoque
  Produto.prototype.updateStock = function(quantidade, operacao = 'add') {
    if (operacao === 'add') {
      this.estoque_atual += quantidade;
    } else if (operacao === 'subtract') {
      this.estoque_atual = Math.max(0, this.estoque_atual - quantidade);
    } else if (operacao === 'set') {
      this.estoque_atual = Math.max(0, quantidade);
    }
    return this.save();
  };

  // Scopes
  Produto.addScope('active', {
    where: {
      ativo: true
    }
  });

  Produto.addScope('lowStock', {
    where: sequelize.literal('estoque_atual <= estoque_minimo')
  });

  Produto.addScope('outOfStock', {
    where: {
      estoque_atual: 0
    }
  });

  Produto.addScope('withFornecedor', {
    include: [{
      model: sequelize.models.Fornecedor,
      as: 'fornecedor',
      attributes: ['id', 'nome', 'ativo']
    }]
  });

  Produto.addScope('withEmpresa', {
    include: [{
      model: sequelize.models.Empresa,
      as: 'empresa',
      attributes: ['id', 'nome', 'ativa']
    }]
  });

  Produto.addScope('byEmpresa', (empresaId) => ({
    where: {
      empresa_id: empresaId
    }
  }));

  Produto.addScope('byCategoria', (categoria) => ({
    where: {
      categoria: categoria
    }
  }));

  Produto.addScope('withCounts', {
    attributes: {
      include: [
        [
          sequelize.literal('(SELECT COUNT(*) FROM entradas_produtos WHERE entradas_produtos.produto_id = Produto.id)'),
          'total_entradas'
        ],
        [
          sequelize.literal('(SELECT COUNT(*) FROM vendas WHERE vendas.produto_id = Produto.id)'),
          'total_vendas'
        ],
        [
          sequelize.literal('(SELECT SUM(quantidade) FROM vendas WHERE vendas.produto_id = Produto.id)'),
          'quantidade_vendida'
        ]
      ]
    }
  });

  return Produto;
};