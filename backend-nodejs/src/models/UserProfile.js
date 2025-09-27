const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProfile = sequelize.define('UserProfile', {
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
      comment: 'Nome do perfil (ex: Super Admin, Gerente, Operador)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição detalhada do perfil'
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Se este é o perfil padrão para novos usuários'
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Se o perfil está ativo'
    }
  }, {
    tableName: 'UserProfiles',
    timestamps: true,
    indexes: [
      {
        fields: ['active']
      },
      {
        fields: ['is_default']
      },
      {
        fields: ['name'],
        unique: true
      }
    ]
  });

  UserProfile.associate = function(models) {
    // Relacionamento many-to-many com Permissions através de ProfilePermissions
    UserProfile.belongsToMany(models.Permission, {
      through: 'ProfilePermissions',
      foreignKey: 'profile_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });

    // Relacionamento one-to-many com Users
    UserProfile.hasMany(models.User, {
      foreignKey: 'profile_id',
      as: 'users'
    });
  };

  // Método para buscar perfil padrão
  UserProfile.getDefaultProfile = async function() {
    return await this.findOne({
      where: {
        is_default: true,
        active: true
      }
    });
  };

  return UserProfile;
};