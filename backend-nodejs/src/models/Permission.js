const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100]
      },
      comment: 'Nome único da permissão (ex: products_create)'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: 'Descrição da permissão'
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      },
      comment: 'Categoria da permissão (ex: products, users, dashboard)'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Se a permissão está ativa no sistema'
    }
  }, {
    tableName: 'Permissions',
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['active']
      },
      {
        fields: ['name'],
        unique: true
      }
    ]
  });

  Permission.associate = function(models) {
    // Relacionamento many-to-many com UserProfiles através de ProfilePermissions
    Permission.belongsToMany(models.UserProfile, {
      through: 'ProfilePermissions',
      foreignKey: 'permission_id',
      otherKey: 'profile_id',
      as: 'profiles'
    });

    // Relacionamento many-to-many com Users através de UserPermissions
    Permission.belongsToMany(models.User, {
      through: 'UserPermissions',
      foreignKey: 'permission_id',
      otherKey: 'user_id',
      as: 'users'
    });
  };

  return Permission;
};