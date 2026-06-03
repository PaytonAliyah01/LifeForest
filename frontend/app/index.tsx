import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getUserIdFromToken } from '@/services/authStorage';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const [checkingSession, setCheckingSession] = useState(true);

  let horizontalPadding = 32;
  if (width < 380) {
    horizontalPadding = 16;
  } else if (width < 768) {
    horizontalPadding = 24;
  }
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 520;

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userId = await getUserIdFromToken();

        if (userId) {
          router.replace('/(tabs)');
          return;
        }
      } finally {
        setCheckingSession(false);
      }
    };

    void restoreSession();
  }, []);

  if (checkingSession) {
    return (
      <View style={styles.screen}>
        <View
          style={[
            styles.content,
            {
              maxWidth: contentMaxWidth,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <ActivityIndicator size="large" color="#1E8E3E" />
          <Text style={styles.loadingText}>Restoring your session...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <Text style={styles.title}>Welcome to ForestLife</Text>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/register')}>
          <Text style={styles.secondaryButtonText}>Register</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#1E8E3E',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E8E3E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#EAF6EE',
    borderColor: '#1E8E3E',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E8E3E',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: '#1E8E3E',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
