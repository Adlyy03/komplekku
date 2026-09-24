export type PopupType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface PopupButton {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface PopupConfig {
  id: string;
  title: string;
  message?: string;
  type: PopupType;
  buttons: PopupButton[];
  cancelable: boolean;
}

type PopupListener = (config: PopupConfig | null) => void;

class PopupManager {
  private listener: PopupListener | null = null;
  private currentConfig: PopupConfig | null = null;

  register(listener: PopupListener) {
    this.listener = listener;
    // Deliver pending if any
    if (this.currentConfig) {
      this.listener(this.currentConfig);
    }
    return () => {
      if (this.listener === listener) {
        this.listener = null;
      }
    };
  }

  show(options: {
    title: string;
    message?: string;
    type?: PopupType;
    buttons?: PopupButton[];
    cancelable?: boolean;
  }) {
    const title = options.title || '';
    const message = options.message;

    // Detect type if not provided
    let detectedType = options.type;
    if (!detectedType) {
      const lowerTitle = title.toLowerCase();
      const hasDestructive = options.buttons?.some((b) => b.style === 'destructive');
      const hasCancel = options.buttons?.some((b) => b.style === 'cancel');

      if (hasDestructive) {
        detectedType = 'error';
      } else if (
        lowerTitle.includes('sukses') ||
        lowerTitle.includes('berhasil') ||
        lowerTitle.includes('lunas') ||
        lowerTitle.includes('terkirim') ||
        lowerTitle.includes('diterima')
      ) {
        detectedType = 'success';
      } else if (
        lowerTitle.includes('gagal') ||
        lowerTitle.includes('error') ||
        lowerTitle.includes('salah') ||
        lowerTitle.includes('ditolak') ||
        lowerTitle.includes('tidak ditemukan')
      ) {
        detectedType = 'error';
      } else if (
        lowerTitle.includes('peringatan') ||
        lowerTitle.includes('perhatian') ||
        lowerTitle.includes('izin') ||
        lowerTitle.includes('wajib') ||
        lowerTitle.includes('validasi') ||
        lowerTitle.includes('belum') ||
        lowerTitle.includes('butuh') ||
        lowerTitle.includes('tolak')
      ) {
        detectedType = 'warning';
      } else if (hasCancel && options.buttons && options.buttons.length >= 2) {
        detectedType = 'confirm';
      } else {
        detectedType = 'info';
      }
    }

    const buttons =
      options.buttons && options.buttons.length > 0
        ? options.buttons
        : [{ text: 'OK', style: 'default' as const }];

    const config: PopupConfig = {
      id: Math.random().toString(36).slice(2),
      title,
      message,
      type: detectedType,
      buttons,
      cancelable: options.cancelable ?? true,
    };

    this.currentConfig = config;
    if (this.listener) {
      this.listener(config);
    }
  }

  close() {
    this.currentConfig = null;
    if (this.listener) {
      this.listener(null);
    }
  }

  /**
   * Drop-in replacement for React Native's Alert.alert
   */
  alert(
    title: string,
    message?: string,
    buttons?: PopupButton[],
    options?: { cancelable?: boolean }
  ) {
    this.show({
      title,
      message,
      buttons,
      cancelable: options?.cancelable ?? true,
    });
  }

  /**
   * Semantic helpers
   */
  success(title: string, message?: string, onOk?: () => void) {
    this.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', style: 'default', onPress: onOk }],
    });
  }

  error(title: string, message?: string, onOk?: () => void) {
    this.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', style: 'destructive', onPress: onOk }],
    });
  }

  warning(title: string, message?: string, onOk?: () => void) {
    this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', style: 'default', onPress: onOk }],
    });
  }

  info(title: string, message?: string, onOk?: () => void) {
    this.show({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', style: 'default', onPress: onOk }],
    });
  }

  confirm(options: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) {
    this.show({
      title: options.title,
      message: options.message,
      type: options.destructive ? 'error' : 'confirm',
      buttons: [
        {
          text: options.cancelText || 'Batal',
          style: 'cancel',
          onPress: options.onCancel,
        },
        {
          text: options.confirmText || (options.destructive ? 'Hapus' : 'Konfirmasi'),
          style: options.destructive ? 'destructive' : 'default',
          onPress: options.onConfirm,
        },
      ],
      cancelable: true,
    });
  }
}

export const popup = new PopupManager();
