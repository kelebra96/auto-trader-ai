import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(value) {
  if (!value && value !== 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatCNPJ(cnpj) {
  if (!cnpj) return '';
  
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatPhone(phone) {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function getDaysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getExpiryStatus(expiryDate) {
  const days = getDaysUntilExpiry(expiryDate);
  
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days === 0) return 'expires-today';
  if (days <= 7) return 'expires-soon';
  if (days <= 30) return 'expires-month';
  return 'valid';
}

export function getExpiryStatusColor(status) {
  const colors = {
    'expired': 'text-red-600 bg-red-50',
    'expires-today': 'text-red-600 bg-red-50',
    'expires-soon': 'text-orange-600 bg-orange-50',
    'expires-month': 'text-yellow-600 bg-yellow-50',
    'valid': 'text-green-600 bg-green-50',
    'unknown': 'text-gray-600 bg-gray-50'
  };
  
  return colors[status] || colors.unknown;
}

export function getExpiryStatusText(status) {
  const texts = {
    'expired': 'Vencido',
    'expires-today': 'Vence hoje',
    'expires-soon': 'Vence em breve',
    'expires-month': 'Vence este mês',
    'valid': 'Válido',
    'unknown': 'Desconhecido'
  };
  
  return texts[status] || texts.unknown;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}