import React from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';
import { useNotifications } from '../../contexts/NotificationContext';

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;