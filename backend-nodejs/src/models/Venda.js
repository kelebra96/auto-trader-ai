module.exports = (sequelize, DataTypes) => {
  const Venda = sequelize.define('Venda', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'Quantidade deve ser um número inteiro' },
        min: { args: [1], msg: 'Quantidade deve ser maior que zero' }
      }
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Preço unitário deve ser um número decimal' },
        min: { args: [0.01], msg: 'Preço unitário deve ser maior que zero' }
      }
    },
    preco_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Preço total deve ser um número decimal' },
        min: { args: [0.01], msg: 'Preço total deve ser maior que zero' }
      }
    },
    desconto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: { msg: 'Desconto deve ser um número decimal' },
        min: { args: [0], msg: 'Desconto não pode ser negativo' }
      }
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'produtos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
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
    data_venda: {
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
    tableName: 'vendas',
    timestamps: true,
    hooks: {
      beforeCreate: (venda) => {
        venda.preco_total = (venda.quantidade * venda.preco_unitario) - venda.desconto;
      },
      beforeUpdate: (venda) => {
        if (venda.changed('quantidade') || venda.changed('preco_unitario') || venda.changed('desconto')) {
          venda.preco_total = (venda.quantidade * venda.preco_unitario) - venda.desconto;
        }
      }
    },
    indexes: [
      {
        fields: ['produto_id']
      },
      {
        fields: ['empresa_id']
      },
      {
        fields: ['data_venda']
      }
    ]
  });

  Venda.associate = (models) => {
    Venda.belongsTo(models.Produto, {
      foreignKey: 'produto_id',
      as: 'produto',
      onDelete: 'RESTRICT'
    });

    Venda.belongsTo(models.Empresa, {
      foreignKey: 'empresa_id',
      as: 'empresa',
      onDelete: 'CASCADE'
    });
  };

  Venda.prototype.getValorLiquido = function() {
    return this.preco_total;
  };

  Venda.addScope('byEmpresa', (empresaId) => ({
    where: { empresa_id: empresaId }
  }));

  Venda.addScope('byPeriod', (startDate, endDate) => ({
    where: {
      data_venda: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  }));

  return Venda;
};