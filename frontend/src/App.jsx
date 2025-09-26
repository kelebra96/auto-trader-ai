import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ToastContainer from './components/ui/ToastContainer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Users from './pages/Users';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um token salvo no localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Erro ao recuperar dados do usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <PermissionsProvider>
        <Router>
          <div className="App">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/dashboard" replace /> : 
                <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? <Navigate to="/dashboard" replace /> : 
                <Register onRegister={handleLogin} />
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={
                user ? 
                <Layout user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <ProtectedRoute requiredPermission="view_dashboard">
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="produtos/*" element={
                <ProtectedRoute requiredPermission="view_products">
                  <Products />
                </ProtectedRoute>
              } />
              <Route path="alertas" element={
                <ProtectedRoute requiredPermission="view_alerts">
                  <Alerts />
                </ProtectedRoute>
              } />
              <Route path="relatorios" element={
                <ProtectedRoute requiredPermission="view_reports">
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="configuracoes" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="usuarios" element={
                <ProtectedRoute requiredPermission="view_all_users">
                  <Users />
                </ProtectedRoute>
              } />
              <Route path="perfil" element={<Profile user={user} />} />
            </Route>
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
          
          {/* Toast notifications */}
          <ToastContainer />
          </div>
        </Router>
      </PermissionsProvider>
    </NotificationProvider>
  );
}

export default App;