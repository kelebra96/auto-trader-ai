const { User, Permission, UserProfile, UserPermission, ProfilePermission } = require('../models');

class PermissionService {
  /**
   * Obtém todas as permissões de um usuário
   * Combina permissões do perfil + permissões específicas do usuário
   */
  async getUserPermissions(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserProfile,
            as: 'profile',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
              }
            ]
          },
          {
            model: Permission,
            as: 'permissions',
            through: { 
              attributes: ['granted']
            }
          }
        ]
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Se o usuário tem papel 'admin', retorna todas as permissões
      if (user.papel === 'admin') {
        const allPermissions = await Permission.findAll({
          where: { active: true },
          attributes: ['name']
        });
        return {
          permissions: ['all'],
          detailedPermissions: allPermissions.map(p => p.name)
        };
      }

      const permissions = new Set();

      // Adicionar permissões do perfil
      if (user.profile && user.profile.permissions) {
        user.profile.permissions.forEach(permission => {
          permissions.add(permission.name);
        });
      }

      // Processar permissões específicas do usuário (podem sobrescrever as do perfil)
      if (user.permissions) {
        user.permissions.forEach(permission => {
          if (permission.UserPermission.granted) {
            permissions.add(permission.name);
          } else {
            permissions.delete(permission.name); // Remove se foi negada especificamente
          }
        });
      }

      return {
        permissions: Array.from(permissions),
        profile: user.profile ? user.profile.name : null,
        role: user.papel
      };
    } catch (error) {
      console.error('Erro ao obter permissões do usuário:', error);
      throw error;
    }
  }

  /**
   * Verifica se um usuário tem uma permissão específica
   */
  async hasPermission(userId, permissionName) {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      // Se tem 'all', tem todas as permissões
      if (userPermissions.permissions.includes('all')) {
        return true;
      }

      return userPermissions.permissions.includes(permissionName);
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Verifica se um usuário tem qualquer uma das permissões especificadas
   */
  async hasAnyPermission(userId, permissionNames) {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      // Se tem 'all', tem todas as permissões
      if (userPermissions.permissions.includes('all')) {
        return true;
      }

      return permissionNames.some(permission => 
        userPermissions.permissions.includes(permission)
      );
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Atribui um perfil a um usuário
   */
  async assignProfileToUser(userId, profileId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const profile = await UserProfile.findByPk(profileId);
      if (!profile) {
        throw new Error('Perfil não encontrado');
      }

      await user.update({ profile_id: profileId });
      return true;
    } catch (error) {
      console.error('Erro ao atribuir perfil ao usuário:', error);
      throw error;
    }
  }

  /**
   * Concede ou nega uma permissão específica para um usuário
   */
  async setUserPermission(userId, permissionName, granted = true) {
    try {
      const permission = await Permission.findOne({
        where: { name: permissionName }
      });

      if (!permission) {
        throw new Error('Permissão não encontrada');
      }

      const [userPermission, created] = await UserPermission.findOrCreate({
        where: {
          user_id: userId,
          permission_id: permission.id
        },
        defaults: {
          granted: granted
        }
      });

      if (!created) {
        await userPermission.update({ granted: granted });
      }

      return true;
    } catch (error) {
      console.error('Erro ao definir permissão do usuário:', error);
      throw error;
    }
  }

  /**
   * Remove uma permissão específica de um usuário
   */
  async removeUserPermission(userId, permissionName) {
    try {
      const permission = await Permission.findOne({
        where: { name: permissionName }
      });

      if (!permission) {
        throw new Error('Permissão não encontrada');
      }

      await UserPermission.destroy({
        where: {
          user_id: userId,
          permission_id: permission.id
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao remover permissão do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os perfis disponíveis
   */
  async getAllProfiles() {
    try {
      return await UserProfile.findAll({
        where: { active: true },
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });
    } catch (error) {
      console.error('Erro ao obter perfis:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as permissões disponíveis
   */
  async getAllPermissions() {
    try {
      return await Permission.findAll({
        where: { active: true },
        order: [['category', 'ASC'], ['name', 'ASC']]
      });
    } catch (error) {
      console.error('Erro ao obter permissões:', error);
      throw error;
    }
  }

  /**
   * Obtém permissões agrupadas por categoria
   */
  async getPermissionsByCategory() {
    try {
      const permissions = await this.getAllPermissions();
      const grouped = {};

      permissions.forEach(permission => {
        if (!grouped[permission.category]) {
          grouped[permission.category] = [];
        }
        grouped[permission.category].push(permission);
      });

      return grouped;
    } catch (error) {
      console.error('Erro ao obter permissões por categoria:', error);
      throw error;
    }
  }
}

module.exports = new PermissionService();