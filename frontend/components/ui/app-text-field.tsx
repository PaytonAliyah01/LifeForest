import { forwardRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { appColors, appSharedStyles } from '@/components/ui/app-theme';

type AppTextFieldProps = TextInputProps & {
  multilineHeight?: number;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  { style, placeholderTextColor = appColors.placeholder, multilineHeight, multiline, ...props },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      style={[
        appSharedStyles.input,
        multiline && multilineHeight ? styles.multiline : null,
        multiline && multilineHeight ? { minHeight: multilineHeight } : null,
        style,
      ]}
      multiline={multiline}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
});

const styles = StyleSheet.create({
  multiline: {
    textAlignVertical: 'top',
  },
});
