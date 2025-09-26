import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../contexts/PermissionsContext';

const ProtectedRoute = ({ children, requiredPermission, requiredRole, fallback = null }) => {
  const { hasPermission, isRole, loading } = usePermissions();

  // Mostrar loading enquanto carrega as permissões
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Verificar permissão específica se fornecida
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Verificar role específico se fornecido
  if (requiredRole && !isRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem o nível de acesso necessário para esta página.</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;