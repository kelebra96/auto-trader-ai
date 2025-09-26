import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { hasPermission, isRole } = usePermissions();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Validade Inteligente
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {hasPermission('view_dashboard') && (
              <Link
                to="/dashboard"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            )}
            {hasPermission('view_products') && (
              <Link
                to="/produtos"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Produtos
              </Link>
            )}
            {hasPermission('view_alerts') && (
              <Link
                to="/alertas"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Alertas
              </Link>
            )}
            {hasPermission('view_reports') && (
              <Link
                to="/relatorios"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Relatórios
              </Link>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Settings */}
            {isRole('admin') && (
              <Link to="/configuracoes">
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* User profile */}
            <div className="flex items-center space-x-2">
              <Link to="/perfil">
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline ml-2">
                    {user?.nome_estabelecimento || 'Usuário'}
                  </span>
                </Button>
              </Link>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;