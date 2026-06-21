import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions, type DimensionValue } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { ForestHeaderArt } from '@/components/forest-header-art';
import { ForestTreeCardVisual } from '@/components/forest-tree-card-visual';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { appColors } from '@/components/ui/app-theme';
import { getUserIdFromToken } from '@/services/authStorage';
import { type Tree, getTreesByUser } from '@/services/treesApi';

const getTreeTypeLabel = (treeType: Tree['treeType']): string => {
  switch (treeType) {
    case 'OAK':
      return 'Oak';
    case 'BIRCH':
      return 'Birch';
    case 'PINE':
      return 'Pine';
    case 'CHERRY_BLOSSOM':
      return 'Cherry Blossom';
    case 'MAPLE':
    default:
      return 'Maple';
  }
};

const getStageLabel = (growthStage: number): string => {
  switch (growthStage) {
    case 3:
      return 'Full-grown tree';
    case 2:
      return 'Half-grown tree';
    case 1:
      return 'Plant';
    default:
      return 'Seed';
  }
};

const formatMonthLabel = (year: number, monthIndex: number): string =>
  new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

const formatDayLabel = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

type ForestDayGroup = {
  key: string;
  label: string;
  trees: Tree[];
};

type ForestMonthGroup = {
  key: string;
  label: string;
  year: number;
  monthIndex: number;
  trees: Tree[];
  completedCount: number;
  damagedCount: number;
  days: ForestDayGroup[];
};

function ForestTreePlot({
  tree,
  selected,
  onPress,
  width,
}: {
  tree: Tree;
  selected: boolean;
  onPress: () => void;
  width: DimensionValue;
}) {
  const displayGrowthStage = tree.damaged ? tree.growthStage : 3;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.treePlot,
        { width },
        selected && styles.treePlotSelected,
        pressed && styles.treePlotPressed,
      ]}
      onPress={onPress}
    >
      <ForestTreeCardVisual
        growthStage={displayGrowthStage}
        treeType={tree.treeType}
        damaged={tree.damaged}
      />
      <ThemedText type="defaultSemiBold" style={styles.treePlotLabel}>
        {getTreeTypeLabel(tree.treeType)}
      </ThemedText>
    </Pressable>
  );
}

