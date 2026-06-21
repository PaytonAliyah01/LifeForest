import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { appColors } from '@/components/ui/app-theme';

type InfoPanelProps = {
  title: string;
  helper?: string;
  children?: ReactNode;
};

export function InfoPanel({ title, helper, children }: InfoPanelProps) {
  return (
    <View style={styles.panel}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      {helper ? (
        <ThemedText type="default" style={styles.helper}>
          {helper}
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    backgroundColor: appColors.panel,
    padding: 16,
    gap: 6,
  },
  title: {
    color: appColors.text,
  },
  helper: {
    color: appColors.mutedText,
  },
});
