// app/(tabs)/index.tsx
import { Image } from 'expo-image';
import { Platform, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { api } from '@/services/api';
import { isAxiosError } from 'axios';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const [message, setMessage] = useState<string>('');        // backend message
  const [loading, setLoading] = useState<boolean>(true);     // loading indicator
  const [error, setError] = useState<string>('');           // error message

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 860;
  const logoWidth = Math.min(Math.max(width * 0.65, 180), 290);
  const logoHeight = Math.round((178 / 290) * logoWidth);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const res = await api.get<string>('/hello');        // call backend
        setMessage(res.data);
      } catch (err) {
        if (isAxiosError(err)) {
          console.log('Axios error:', err.message, err.response?.status, err.response?.data);
        } else {
          console.log('Other error:', err);
        }
        setError('Failed to load message from server');
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={[
            styles.reactLogo,
            {
              width: logoWidth,
              height: logoHeight,
            },
          ]}
        />
      }
    >
      <ThemedView
        style={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
          },
        ]}
      >
      {/* Title */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to LifeForest!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Backend Message */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Backend Message:</ThemedText>
        {loading && <ActivityIndicator size="small" color="#4CAF50" />}
        {!loading && error ? (
          <ThemedText type="default" style={{ color: 'red' }}>
            {error}
          </ThemedText>
        ) : null}
        {!loading && !error && message ? (
          <ThemedText type="default">{message}</ThemedText>
        ) : null}
      </ThemedView>

      {/* Original steps (optional) */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      </ThemedView>

      {/* Add more steps or other content here */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});