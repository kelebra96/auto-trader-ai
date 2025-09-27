module.exports = (sequelize, DataTypes) => {
  const Alerta = sequelize.define('Alerta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tipo: {
      type: DataTypes.ENUM('estoque_baixo', 'produto_vencendo', 'produto_vencido'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['estoque_baixo', 'produto_vencendo', 'produto_vencido']],
          msg: 'Tipo deve ser estoque_baixo, produto_vencendo ou produto_vencido'
        }
      }
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Título não pode estar vazio'
        },
        len: {
          args: [1, 200],
          msg: 'Título deve ter entre 1 e 200 caracteres'
        }
      }
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Mensagem não pode estar vazia'
        }
      }
    },
    lido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    data_leitura: {
      type: DataTypes.DATE,
      allowNull: true
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'produtos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    tableName: 'alertas',
    timestamps: true,
    indexes: [
      {
        fields: ['usuario_id']
      },
      {
        fields: ['produto_id']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['lido']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Alerta.associate = (models) => {
    Alerta.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE'
    });

    Alerta.belongsTo(models.Produto, {
      foreignKey: 'produto_id',
      as: 'produto',
      onDelete: 'CASCADE'
    });
  };

  Alerta.prototype.markAsRead = function() {
    this.lido = true;
    this.data_leitura = new Date();
    return this.save();
  };

  Alerta.addScope('unread', {
    where: { lido: false }
  });

  Alerta.addScope('byUser', (userId) => ({
    where: { usuario_id: userId }
  }));

  return Alerta;
};