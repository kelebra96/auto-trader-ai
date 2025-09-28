import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useNotifications } from '../../hooks/useNotifications';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            {hasPermission('dashboard_view') && (
              <Link
                to="/dashboard"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            )}
            {hasPermission('products_view') && (
              <Link
                to="/produtos"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Produtos
              </Link>
            )}
            {hasPermission('alerts_view') && (
              <Link
                to="/alertas"
                className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Alertas
              </Link>
            )}
            {hasPermission('reports_view') && (
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
            <div className="relative" ref={notificationRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Dropdown de notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Notificações</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            markAllAsRead();
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Marcar todas como lidas
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.created_at * 1000).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-center text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setShowNotifications(false);
                          // Aqui você pode navegar para uma página de notificações completa
                          // navigate('/notificacoes');
                        }}
                      >
                        Ver todas as notificações
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            {hasPermission('settings_view') && (
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