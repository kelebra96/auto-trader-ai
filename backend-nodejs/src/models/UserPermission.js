const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPermission = sequelize.define('UserPermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Permissions',
        key: 'id'
      }
    },
    granted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'true = permissão concedida, false = permissão negada (override do perfil)'
    }
  }, {
    tableName: 'UserPermissions',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'permission_id'],
        unique: true,
        name: 'unique_user_permission'
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['permission_id']
      },
      {
        fields: ['granted']
      }
    ]
  });

  UserPermission.associate = function(models) {
    // Relacionamentos belongsTo
    UserPermission.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    UserPermission.belongsTo(models.Permission, {
      foreignKey: 'permission_id',
      as: 'permission'
    });
  };

  return UserPermission;
};