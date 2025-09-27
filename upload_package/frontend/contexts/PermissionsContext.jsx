import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [cargo, setCargo] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const loadPermissions = async () => {
    try {
      console.log('🔄 [PermissionsContext] Iniciando loadPermissions...');
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔑 [PermissionsContext] Token do localStorage:', token ? `${token.substring(0, 30)}...` : 'null');
      
      if (!token) {
        console.log('❌ [PermissionsContext] Sem token, limpando estado...');
        setPermissions([]);
        setCargo('');
        setUser(null);
        return;
      }

      console.log('🌐 [PermissionsContext] Fazendo chamada para /usuarios/permissoes...');
      const response = await api.get('/usuarios/permissoes');
      
      console.log('✅ [PermissionsContext] Resposta recebida:', response.data);
      
      if (response.data) {
        const newPermissions = response.data.permissoes || [];
        const newCargo = response.data.cargo || '';
        const newUser = response.data.usuario || null;
        
        console.log('📝 [PermissionsContext] Atualizando estado:');
        console.log('   Permissões:', newPermissions);
        console.log('   Cargo:', newCargo);
        console.log('   Usuário:', newUser);
        
        setPermissions(newPermissions);
        setCargo(newCargo);
        setUser(newUser);
        
        console.log('✅ [PermissionsContext] Estado atualizado com sucesso!');
      } else {
        console.log('⚠️ [PermissionsContext] Resposta sem dados, limpando estado...');
        setPermissions([]);
        setCargo('');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [PermissionsContext] Erro ao carregar permissões:', error);
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      setPermissions([]);
      setCargo('');
      setUser(null);
    } finally {
      console.log('🏁 [PermissionsContext] Finalizando loadPermissions, setLoading(false)');
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    console.log(`🔍 [PermissionsContext] hasPermission('${permission}'):`);
    console.log('   Permissões atuais:', permissions);
    
    // Se o usuário tem permissão 'all', ele pode fazer tudo
    if (permissions.includes('all')) {
      console.log('   ✅ Tem permissão "all", retornando true');
      return true;
    }
    
    const hasSpecific = permissions.includes(permission);
    console.log(`   ${hasSpecific ? '✅' : '❌'} Permissão específica: ${hasSpecific}`);
    return hasSpecific;
  };

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasCargo = (cargoList) => {
    if (Array.isArray(cargoList)) {
      return cargoList.includes(cargo);
    }
    return cargo === cargoList;
  };

  const isRole = (role) => {
    console.log(`🔍 [PermissionsContext] isRole('${role}'):`);
    console.log('   Cargo atual:', cargo);
    const result = cargo === role;
    console.log(`   ${result ? '✅' : '❌'} Resultado: ${result}`);
    return result;
  };
  
  const isAdmin = () => {
    console.log('🔍 [PermissionsContext] isAdmin():');
    console.log('   Cargo atual:', cargo);
    const result = cargo === 'admin';
    console.log(`   ${result ? '✅' : '❌'} É admin: ${result}`);
    return result;
  };
  
  const isGerente = () => cargo === 'gerente';
  const isUsuario = () => cargo === 'usuario';
  const isVisualizador = () => cargo === 'visualizador';

  const canViewUsers = () => hasPermission('view_all_users');
  const canEditUsers = () => hasPermission('edit_user');
  const canDeleteUsers = () => hasPermission('delete_user');
  const canCreateUsers = () => hasPermission('create_user');

  const canViewProducts = () => hasPermission('view_products') || hasPermission('view_all_products');
  const canEditProducts = () => hasPermission('edit_product');
  const canDeleteProducts = () => hasPermission('delete_product');
  const canCreateProducts = () => hasPermission('create_product');

  const canViewSales = () => hasPermission('view_sales') || hasPermission('view_all_sales');
  const canCreateSales = () => hasPermission('create_sale');
  const canEditSales = () => hasPermission('edit_sale');

  const canViewReports = () => hasPermission('view_reports') || hasPermission('view_all_reports');
  const canExportData = () => hasPermission('export_data');

  const canViewAlerts = () => hasPermission('view_alerts') || hasPermission('view_all_alerts');
  const canCreateAlerts = () => hasPermission('create_alert');

  const canViewDashboard = () => hasPermission('view_dashboard');

  const clearPermissions = () => {
    console.log('🗑️ [PermissionsContext] Limpando permissões...');
    setPermissions([]);
    setCargo('');
    setUser(null);
  };

  useEffect(() => {
    console.log('🚀 [PermissionsContext] useEffect executado, chamando loadPermissions...');
    loadPermissions();
  }, []);

  // Log sempre que o estado mudar
  useEffect(() => {
    console.log('📊 [PermissionsContext] Estado atualizado:');
    console.log('   Loading:', loading);
    console.log('   Permissions:', permissions);
    console.log('   Cargo:', cargo);
    console.log('   User:', user);
  }, [loading, permissions, cargo, user]);

  const value = {
    permissions,
    cargo,
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasCargo,
    isRole,
    isAdmin,
    isGerente,
    isUsuario,
    isVisualizador,
    canViewUsers,
    canEditUsers,
    canDeleteUsers,
    canCreateUsers,
    canViewProducts,
    canEditProducts,
    canDeleteProducts,
    canCreateProducts,
    canViewSales,
    canCreateSales,
    canEditSales,
    canViewReports,
    canExportData,
    canViewAlerts,
    canCreateAlerts,
    canViewDashboard,
    loadPermissions,
    clearPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};