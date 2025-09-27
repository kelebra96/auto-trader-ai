module.exports = (sequelize, DataTypes) => {
  const ConfiguracaoAlerta = sequelize.define('ConfiguracaoAlerta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dias_aviso_vencimento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        isInt: { msg: 'Dias de aviso deve ser um número inteiro' },
        min: { args: [1], msg: 'Dias de aviso deve ser maior que zero' }
      }
    },
    alerta_estoque_baixo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    alerta_produto_vencendo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    alerta_produto_vencido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'configuracoes_alerta',
    timestamps: true
  });

  ConfiguracaoAlerta.associate = (models) => {
    ConfiguracaoAlerta.belongsTo(models.User, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE'
    });
  };

  return ConfiguracaoAlerta;
};