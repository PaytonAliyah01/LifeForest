import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { appSharedStyles } from '@/components/ui/app-theme';

type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, style }: AppCardProps) {
  return <ThemedView style={[appSharedStyles.card, style]}>{children}</ThemedView>;
}
