import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { appColors } from '@/components/ui/app-theme';
import { getAchievementsByUser, type Achievement, type AchievementsSummary } from '@/services/achievementsApi';
import { getUserIdFromToken } from '@/services/authStorage';

const achievementCategoryLabels: Record<string, string> = {
  ROUTINES: 'Routines',
  FOCUS: 'Focus',
  FOREST: 'Forest',
  REFLECTION: 'Reflection',
  MINUTES: 'Minutes',
};

const achievementCategoryColors: Record<string, string> = {
  ROUTINES: appColors.accentBlue,
  FOCUS: appColors.accentGold,
  FOREST: appColors.primary,
  REFLECTION: appColors.accentPink,
  MINUTES: appColors.accentAmber,
};

export default function AchievementsScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [achievements, setAchievements] = useState<AchievementsSummary | null>(null);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 820;

  const achievementCollections = useMemo(() => {
    const allAchievements = achievements?.achievements ?? [];
    const unlockedAchievements = allAchievements.filter((achievement) => achievement.unlocked);
    const lockedAchievements = allAchievements
      .filter((achievement) => !achievement.unlocked)
      .sort((left, right) => right.progressPercentage - left.progressPercentage);

    return {
      unlockedAchievements,
      lockedAchievements,
      nextUpAchievements: lockedAchievements.slice(0, 3),
    };
  }, [achievements]);

  const renderAchievementCard = (achievement: Achievement, compact = false) => (
    <ThemedView
      key={achievement.code}
      style={[
        styles.achievementCard,
        compact ? styles.achievementCardCompact : null,
        achievement.unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
      ]}
    >
      <View style={styles.achievementCardHeader}>
        <View style={styles.achievementCardTitleGroup}>
          <ThemedText type="defaultSemiBold" style={styles.achievementTitle}>
            {achievement.title}
          </ThemedText>
          <ThemedView
            style={[
              styles.achievementCategoryPill,
              {
                borderColor:
                  achievementCategoryColors[achievement.category] ?? achievementCategoryColors.MINUTES,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.achievementCategoryText,
                {
                  color:
                    achievementCategoryColors[achievement.category] ?? achievementCategoryColors.MINUTES,
                },
              ]}
            >
              {achievementCategoryLabels[achievement.category] ?? achievement.category}
            </ThemedText>
          </ThemedView>
        </View>
        <ThemedView
          style={[
            styles.achievementStatePill,
            achievement.unlocked ? styles.achievementStateUnlocked : styles.achievementStateLocked,
          ]}
        >
          <ThemedText style={styles.achievementStateText}>
            {achievement.unlocked ? 'Unlocked' : 'In progress'}
          </ThemedText>
        </ThemedView>
      </View>

      <ThemedText style={styles.achievementDescription}>{achievement.description}</ThemedText>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${achievement.progressPercentage}%`,
              backgroundColor: achievement.unlocked
                ? appColors.primary
                : achievementCategoryColors[achievement.category] ?? appColors.accentGold,
            },
          ]}
        />
      </View>

      <View style={styles.achievementFooter}>
        <ThemedText style={styles.progressLabel}>
          {Math.min(achievement.currentValue, achievement.targetValue)} / {achievement.targetValue}
        </ThemedText>
        <ThemedText style={styles.progressPercentLabel}>{achievement.progressPercentage}%</ThemedText>
      </View>
    </ThemedView>
  );

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setAchievements(null);
        setErrorMessage('Log in to view your achievements.');
        return;
      }

      const response = await getAchievementsByUser(userId);
      setAchievements(response);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Could not load achievements right now.');
      } else {
        setErrorMessage('Could not load achievements right now.');
      }

      setAchievements(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  useFocusEffect(
    useCallback(() => {
      void loadAchievements();
    }, [loadAchievements]),
  );

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
            Achievements
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            See the milestones your habit consistency, focus, reflection, and forest growth have unlocked.
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingCard}>
            <ActivityIndicator size="small" color={appColors.primary} />
            <ThemedText style={styles.loadingText}>Loading achievements...</ThemedText>
          </ThemedView>
        ) : null}

        {!loading && errorMessage ? (
          <ThemedView style={styles.errorCard}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Couldn&apos;t load achievements
            </ThemedText>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => void loadAchievements()}>
              <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                Try Again
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && achievements ? (
          <>
            <View style={styles.statsRow}>
              <ThemedView style={styles.statCard}>
                <ThemedText type="title" style={styles.statNumber}>
                  {achievements.unlockedCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Unlocked</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <ThemedText type="title" style={styles.statNumber}>
                  {achievementCollections.lockedAchievements.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>In progress</ThemedText>
              </ThemedView>

              <ThemedView style={styles.statCard}>
                <ThemedText type="title" style={styles.statNumber}>
                  {achievementCollections.nextUpAchievements[0]?.progressPercentage ?? 0}%
                </ThemedText>
                <ThemedText style={styles.statLabel}>Closest next</ThemedText>
              </ThemedView>
            </View>

            {achievementCollections.nextUpAchievements.length > 0 ? (
              <ThemedView style={styles.sectionCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Next Up
                </ThemedText>
                <View style={styles.achievementList}>
                  {achievementCollections.nextUpAchievements.map((achievement) =>
                    renderAchievementCard(achievement, true),
                  )}
                </View>
              </ThemedView>
            ) : null}

            {achievementCollections.unlockedAchievements.length > 0 ? (
              <ThemedView style={styles.sectionCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Unlocked
                </ThemedText>
                <View style={styles.achievementList}>
                  {achievementCollections.unlockedAchievements.map((achievement) =>
                    renderAchievementCard(achievement),
                  )}
                </View>
              </ThemedView>
            ) : null}

            {achievementCollections.lockedAchievements.length > 0 ? (
              <ThemedView style={styles.sectionCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Still Growing
                </ThemedText>
                <View style={styles.achievementList}>
                  {achievementCollections.lockedAchievements.map((achievement) =>
                    renderAchievementCard(achievement),
                  )}
                </View>
              </ThemedView>
            ) : null}
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
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 8,
  },
  heroTitle: {
    color: appColors.text,
  },
  heroSubtitle: {
    color: appColors.mutedText,
    lineHeight: 22,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: appColors.mutedText,
  },
  errorCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: appColors.errorSurface,
    borderWidth: 1,
    borderColor: appColors.errorBorder,
    gap: 10,
  },
  errorTitle: {
    color: appColors.errorTextStrong,
  },
  errorText: {
    color: appColors.errorTextSoft,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: appColors.ghostText,
    borderColor: appColors.secondaryBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: appColors.secondaryBorder,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    padding: 16,
    backgroundColor: appColors.cardAlt,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    gap: 6,
  },
  statNumber: {
    color: appColors.primary,
  },
  statLabel: {
    color: appColors.mutedText,
    flexShrink: 1,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 12,
  },
  sectionTitle: {
    color: appColors.text,
  },
  achievementList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  achievementCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
  },
  achievementCardCompact: {
    padding: 14,
  },
  achievementCardUnlocked: {
    backgroundColor: appColors.greenPanel,
    borderColor: appColors.secondaryBorder,
  },
  achievementCardLocked: {
    backgroundColor: appColors.cardAlt,
    borderColor: appColors.panelBorder,
  },
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'transparent',
  },
  achievementCardTitleGroup: {
    flex: 1,
    gap: 8,
    backgroundColor: 'transparent',
  },
  achievementTitle: {
    color: appColors.text,
    flex: 1,
  },
  achievementCategoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: appColors.card,
  },
  achievementCategoryText: {
    fontSize: 12,
  },
  achievementStatePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  achievementStateUnlocked: {
    backgroundColor: appColors.selectedPanel,
    borderColor: appColors.selectedPanelBorder,
  },
  achievementStateLocked: {
    backgroundColor: appColors.warningSurface,
    borderColor: appColors.warningBorder,
  },
  achievementStateText: {
    color: appColors.secondaryText,
    fontSize: 12,
  },
  achievementDescription: {
    color: appColors.mutedText,
    lineHeight: 20,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: appColors.screen,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  progressLabel: {
    color: appColors.text,
    fontSize: 13,
  },
  progressPercentLabel: {
    color: appColors.mutedText,
    fontSize: 13,
  },
});
