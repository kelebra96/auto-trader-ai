module.exports = (sequelize, DataTypes) => {
  const Empresa = sequelize.define('Empresa', {
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
          msg: 'Nome da empresa não pode estar vazio'
        },
        len: {
          args: [2, 100],
          msg: 'Nome da empresa deve ter entre 2 e 100 caracteres'
        }
      }
    },
    cnpj: {
      type: DataTypes.STRING(18),
      allowNull: true,
      unique: true,
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
    ativa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    tableName: 'empresas',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cnpj'],
        where: {
          cnpj: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['usuario_id']
      },
      {
        fields: ['ativa']
      },
      {
        fields: ['nome']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeValidate: (empresa) => {
        // Normalizar nome
        if (empresa.nome) {
          empresa.nome = empresa.nome.trim();
        }
        
        // Normalizar email
        if (empresa.email) {
          empresa.email = empresa.email.toLowerCase().trim();
        }
        
        // Normalizar CNPJ
        if (empresa.cnpj) {
          empresa.cnpj = empresa.cnpj.trim();
        }
        
        // Normalizar telefone
        if (empresa.telefone) {
          empresa.telefone = empresa.telefone.trim();
        }
      }
    }
  });

  // Definir associações
  Empresa.associate = (models) => {
    // Uma empresa pertence a um usuário
    Empresa.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE'
    });

    // Uma empresa pode ter vários fornecedores
    Empresa.hasMany(models.Fornecedor, {
      foreignKey: 'empresa_id',
      as: 'fornecedores',
      onDelete: 'CASCADE'
    });

    // Uma empresa pode ter vários produtos
    Empresa.hasMany(models.Produto, {
      foreignKey: 'empresa_id',
      as: 'produtos',
      onDelete: 'CASCADE'
    });

    // Uma empresa pode ter várias vendas
    Empresa.hasMany(models.Venda, {
      foreignKey: 'empresa_id',
      as: 'vendas',
      onDelete: 'CASCADE'
    });
  };

  // Métodos de instância
  Empresa.prototype.isActive = function() {
    return this.ativa === true;
  };

  // Método para formatar CNPJ
  Empresa.prototype.getCnpjFormatted = function() {
    if (!this.cnpj) return null;
    return this.cnpj;
  };

  // Scopes
  Empresa.addScope('active', {
    where: {
      ativa: true
    }
  });

  Empresa.addScope('withUser', {
    include: [{
      model: sequelize.models.User,
      as: 'usuario',
      attributes: { exclude: ['senha'] }
    }]
  });

  Empresa.addScope('withCounts', {
    attributes: {
      include: [
        [
          sequelize.literal('(SELECT COUNT(*) FROM fornecedores WHERE fornecedores.empresa_id = Empresa.id)'),
          'total_fornecedores'
        ],
        [
          sequelize.literal('(SELECT COUNT(*) FROM produtos WHERE produtos.empresa_id = Empresa.id)'),
          'total_produtos'
        ],
        [
          sequelize.literal('(SELECT COUNT(*) FROM vendas WHERE vendas.empresa_id = Empresa.id)'),
          'total_vendas'
        ]
      ]
    }
  });

  return Empresa;
};