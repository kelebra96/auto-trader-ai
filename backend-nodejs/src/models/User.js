module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Email deve ter um formato válido'
        },
        notEmpty: {
          msg: 'Email não pode estar vazio'
        }
      }
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Senha não pode estar vazia'
        },
        len: {
          args: [6, 255],
          msg: 'Senha deve ter pelo menos 6 caracteres'
        }
      }
    },
    nome_estabelecimento: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do estabelecimento não pode estar vazio'
        },
        len: {
          args: [2, 100],
          msg: 'Nome do estabelecimento deve ter entre 2 e 100 caracteres'
        }
      }
    },
    papel: {
      type: DataTypes.ENUM('admin', 'usuario'),
      allowNull: false,
      defaultValue: 'usuario',
      validate: {
        isIn: {
          args: [['admin', 'usuario']],
          msg: 'Papel deve ser admin ou usuario'
        }
      }
    },
    permissoes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Permissões customizadas do usuário em formato JSON'
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['papel']
      },
      {
        fields: ['ativo']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeValidate: (user) => {
        // Normalizar email
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        
        // Normalizar nome do estabelecimento
        if (user.nome_estabelecimento) {
          user.nome_estabelecimento = user.nome_estabelecimento.trim();
        }
      }
    }
  });

  // Definir associações
  User.associate = (models) => {
    // Um usuário pode ter várias empresas
    User.hasMany(models.Empresa, {
      foreignKey: 'usuario_id',
      as: 'empresas',
      onDelete: 'CASCADE'
    });

    // Um usuário pode ter várias configurações
    User.hasMany(models.ConfiguracaoUsuario, {
      foreignKey: 'usuario_id',
      as: 'configuracoes',
      onDelete: 'CASCADE'
    });

    // Um usuário pode ter vários alertas
    User.hasMany(models.Alerta, {
      foreignKey: 'usuario_id',
      as: 'alertas',
      onDelete: 'CASCADE'
    });

    // Um usuário pode ter várias configurações de alerta
    User.hasMany(models.ConfiguracaoAlerta, {
      foreignKey: 'usuario_id',
      as: 'configuracoes_alerta',
      onDelete: 'CASCADE'
    });
  };

  // Métodos de instância
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Remover senha da serialização por padrão
    delete values.senha;
    
    return values;
  };

  // Método para verificar se é admin
  User.prototype.isAdmin = function() {
    return this.papel === 'admin';
  };

  // Método para verificar se está ativo
  User.prototype.isActive = function() {
    return this.ativo === true;
  };

  // Scopes
  User.addScope('active', {
    where: {
      ativo: true
    }
  });

  User.addScope('admin', {
    where: {
      papel: 'admin'
    }
  });

  User.addScope('withoutPassword', {
    attributes: {
      exclude: ['senha']
    }
  });

  return User;
};