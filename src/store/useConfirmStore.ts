import { create } from 'zustand';

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmStore {
  dialog: ConfirmDialog | null;
  confirm: (config: Omit<ConfirmDialog, 'isOpen'>) => void;
  close: () => void;
}

export const useConfirmStore = create<ConfirmStore>((set) => ({
  dialog: null,
  
  confirm: (config) => {
    set({
      dialog: {
        ...config,
        isOpen: true,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        type: config.type || 'info'
      }
    });
  },
  
  close: () => {
    set({ dialog: null });
  }
}));
