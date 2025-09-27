import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck,
  Building2,
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Users, 
  UserCheck,
  Shield,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePermissions } from '../../contexts/PermissionsContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { hasPermission, isRole } = usePermissions();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard',
      permission: 'view_dashboard'
    },
    {
      name: 'Produtos',
      href: '/produtos',
      icon: Package,
      current: location.pathname.startsWith('/produtos'),
      permission: 'view_products'
    },
    {
      name: 'Fornecedores',
      href: '/fornecedores',
      icon: Truck,
      current: location.pathname.startsWith('/fornecedores'),
      permission: 'view_suppliers'
    },
    {
      name: 'Empresas',
      href: '/empresas',
      icon: Building2,
      current: location.pathname.startsWith('/empresas'),
      permission: 'view_companies'
    },
    {
      name: 'Alertas',
      href: '/alertas',
      icon: AlertTriangle,
      current: location.pathname.startsWith('/alertas'),
      permission: 'view_alerts'
    },
    {
      name: 'Relatórios',
      href: '/relatorios',
      icon: BarChart3,
      current: location.pathname.startsWith('/relatorios'),
      permission: 'view_reports'
    },
    {
      name: 'Usuários',
      href: '/usuarios',
      icon: Users,
      current: location.pathname.startsWith('/usuarios'),
      permission: 'view_all_users'
    },
    {
      name: 'Mobile',
      href: '/mobile',
      icon: Smartphone,
      current: location.pathname.startsWith('/mobile'),
      permission: 'view_dashboard' // Mobile usa mesma permissão do dashboard
    }
  ].filter(item => hasPermission(item.permission));

  const secondaryNavigation = [
    {
      name: 'Perfis',
      href: '/perfis',
      icon: UserCheck,
      current: location.pathname.startsWith('/perfis'),
      role: 'admin'
    },
    {
      name: 'Permissões',
      href: '/permissoes',
      icon: Shield,
      current: location.pathname.startsWith('/permissoes'),
      role: 'admin'
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      current: location.pathname.startsWith('/configuracoes'),
      role: 'admin'
    },
    {
      name: 'Suporte',
      href: '/suporte',
      icon: HelpCircle,
      current: location.pathname.startsWith('/suporte'),
      permission: 'view_dashboard' // Todos podem ver suporte
    }
  ].filter(item => {
    if (item.role) return isRole(item.role);
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VI</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Validade Inteligente
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    item.current
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={onClose}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      item.current
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Secondary navigation */}
          <div className="px-4 py-6 border-t">
            <div className="space-y-1">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      item.current
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={onClose}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;