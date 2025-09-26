import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NOTIFICATION_TYPES } from '../../contexts/NotificationContext';

const Toast = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="h-5 w-5" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className="h-5 w-5" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="h-5 w-5" />;
      case NOTIFICATION_TYPES.INFO:
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'border-l-4 shadow-lg';
    
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case NOTIFICATION_TYPES.INFO:
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'text-green-400';
      case NOTIFICATION_TYPES.ERROR:
        return 'text-red-400';
      case NOTIFICATION_TYPES.WARNING:
        return 'text-yellow-400';
      case NOTIFICATION_TYPES.INFO:
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div
      className={cn(
        'max-w-sm w-full rounded-lg p-4 transition-all duration-300 ease-in-out transform',
        getStyles(),
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isLeaving && '-translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start">
        <div className={cn('flex-shrink-0', getIconColor())}>
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          {notification.title && (
            <h4 className="text-sm font-medium mb-1">
              {notification.title}
            </h4>
          )}
          <p className="text-sm">
            {notification.message}
          </p>
          {notification.description && (
            <p className="text-xs mt-1 opacity-75">
              {notification.description}
            </p>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleRemove}
            className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Progress bar for timed notifications */}
      {notification.duration > 0 && (
        <div className="mt-2 w-full bg-black bg-opacity-10 rounded-full h-1">
          <div 
            className="bg-current h-1 rounded-full transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;