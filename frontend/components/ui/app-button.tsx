import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { appColors } from '@/components/ui/app-theme';

type AppButtonProps = {
  label: string;
  onPress: ((event: GestureResponderEvent) => void) | (() => void);
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  icon?: ReactNode;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  testID,
  icon,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : appColors.secondaryText} />
      ) : (
        <>
          {icon}
          <ThemedText
            type="defaultSemiBold"
            style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}
          >
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primaryBorder,
    shadowColor: appColors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  secondary: {
    backgroundColor: appColors.secondary,
    borderColor: appColors.secondaryBorder,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
  },
  primaryLabel: {
    color: appColors.primaryText,
  },
  secondaryLabel: {
    color: appColors.secondaryText,
  },
});
