module.exports = (sequelize, DataTypes) => {
  const ConfiguracaoUsuario = sequelize.define('ConfiguracaoUsuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tema: {
      type: DataTypes.ENUM('claro', 'escuro', 'auto'),
      allowNull: false,
      defaultValue: 'claro',
      validate: {
        isIn: {
          args: [['claro', 'escuro', 'auto']],
          msg: 'Tema deve ser claro, escuro ou auto'
        }
      }
    },
    idioma: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'pt-BR',
      validate: {
        len: {
          args: [2, 5],
          msg: 'Idioma deve ter entre 2 e 5 caracteres'
        }
      }
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'America/Sao_Paulo',
      validate: {
        len: {
          args: [1, 50],
          msg: 'Timezone deve ter entre 1 e 50 caracteres'
        }
      }
    },
    notificacoes_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notificacoes_push: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    formato_data: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'DD/MM/YYYY',
      validate: {
        len: {
          args: [1, 20],
          msg: 'Formato de data deve ter entre 1 e 20 caracteres'
        }
      }
    },
    formato_moeda: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'BRL',
      validate: {
        len: {
          args: [3, 10],
          msg: 'Formato de moeda deve ter entre 3 e 10 caracteres'
        }
      }
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
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
    tableName: 'configuracoes_usuario',
    timestamps: true
  });

  ConfiguracaoUsuario.associate = (models) => {
    ConfiguracaoUsuario.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE'
    });
  };

  ConfiguracaoUsuario.prototype.isDarkMode = function() {
    return this.tema === 'escuro';
  };

  ConfiguracaoUsuario.prototype.isEmailNotificationEnabled = function() {
    return this.notificacoes_email;
  };

  ConfiguracaoUsuario.prototype.isPushNotificationEnabled = function() {
    return this.notificacoes_push;
  };

  return ConfiguracaoUsuario;
};