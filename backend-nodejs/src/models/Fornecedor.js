module.exports = (sequelize, DataTypes) => {
  const Fornecedor = sequelize.define('Fornecedor', {
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
          msg: 'Nome do fornecedor não pode estar vazio'
        },
        len: {
          args: [2, 100],
          msg: 'Nome do fornecedor deve ter entre 2 e 100 caracteres'
        }
      }
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: true,
      validate: {
        is: {
          args: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
          msg: 'CNPJ deve ter o formato XX.XXX.XXX/XXXX-XX'
        }
      }
    },
    endereco: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[\d\s\(\)\-\+]+$/,
          msg: 'Telefone deve conter apenas números, espaços, parênteses, hífens e sinal de mais'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Email deve ter um formato válido'
        }
      }
    },
    contato: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: 'Nome do contato deve ter no máximo 100 caracteres'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'fornecedores',
    timestamps: true,
    indexes: [
      {
        fields: ['empresa_id']
      },
      {
        fields: ['ativo']
      },
      {
        fields: ['nome']
      },
      {
        fields: ['cnpj']
      },
      {
        fields: ['createdAt']
      },
      {
        unique: true,
        fields: ['cnpj', 'empresa_id'],
        where: {
          cnpj: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      }
    ],
    hooks: {
      beforeValidate: (fornecedor) => {
        // Normalizar nome
        if (fornecedor.nome) {
          fornecedor.nome = fornecedor.nome.trim();
        }
        
        // Normalizar email
        if (fornecedor.email) {
          fornecedor.email = fornecedor.email.toLowerCase().trim();
        }
        
        // Normalizar CNPJ
        if (fornecedor.cnpj) {
          fornecedor.cnpj = fornecedor.cnpj.trim();
        }
        
        // Normalizar telefone
        if (fornecedor.telefone) {
          fornecedor.telefone = fornecedor.telefone.trim();
        }
        
        // Normalizar contato
        if (fornecedor.contato) {
          fornecedor.contato = fornecedor.contato.trim();
        }
      }
    }
  });

  // Definir associações
  Fornecedor.associate = (models) => {
    // Um fornecedor pertence a uma empresa
    Fornecedor.belongsTo(models.Empresa, {
      foreignKey: 'empresa_id',
      as: 'empresa',
      onDelete: 'CASCADE'
    });

    // Um fornecedor pode ter vários produtos
    Fornecedor.hasMany(models.Produto, {
      foreignKey: 'fornecedor_id',
      as: 'produtos',
      onDelete: 'SET NULL'
    });

    // Um fornecedor pode ter várias entradas de produtos
    Fornecedor.hasMany(models.EntradaProduto, {
      foreignKey: 'fornecedor_id',
      as: 'entradas_produtos',
      onDelete: 'SET NULL'
    });
  };

  // Métodos de instância
  Fornecedor.prototype.isActive = function() {
    return this.ativo === true;
  };

  // Método para formatar CNPJ
  Fornecedor.prototype.getCnpjFormatted = function() {
    if (!this.cnpj) return null;
    return this.cnpj;
  };

  // Método para obter informações de contato
  Fornecedor.prototype.getContactInfo = function() {
    return {
      telefone: this.telefone,
      email: this.email,
      contato: this.contato
    };
  };

  // Scopes
  Fornecedor.addScope('active', {
    where: {
      ativo: true
    }
  });

  Fornecedor.addScope('withEmpresa', {
    include: [{
      model: sequelize.models.Empresa,
      as: 'empresa',
      attributes: ['id', 'nome', 'ativa']
    }]
  });

  Fornecedor.addScope('withCounts', {
    attributes: {
      include: [
        [
          sequelize.literal('(SELECT COUNT(*) FROM produtos WHERE produtos.fornecedor_id = Fornecedor.id)'),
          'total_produtos'
        ],
        [
          sequelize.literal('(SELECT COUNT(*) FROM entradas_produtos WHERE entradas_produtos.fornecedor_id = Fornecedor.id)'),
          'total_entradas'
        ]
      ]
    }
  });

  Fornecedor.addScope('byEmpresa', (empresaId) => ({
    where: {
      empresa_id: empresaId
    }
  }));

  return Fornecedor;
};