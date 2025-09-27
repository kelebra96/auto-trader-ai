import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Obter token do localStorage por enquanto
  const getToken = () => localStorage.getItem('token');

  // Função para buscar notificações (temporariamente desabilitada)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Temporariamente desabilitado - endpoint /notifications não existe no backend
      // TODO: Implementar sistema de notificações no backend
      console.log('Sistema de notificações temporariamente desabilitado');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para marcar notificação como lida (temporariamente desabilitada)
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Temporariamente desabilitado - endpoint não existe no backend
      console.log('markAsRead temporariamente desabilitado');
      
      // Atualizar estado local apenas
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Função para marcar todas as notificações como lidas (temporariamente desabilitada)
  const markAllAsRead = useCallback(async () => {
    try {
      // Temporariamente desabilitado - endpoint não existe no backend
      console.log('markAllAsRead temporariamente desabilitado');
      
      // Atualizar estado local apenas
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Função para adicionar nova notificação (para uso com WebSocket)
  const addNotification = useCallback((newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Buscar notificações quando o componente monta ou o token muda
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling para atualizar notificações a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };
};

export default useNotifications;