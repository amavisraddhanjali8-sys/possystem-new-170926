export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

export function showToast(message: string, type: ToastType = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('innovista_toast', {
        detail: { message, type }
      })
    );
  }
}

// Safe interception of window.alert to prevent iframe sandboxing errors
if (typeof window !== 'undefined') {
  window.alert = (message?: any) => {
    showToast(String(message ?? ''), 'info');
  };
}
