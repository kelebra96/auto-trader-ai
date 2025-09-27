module.exports = (sequelize, DataTypes) => {
  const EntradaProduto = sequelize.define('EntradaProduto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'Quantidade deve ser um número inteiro'
        },
        min: {
          args: [1],
          msg: 'Quantidade deve ser maior que zero'
        }
      }
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Preço unitário deve ser um valor decimal válido'
        },
        min: {
          args: [0],
          msg: 'Preço unitário deve ser maior ou igual a zero'
        }
      }
    },
    preco_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Preço total deve ser um valor decimal válido'
        },
        min: {
          args: [0],
          msg: 'Preço total deve ser maior ou igual a zero'
        }
      }
    },
    data_validade: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Data de validade deve ser uma data válida'
        },
        isAfter: {
          args: new Date().toISOString().split('T')[0],
          msg: 'Data de validade deve ser futura'
        }
      }
    },
    lote: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Lote deve ter no máximo 50 caracteres'
        }
      }
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Observações devem ter no máximo 500 caracteres'
        }
      }
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'produtos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    data_entrada: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    tableName: 'entradas_produtos',
    timestamps: true,
    indexes: [
      {
        fields: ['produto_id']
      },
      {
        fields: ['fornecedor_id']
      },
      {
        fields: ['empresa_id']
      },
      {
        fields: ['data_entrada']
      },
      {
        fields: ['data_validade']
      },
      {
        fields: ['lote']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeValidate: (entrada) => {
        // Calcular preço total automaticamente
        if (entrada.quantidade && entrada.preco_unitario) {
          entrada.preco_total = entrada.quantidade * entrada.preco_unitario;
        }
        
        // Normalizar lote
        if (entrada.lote) {
          entrada.lote = entrada.lote.trim();
        }
        
        // Normalizar observações
        if (entrada.observacoes) {
          entrada.observacoes = entrada.observacoes.trim();
        }
      },
      
      afterCreate: async (entrada) => {
        // Atualizar estoque do produto após criar entrada
        const produto = await entrada.getProduto();
        if (produto) {
          await produto.updateStock(entrada.quantidade, 'add');
        }
      }
    }
  });

  // Definir associações
  EntradaProduto.associate = (models) => {
    // Uma entrada pertence a um produto
    EntradaProduto.belongsTo(models.Produto, {
      foreignKey: 'produto_id',
      as: 'produto',
      onDelete: 'CASCADE'
    });

    // Uma entrada pode pertencer a um fornecedor
    EntradaProduto.belongsTo(models.Fornecedor, {
      foreignKey: 'fornecedor_id',
      as: 'fornecedor',
      onDelete: 'SET NULL'
    });

    // Uma entrada pertence a uma empresa
    EntradaProduto.belongsTo(models.Empresa, {
      foreignKey: 'empresa_id',
      as: 'empresa',
      onDelete: 'CASCADE'
    });
  };

  // Métodos de instância
  EntradaProduto.prototype.isExpired = function() {
    if (!this.data_validade) return false;
    return new Date(this.data_validade) < new Date();
  };

  EntradaProduto.prototype.isExpiringSoon = function(days = 30) {
    if (!this.data_validade) return false;
    const expirationDate = new Date(this.data_validade);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expirationDate <= warningDate;
  };

  EntradaProduto.prototype.getDaysUntilExpiration = function() {
    if (!this.data_validade) return null;
    const today = new Date();
    const expirationDate = new Date(this.data_validade);
    const diffTime = expirationDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Scopes
  EntradaProduto.addScope('withProduto', {
    include: [{
      model: sequelize.models.Produto,
      as: 'produto',
      attributes: ['id', 'nome', 'codigo_barras', 'categoria']
    }]
  });

  EntradaProduto.addScope('withFornecedor', {
    include: [{
      model: sequelize.models.Fornecedor,
      as: 'fornecedor',
      attributes: ['id', 'nome', 'ativo']
    }]
  });

  EntradaProduto.addScope('byEmpresa', (empresaId) => ({
    where: {
      empresa_id: empresaId
    }
  }));

  EntradaProduto.addScope('expiring', (days = 30) => {
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    
    return {
      where: {
        data_validade: {
          [sequelize.Sequelize.Op.lte]: warningDate,
          [sequelize.Sequelize.Op.gte]: new Date()
        }
      }
    };
  });

  EntradaProduto.addScope('expired', {
    where: {
      data_validade: {
        [sequelize.Sequelize.Op.lt]: new Date()
      }
    }
  });

  EntradaProduto.addScope('byDateRange', (startDate, endDate) => ({
    where: {
      data_entrada: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  }));

  return EntradaProduto;
};