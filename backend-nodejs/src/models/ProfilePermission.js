const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfilePermission = sequelize.define('ProfilePermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'UserProfiles',
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
    }
  }, {
    tableName: 'ProfilePermissions',
    timestamps: true,
    indexes: [
      {
        fields: ['profile_id', 'permission_id'],
        unique: true,
        name: 'unique_profile_permission'
      },
      {
        fields: ['profile_id']
      },
      {
        fields: ['permission_id']
      }
    ]
  });

  ProfilePermission.associate = function(models) {
    // Relacionamentos belongsTo
    ProfilePermission.belongsTo(models.UserProfile, {
      foreignKey: 'profile_id',
      as: 'profile'
    });

    ProfilePermission.belongsTo(models.Permission, {
      foreignKey: 'permission_id',
      as: 'permission'
    });
  };

  return ProfilePermission;
};