export default function ForestScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [trees, setTrees] = useState<Tree[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 980;
  const dayColumnCount = width < 420 ? 2 : width < 768 ? 3 : width < 1100 ? 4 : 5;
  const treePlotWidth = Math.max(
    width < 420 ? 130 : 144,
    Math.floor((contentMaxWidth - 18 * 2 - 10 * (dayColumnCount - 1)) / dayColumnCount),
  );

  const forestTrees = useMemo(
    () => [...trees].sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    [trees],
  );

  const years = useMemo(() => {
    const uniqueYears = new Set(
      forestTrees.map((tree) => new Date(tree.createdAt).getFullYear()),
    );

    return [...uniqueYears].sort((left, right) => right - left);
  }, [forestTrees]);

  const monthGroups = useMemo<ForestMonthGroup[]>(() => {
    const monthMap = new Map<string, Tree[]>();

    forestTrees.forEach((tree) => {
      const date = new Date(tree.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(key) ?? [];
      current.push(tree);
      monthMap.set(key, current);
    });

    return [...monthMap.entries()]
      .map(([key, monthTrees]) => {
        const sampleDate = new Date(monthTrees[0].createdAt);
        const year = sampleDate.getFullYear();
        const monthIndex = sampleDate.getMonth();
        const dayMap = new Map<string, Tree[]>();

        monthTrees.forEach((tree) => {
          const dayKey = tree.createdAt.slice(0, 10);
          const current = dayMap.get(dayKey) ?? [];
          current.push(tree);
          dayMap.set(dayKey, current);
        });

        const days = [...dayMap.entries()]
          .sort(([left], [right]) => right.localeCompare(left))
          .map(([dayKey, dayTrees]) => ({
            key: dayKey,
            label: formatDayLabel(dayKey),
            trees: dayTrees.sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
          }));

        return {
          key,
          label: formatMonthLabel(year, monthIndex),
          year,
          monthIndex,
          trees: monthTrees,
          completedCount: monthTrees.filter((tree) => !tree.damaged).length,
          damagedCount: monthTrees.filter((tree) => tree.damaged).length,
          days,
        };
      })
      .sort((left, right) => right.key.localeCompare(left.key));
  }, [forestTrees]);

  const selectedYearMonths = useMemo(
    () => monthGroups.filter((group) => group.year === selectedYear),
    [monthGroups, selectedYear],
  );

  const selectedMonth = useMemo(
    () => selectedYearMonths.find((group) => group.key === selectedMonthKey) ?? selectedYearMonths[0] ?? null,
    [selectedMonthKey, selectedYearMonths],
  );

  const selectedTree = useMemo(
    () => selectedMonth?.trees.find((tree) => tree.id === selectedTreeId)
      ?? selectedMonth?.trees[selectedMonth.trees.length - 1]
      ?? null,
    [selectedMonth, selectedTreeId],
  );

  useEffect(() => {
    if (years.length === 0) {
      setSelectedYear(null);
      return;
    }

    setSelectedYear((current) => (current != null && years.includes(current) ? current : years[0]));
  }, [years]);

  useEffect(() => {
    if (selectedYearMonths.length === 0) {
      setSelectedMonthKey(null);
      return;
    }

    setSelectedMonthKey((current) =>
      current != null && selectedYearMonths.some((group) => group.key === current)
        ? current
        : selectedYearMonths[0].key,
    );
  }, [selectedYearMonths]);

  useEffect(() => {
    if (!selectedMonth || selectedMonth.trees.length === 0) {
      setSelectedTreeId(null);
      return;
    }

    setSelectedTreeId((current) =>
      current != null && selectedMonth.trees.some((tree) => tree.id === current)
        ? current
        : selectedMonth.trees[selectedMonth.trees.length - 1].id,
    );
  }, [selectedMonth]);

  const loadForest = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const userId = await getUserIdFromToken();

      if (!userId) {
        setTrees([]);
        setErrorMessage('');
        return;
      }

      const response = await getTreesByUser(userId);
      setTrees(response);
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setTrees([]);
          setErrorMessage('');
          return;
        }

        const data = error.response?.data as
          | {
              error?: string;
              message?: string;
            }
          | undefined;

        console.log('Forest fetch error:', data?.error || data?.message || error.message);
      } else {
        console.log('Forest fetch error:', error);
      }

      setTrees([]);
      setErrorMessage('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForest();
  }, [loadForest]);

  useFocusEffect(
    useCallback(() => {
      void loadForest();
    }, [loadForest]),
  );

  const completedCount = forestTrees.filter((tree) => !tree.damaged).length;
  const damagedCount = forestTrees.filter((tree) => tree.damaged).length;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D7E7D8', dark: '#102018' }}
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
            Your Forest
          </ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Browse the visual history of your habit consistency by year, month, and day.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statsRow}>
          <ThemedView style={styles.statCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {forestTrees.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Forest trees</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {completedCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {damagedCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Damaged</ThemedText>
          </ThemedView>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.feedbackCard}>
            <ActivityIndicator size="small" color={appColors.primary} />
            <ThemedText style={styles.feedbackText}>Growing your forest view...</ThemedText>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && forestTrees.length === 0 ? (
            <ThemedView style={styles.feedbackCard}>
              <ThemedText type="defaultSemiBold" style={styles.feedbackTitle}>
                No trees yet
              </ThemedText>
              <ThemedText style={styles.feedbackText}>
                Keep showing up for your habits and the forest will start recording that consistency here.
              </ThemedText>
            </ThemedView>
        ) : null}

        {!loading && !errorMessage && forestTrees.length > 0 ? (
          <>
            <ThemedView style={styles.archiveCard}>
              <ThemedText type="subtitle" style={styles.archiveTitle}>
                Browse by Year
              </ThemedText>
              <View style={styles.yearChips}>
                {years.map((year) => (
                  <Pressable
                    key={year}
                    style={({ pressed }) => [
                      styles.yearChip,
                      selectedYear === year && styles.yearChipSelected,
                      pressed && styles.yearChipPressed,
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={[
                        styles.yearChipText,
                        selectedYear === year && styles.yearChipTextSelected,
                      ]}
                    >
                      {year}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            <ThemedView style={styles.archiveCard}>
              <ThemedText type="subtitle" style={styles.archiveTitle}>
                Months
              </ThemedText>
              <View style={styles.monthList}>
                {selectedYearMonths.map((group) => (
                  <Pressable
                    key={group.key}
                    style={({ pressed }) => [
                      styles.monthCard,
                      selectedMonth?.key === group.key && styles.monthCardSelected,
                      pressed && styles.monthCardPressed,
                    ]}
                    onPress={() => setSelectedMonthKey(group.key)}
                  >
                    <View style={styles.monthCardHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.monthCardTitle}>
                        {group.label}
                      </ThemedText>
                      <ThemedText style={styles.monthCardCount}>
                        {group.trees.length} trees
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.monthCardMeta}>
                      {group.completedCount} completed • {group.damagedCount} damaged • {group.days.length} active days
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            {selectedMonth ? (
              <ThemedView style={styles.archiveCard}>
                <ThemedText type="subtitle" style={styles.archiveTitle}>
                  {selectedMonth.label}
                </ThemedText>
                <ThemedText style={styles.archiveSubtitle}>
                  Trees are grouped by the day your habit work earned them, so busy months stay readable.
                </ThemedText>

                <View style={styles.daySections}>
                  {selectedMonth.days.map((day) => (
                    <View key={day.key} style={styles.daySection}>
                      <View style={styles.dayHeader}>
                        <ThemedText type="defaultSemiBold" style={styles.dayTitle}>
                          {day.label}
                        </ThemedText>
                        <ThemedText style={styles.dayCount}>
                          {day.trees.length} trees
                        </ThemedText>
                      </View>

                      <View style={styles.dayGrid}>
                        {day.trees.map((tree) => (
                          <ForestTreePlot
                            key={tree.id}
                            tree={tree}
                            width={treePlotWidth}
                            selected={selectedTree?.id === tree.id}
                            onPress={() => setSelectedTreeId(tree.id)}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ThemedView>
            ) : null}

            {selectedTree ? (
              <ThemedView style={styles.selectedTreeCard}>
                <ThemedText type="subtitle" style={styles.selectedTreeTitle}>
                  {getTreeTypeLabel(selectedTree.treeType)}
                </ThemedText>
                <ThemedText style={styles.selectedTreeSubtitle}>
                  {selectedTree.damaged ? getStageLabel(selectedTree.growthStage) : 'Full-grown tree'}
                </ThemedText>
                <View style={styles.selectedTreeMetaRow}>
                  <ThemedText style={styles.selectedTreeMeta}>
                    {selectedTree.damaged ? `${selectedTree.growthProgress}% growth • damaged` : '100% growth • earned'}
                  </ThemedText>
                  <ThemedText style={styles.selectedTreeMeta}>
                    {new Date(selectedTree.createdAt).toLocaleDateString()}
                  </ThemedText>
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
    borderRadius: 18,
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
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 10,
    alignItems: 'center',
  },
  feedbackTitle: {
    color: appColors.text,
  },
  feedbackText: {
    color: appColors.mutedText,
    textAlign: 'center',
  },
  archiveCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 14,
  },
  archiveTitle: {
    color: appColors.text,
  },
  archiveSubtitle: {
    color: appColors.softText,
  },
  yearChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  yearChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.inputBorder,
    backgroundColor: appColors.panelSoft,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  yearChipSelected: {
    backgroundColor: appColors.selectedPanel,
    borderColor: appColors.selectedPanelBorder,
  },
  yearChipPressed: {
    opacity: 0.9,
  },
  yearChipText: {
    color: appColors.mutedText,
  },
  yearChipTextSelected: {
    color: appColors.secondaryText,
  },
  monthList: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.panelBorder,
    backgroundColor: appColors.cardAlt,
    padding: 14,
    gap: 6,
  },
  monthCardSelected: {
    borderColor: appColors.selectedPanelBorder,
    backgroundColor: appColors.selectedPanel,
  },
  monthCardPressed: {
    opacity: 0.92,
  },
  monthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  monthCardTitle: {
    color: appColors.text,
    flex: 1,
  },
  monthCardCount: {
    color: appColors.primary,
  },
  monthCardMeta: {
    color: appColors.subtleText,
  },
  daySections: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  daySection: {
    gap: 10,
    backgroundColor: 'transparent',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  dayTitle: {
    color: appColors.text,
  },
  dayCount: {
    color: appColors.subtleText,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
    backgroundColor: 'transparent',
  },
  treePlot: {
    borderRadius: 18,
    padding: 8,
    minWidth: 0,
    backgroundColor: 'transparent',
    gap: 6,
  },
  treePlotSelected: {
    backgroundColor: appColors.greenPanel,
    borderWidth: 1,
    borderColor: appColors.secondaryBorder,
  },
  treePlotPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  treePlotLabel: {
    color: appColors.text,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  selectedTreeCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: appColors.card,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
    gap: 8,
  },
  selectedTreeTitle: {
    color: appColors.text,
  },
  selectedTreeSubtitle: {
    color: appColors.softText,
  },
  selectedTreeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: 'transparent',
  },
  selectedTreeMeta: {
    color: appColors.subtleText,
    flexShrink: 1,
  },
});
