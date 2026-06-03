import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getAnalyticsByUser, type Analytics } from '@/services/analyticsApi';
import { getUserIdFromToken } from '@/services/authStorage';

const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }

  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${remainder} min`;
};

const WEEKLY_GOAL_MINUTES = 300;

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 940;
  const isCompact = width < 760;

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setAnalytics(null);
        setErrorMessage('Log in to view your analytics dashboard.');
        return;
      }

      const response = await getAnalyticsByUser(userId);
      setAnalytics(response);
    } catch (error) {
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        setErrorMessage(data?.error || data?.message || 'Could not load analytics right now.');
      } else {
        setErrorMessage('Could not load analytics right now.');
      }

      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      void loadAnalytics();
    }, [loadAnalytics]),
  );

  const summaryCards = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      {
        label: 'Productivity Score',
        value: `${analytics.productivityScore}/100`,
        accent: '#7EE081',
      },
      {
        label: 'Completion Rate',
        value: `${analytics.completionRate}%`,
        accent: '#9EDCFF',
      },
      {
        label: 'Average Focus',
        value: `${analytics.averageFocusLevel}/5`,
        accent: '#F0D58A',
      },
      {
        label: 'Focus Time',
        value: formatMinutes(analytics.totalFocusMinutes),
        accent: '#E9B97A',
      },
      {
        label: 'Estimation Accuracy',
        value: `${analytics.estimationAccuracyPercentage}%`,
        accent: '#F2A8FF',
      },
    ];
  }, [analytics]);

  const weeklyProgress = useMemo(() => {
    if (!analytics) {
      return 0;
    }

    return Math.min(100, Math.round((analytics.weeklyFocusMinutes / WEEKLY_GOAL_MINUTES) * 100));
  }, [analytics]);

  const hasAnyAnalyticsData = useMemo(() => {
    if (!analytics) {
      return false;
    }

    return (
      analytics.totalSessions > 0 ||
      analytics.totalFocusMinutes > 0 ||
      analytics.reflectionsCount > 0 ||
      analytics.treesGrown > 0
    );
  }, [analytics]);

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
            Habit Insights
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            See how your consistency, focus time, and forest growth are shaping your habits over time.
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.feedbackCard}>
            <ActivityIndicator size="small" color="#7EE081" />
            <ThemedText style={styles.feedbackText}>Loading analytics...</ThemedText>
          </ThemedView>
        ) : null}

        {!loading && errorMessage ? (
          <ThemedView style={styles.errorCard}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Couldn&apos;t load analytics
            </ThemedText>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => void loadAnalytics()}>
              <ThemedText type="defaultSemiBold" style={styles.secondaryButtonText}>
                Try Again
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && analytics ? (
          <>
            <ThemedView style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreCopy}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Habit Pulse
                  </ThemedText>
                  <ThemedText style={styles.sectionSubtitle}>
                    A score built from your real focus completions, reflections, and tree results.
                  </ThemedText>
                </View>
                <View style={styles.scoreBadge}>
                  <ThemedText type="defaultSemiBold" style={styles.scoreBadgeValue}>
                    {analytics.productivityScore}
                  </ThemedText>
                  <ThemedText style={styles.scoreBadgeLabel}>score</ThemedText>
                </View>
              </View>
            </ThemedView>

            {!hasAnyAnalyticsData ? (
              <ThemedView style={styles.emptyCard}>
                <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                  No analytics yet
                </ThemedText>
                <ThemedText style={styles.emptyText}>
                  Finish focus sessions, save reflections, and grow trees to start seeing real analytics here.
                </ThemedText>
              </ThemedView>
            ) : null}

            {hasAnyAnalyticsData ? (
              <>
                <View style={[styles.cardGrid, isCompact && styles.cardGridCompact]}>
                  <ThemedView style={styles.weeklyCard}>
                    <View style={styles.weeklyHeader}>
                      <View style={styles.weeklyCopy}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                          This Week
                        </ThemedText>
                        <ThemedText style={styles.sectionSubtitle}>
                          {formatMinutes(analytics.weeklyFocusMinutes)} of focused work from completed sessions in the last 7 days.
                        </ThemedText>
                      </View>
                      <View style={styles.weeklyBadge}>
                        <ThemedText type="defaultSemiBold" style={styles.weeklyBadgeValue}>
                          {weeklyProgress}%
                        </ThemedText>
                        <ThemedText style={styles.weeklyBadgeLabel}>goal</ThemedText>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${weeklyProgress}%` }]} />
                    </View>

                    <View style={styles.weeklyMetaRow}>
                      <ThemedText style={styles.weeklyMetaText}>
                        Weekly goal: {formatMinutes(WEEKLY_GOAL_MINUTES)}
                      </ThemedText>
                      <ThemedText style={styles.weeklyMetaText}>
                        Completed focus: {formatMinutes(analytics.completedFocusMinutes)}
                      </ThemedText>
                    </View>
                  </ThemedView>
                </View>

                <View style={[styles.cardGrid, isCompact && styles.cardGridCompact]}>
                  {summaryCards.map((card) => (
                    <ThemedView key={card.label} style={styles.metricCard}>
                  <ThemedText type="defaultSemiBold" style={[styles.metricValue, { color: card.accent }]}>
                    {card.value}
                  </ThemedText>
                  <ThemedText style={styles.metricLabel}>{card.label}</ThemedText>
                </ThemedView>
                  ))}
                </View>

                <View style={[styles.cardGrid, isCompact && styles.cardGridCompact]}>
                  <ThemedView style={styles.detailCard}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Focus Metrics
                    </ThemedText>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Total sessions</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.totalSessions}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Completed sessions</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.completedSessions}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Interrupted sessions</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.interruptedSessions}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Average session</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {formatMinutes(Math.round(analytics.averageSessionMinutes))}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Estimated task time</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {formatMinutes(analytics.estimatedTaskMinutes)}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Actual task time</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {formatMinutes(analytics.actualTaskMinutes)}
                      </ThemedText>
                    </View>
                  </ThemedView>

                  <ThemedView style={styles.detailCard}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Habit Growth
                    </ThemedText>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Trees grown</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.treesGrown}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Fully grown trees</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.completedTrees}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Damaged trees</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.damagedTrees}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Reflections saved</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.detailValue}>
                        {analytics.reflectionsCount}
                      </ThemedText>
                    </View>
                  </ThemedView>
                </View>
              </>
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
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedbackText: {
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
  emptyCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 10,
  },
  emptyTitle: {
    color: '#EAF6F0',
  },
  emptyText: {
    color: '#B7CCC2',
    lineHeight: 21,
  },
  scoreCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  scoreCopy: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    color: '#EAF6F0',
  },
  sectionSubtitle: {
    color: '#B7CCC2',
    lineHeight: 21,
  },
  scoreBadge: {
    minWidth: 96,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#1B3028',
    borderWidth: 1,
    borderColor: '#3A654F',
    alignItems: 'center',
    gap: 2,
  },
  scoreBadgeValue: {
    color: '#7EE081',
    fontSize: 28,
  },
  scoreBadgeLabel: {
    color: '#8FB4A2',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  weeklyCard: {
    width: '100%',
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 14,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  weeklyCopy: {
    flex: 1,
    gap: 6,
    backgroundColor: 'transparent',
  },
  weeklyBadge: {
    minWidth: 88,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1B3028',
    borderWidth: 1,
    borderColor: '#3A654F',
    alignItems: 'center',
    gap: 2,
  },
  weeklyBadgeValue: {
    color: '#7EE081',
    fontSize: 24,
  },
  weeklyBadgeLabel: {
    color: '#8FB4A2',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.7,
  },
  progressTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#21392F',
    borderWidth: 1,
    borderColor: '#305446',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#7EE081',
  },
  weeklyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  weeklyMetaText: {
    color: '#B7CCC2',
    flexShrink: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  cardGridCompact: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    minWidth: 170,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 8,
  },
  metricValue: {
    fontSize: 26,
  },
  metricLabel: {
    color: '#B7CCC2',
    flexShrink: 1,
  },
  detailCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    color: '#8FB4A2',
    flex: 1,
  },
  detailValue: {
    color: '#F1F7EE',
    textAlign: 'right',
  },
});
