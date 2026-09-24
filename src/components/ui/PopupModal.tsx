import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  CheckCircle,
  WarningCircle,
  Warning,
  Info,
  Question,
} from 'phosphor-react-native';
import { Colors, FontFamily, Radius, Spacing } from '@/constants/theme';
import { popup, type PopupConfig, type PopupButton } from '@/lib/popup';

export function PopupModal() {
  const [config, setConfig] = useState<PopupConfig | null>(null);

  useEffect(() => {
    return popup.register((newConfig) => {
      setConfig(newConfig);
    });
  }, []);

  if (!config) {
    return null;
  }

  const handleClose = () => {
    popup.close();
  };

  const handleBackdropPress = () => {
    if (config.cancelable) {
      // Find cancel button to trigger its callback if present
      const cancelBtn = config.buttons.find((b) => b.style === 'cancel');
      if (cancelBtn?.onPress) {
        void cancelBtn.onPress();
      }
      handleClose();
    }
  };

  const handleButtonPress = async (btn: PopupButton) => {
    handleClose();
    if (btn.onPress) {
      try {
        await btn.onPress();
      } catch (err) {
        console.error('Error executing popup action:', err);
      }
    }
  };

  const getThemeInfo = () => {
    switch (config.type) {
      case 'success':
        return {
          icon: <CheckCircle size={32} color={Colors.primary[600]} weight="fill" />,
          bgColor: Colors.primary[50],
          btnColor: Colors.primary[600],
        };
      case 'error':
        return {
          icon: <WarningCircle size={32} color={Colors.semantic.error[500]} weight="fill" />,
          bgColor: Colors.semantic.error[50],
          btnColor: Colors.semantic.error[500],
        };
      case 'warning':
        return {
          icon: <Warning size={32} color={Colors.semantic.warning[500]} weight="fill" />,
          bgColor: Colors.semantic.warning[50],
          btnColor: Colors.primary[600],
        };
      case 'confirm':
        return {
          icon: <Question size={32} color={Colors.primary[600]} weight="fill" />,
          bgColor: Colors.primary[100],
          btnColor: Colors.primary[600],
        };
      case 'info':
      default:
        return {
          icon: <Info size={32} color={Colors.semantic.info[500]} weight="fill" />,
          bgColor: Colors.semantic.info[50],
          btnColor: Colors.primary[600],
        };
    }
  };

  const theme = getThemeInfo();
  const buttons = config.buttons;

  // Layout decision: row if 2 buttons and short texts, otherwise column
  const isTwoButtons = buttons.length === 2;
  const isShortTexts = isTwoButtons && buttons.every((b) => (b.text || '').length <= 14);
  const useRowLayout = isTwoButtons && isShortTexts;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!config}
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.card}>
              {/* Top Icon Badge */}
              <View style={[styles.iconContainer, { backgroundColor: theme.bgColor }]}>
                {theme.icon}
              </View>

              {/* Title */}
              {!!config.title && <Text style={styles.title}>{config.title}</Text>}

              {/* Message */}
              {!!config.message && <Text style={styles.message}>{config.message}</Text>}

              {/* Buttons Container */}
              <View style={[styles.buttonsContainer, useRowLayout && styles.buttonsRow]}>
                {buttons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  let btnBg: string = theme.btnColor;
                  let textColor: string = Colors.stone[0];
                  let borderStyle = styles.btnFilled;

                  if (isCancel) {
                    btnBg = Colors.stone[100];
                    textColor = Colors.stone[800];
                    borderStyle = styles.btnCancel;
                  } else if (isDestructive) {
                    btnBg = Colors.semantic.error[500];
                    textColor = Colors.stone[0];
                  }

                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${idx}`}
                      activeOpacity={0.8}
                      style={[
                        styles.button,
                        borderStyle,
                        { backgroundColor: btnBg },
                        useRowLayout && styles.buttonFlex,
                      ]}
                      onPress={() => handleButtonPress(btn)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: textColor },
                          isCancel && styles.buttonCancelText,
                        ]}
                        numberOfLines={1}
                      >
                        {btn.text || 'OK'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 21, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.stone[0],
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
    alignItems: 'center',
    shadowColor: '#1C1915',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.stone[100],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    color: Colors.stone[900],
    marginBottom: Spacing[2],
  },
  message: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: Colors.stone[600],
    marginBottom: Spacing[5],
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  buttonFlex: {
    flex: 1,
  },
  btnFilled: {
    borderWidth: 0,
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  buttonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonCancelText: {
    fontFamily: FontFamily.bodySemiBold,
    fontWeight: '600',
  },
});
