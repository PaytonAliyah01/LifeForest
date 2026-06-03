import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { clearToken, getUserIdFromToken } from '@/services/authStorage';
import { getUserById, type User } from '@/services/usersApi';

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 780;

  const loadAccountData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setUser(null);
        setErrorMessage('Log in to load your account details.');
        return;
      }

      const userResponse = await getUserById(userId);
      setUser(userResponse);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Failed to load account details.');
      } else {
        setErrorMessage('Failed to load account details.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccountData();
  }, [loadAccountData]);

  useFocusEffect(
    useCallback(() => {
      void loadAccountData();
    }, [loadAccountData]),
  );

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await clearToken();
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#DDEEDF', dark: '#11211A' }}
      headerImage={<ForestHeaderArt />}
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
        <ThemedView style={styles.heroCard}>
          <ThemedText type="title" style={styles.heroTitle}>
            Your Account
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Keep your profile details and your sign-in session in one simple place.
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <ThemedText style={styles.loadingText}>Loading account data...</ThemedText>
          </ThemedView>
        ) : null}

        {!loading && errorMessage ? (
          <ThemedView style={styles.errorCard}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Couldn&apos;t load account data
            </ThemedText>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => void loadAccountData()}>
              <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                Try Again
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && user ? (
          <>
            <ThemedView style={styles.sectionCard}>
              <ThemedText type="subtitle">Profile</ThemedText>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Display name</ThemedText>
                <ThemedText type="defaultSemiBold">{user.displayName}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <ThemedText>{user.email}</ThemedText>
              </View>

              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Role</ThemedText>
                <ThemedText>{user.role}</ThemedText>
              </View>
            </ThemedView>

            <ThemedView style={styles.sectionCard}>
              <ThemedText type="subtitle">Session</ThemedText>
              <ThemedText style={styles.sessionText}>
                Your token is stored locally and attached automatically to API requests across the app.
              </ThemedText>

              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                  loggingOut && styles.buttonDisabled,
                ]}
                onPress={() => void handleLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText type="defaultSemiBold" style={styles.logoutButtonText}>
                    Log Out
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>
          </>
        ) : null}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 8,
  },
  heroTitle: {
    color: '#EAF6F0',
  },
  heroSubtitle: {
    color: '#B7CCC2',
    lineHeight: 22,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#B7CCC2',
  },
  errorCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#2A1717',
    borderWidth: 1,
    borderColor: '#6D2B2B',
    gap: 10,
  },
  errorTitle: {
    color: '#FFD9D9',
  },
  errorText: {
    color: '#FFB6B6',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 12,
  },
  infoRow: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  label: {
    color: '#8EAA9B',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  sessionText: {
    color: '#B7CCC2',
    lineHeight: 21,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF6EE',
    borderColor: '#1E8E3E',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#1E8E3E',
  },
  logoutButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#B63E3E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
