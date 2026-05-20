import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

const getTreePalette = (treeType: Tree['treeType'], damaged: boolean) => {
  if (damaged) {
    return {
      canopy: '#B58C56',
      canopyBorder: '#E2C18C',
      trunk: '#8C6944',
      ground: '#5F4B35',
    };
  }

  switch (treeType) {
    case 'OAK':
      return {
        canopy: '#6AA85B',
        canopyBorder: '#B7E38D',
        trunk: '#7A5632',
        ground: '#355D34',
      };
    case 'BIRCH':
      return {
        canopy: '#88C96D',
        canopyBorder: '#D7F2A6',
        trunk: '#D8D4C8',
        ground: '#44633D',
      };
    case 'PINE':
      return {
        canopy: '#2E8B57',
        canopyBorder: '#92D9B2',
        trunk: '#765338',
        ground: '#294E3E',
      };
    case 'CHERRY_BLOSSOM':
      return {
        canopy: '#E7A8C3',
        canopyBorder: '#F8D6E5',
        trunk: '#6F4A39',
        ground: '#5B4A52',
      };
    case 'MAPLE':
    default:
      return {
        canopy: '#E38C4E',
        canopyBorder: '#F7C58B',
        trunk: '#855C33',
        ground: '#5F4D2D',
      };
  }
};

const getTreeScale = (growthStage: number): number => {
  switch (growthStage) {
    case 3:
      return 1;
    case 2:
      return 0.84;
    case 1:
      return 0.68;
    default:
      return 0.52;
  }
};

function ForestTreeCard({ tree, index }: { tree: Tree; index: number }) {
  const palette = getTreePalette(tree.treeType, tree.damaged);
  const scale = getTreeScale(tree.growthStage);
  const crownSize = 72 * scale;
  const sideCrownSize = 54 * scale;
  const trunkHeight = 60 * scale;
  const trunkWidth = Math.max(12, 18 * scale);
  const topOffset = index % 3 === 1 ? 18 : index % 3 === 2 ? 8 : 0;

  return (
    <ThemedView style={[styles.treeCard, { marginTop: topOffset }]}>
      <View style={[styles.treeScene, { backgroundColor: `${palette.ground}33` }]}>
        <View
          style={[
            styles.sceneGlow,
            {
              backgroundColor: `${palette.canopy}55`,
              width: 110 * scale,
              height: 110 * scale,
            },
          ]}
        />
        <View style={styles.treeShape}>
          <View
            style={[
              styles.sideCanopy,
              styles.leftCanopy,
              {
                width: sideCrownSize,
                height: sideCrownSize,
                backgroundColor: palette.canopy,
                borderColor: palette.canopyBorder,
              },
            ]}
          />
          <View
            style={[
              styles.mainCanopy,
              {
                width: crownSize,
                height: crownSize,
                backgroundColor: palette.canopy,
                borderColor: palette.canopyBorder,
              },
            ]}
          />
          <View
            style={[
              styles.sideCanopy,
              styles.rightCanopy,
              {
                width: sideCrownSize,
                height: sideCrownSize,
                backgroundColor: palette.canopy,
                borderColor: palette.canopyBorder,
              },
            ]}
          />
          <View
            style={[
              styles.trunk,
              {
                height: trunkHeight,
                width: trunkWidth,
                backgroundColor: palette.trunk,
              },
            ]}
          />
        </View>
        <View style={[styles.groundPatch, { backgroundColor: palette.ground }]} />
      </View>

      <View style={styles.treeMeta}>
        <ThemedText type="defaultSemiBold" style={styles.treeTitle}>
          {getTreeTypeLabel(tree.treeType)}
        </ThemedText>
        <ThemedText style={styles.treeSubtitle}>
          {getStageLabel(tree.growthStage)}
        </ThemedText>
        <ThemedText style={styles.treeProgress}>
          {tree.growthProgress}% growth
          {tree.damaged ? ' • damaged' : tree.completed ? ' • completed' : ''}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function ForestScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [trees, setTrees] = useState<Tree[]>([]);

  const horizontalPadding = width < 380 ? 16 : width < 768 ? 24 : 32;
  const contentMaxWidth = width < 768 ? width - horizontalPadding * 2 : 980;
  const forestTrees = useMemo(
    () =>
      [...trees]
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    [trees],
  );

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

        setErrorMessage(data?.error || data?.message || 'Could not load your forest.');
      } else {
        setErrorMessage('Could not load your forest.');
      }
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

  const completedCount = forestTrees.filter((tree) => tree.completed).length;
  const damagedCount = forestTrees.filter((tree) => tree.damaged).length;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D7E7D8', dark: '#102018' }}
      headerImage={<View style={styles.headerBackdrop} />}
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
            Every focus session leaves behind a tree. Healthy sessions keep growing. Interrupted ones stay scarred in the grove.
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
            <ActivityIndicator size="small" color="#4CAF50" />
            <ThemedText style={styles.feedbackText}>Growing your forest view...</ThemedText>
          </ThemedView>
        ) : null}

        {!loading && errorMessage ? (
          <ThemedView style={styles.errorCard}>
            <ThemedText type="defaultSemiBold" style={styles.errorTitle}>
              Couldn&apos;t load your forest
            </ThemedText>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <Pressable style={styles.retryButton} onPress={() => void loadForest()}>
              <ThemedText type="defaultSemiBold" style={styles.retryButtonText}>
                Try Again
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && forestTrees.length === 0 ? (
          <ThemedView style={styles.feedbackCard}>
            <ThemedText type="defaultSemiBold" style={styles.feedbackTitle}>
              No trees yet
            </ThemedText>
            <ThemedText style={styles.feedbackText}>
              Complete a focus session and your first tree will appear here.
            </ThemedText>
          </ThemedView>
        ) : null}

        {!loading && !errorMessage && forestTrees.length > 0 ? (
          <ThemedView style={styles.forestGrid}>
            {forestTrees.map((tree, index) => (
              <ForestTreeCard key={tree.id} tree={tree} index={index} />
            ))}
          </ThemedView>
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
  headerBackdrop: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -30,
    height: 180,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    backgroundColor: '#3D6A4F',
    opacity: 0.35,
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#163026',
    borderWidth: 1,
    borderColor: '#28493D',
    gap: 6,
  },
  statNumber: {
    color: '#7EE081',
  },
  statLabel: {
    color: '#B7CCC2',
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 10,
    alignItems: 'center',
  },
  feedbackTitle: {
    color: '#EAF6F0',
  },
  feedbackText: {
    color: '#B7CCC2',
    textAlign: 'center',
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
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF6EE',
    borderColor: '#1E8E3E',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryButtonText: {
    color: '#1E8E3E',
  },
  forestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    backgroundColor: 'transparent',
  },
  treeCard: {
    width: '48%',
    minWidth: 160,
    flexGrow: 1,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#14251F',
    borderWidth: 1,
    borderColor: '#244338',
    gap: 12,
  },
  treeScene: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  sceneGlow: {
    position: 'absolute',
    top: 18,
    borderRadius: 999,
  },
  treeShape: {
    width: 124,
    height: 132,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  mainCanopy: {
    position: 'absolute',
    top: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
  sideCanopy: {
    position: 'absolute',
    top: 34,
    borderRadius: 999,
    borderWidth: 2,
  },
  leftCanopy: {
    left: 10,
  },
  rightCanopy: {
    right: 10,
  },
  trunk: {
    borderRadius: 999,
    marginBottom: 10,
  },
  groundPatch: {
    width: '100%',
    height: 26,
  },
  treeMeta: {
    gap: 4,
    backgroundColor: 'transparent',
  },
  treeTitle: {
    color: '#EAF6F0',
  },
  treeSubtitle: {
    color: '#A7C8B7',
  },
  treeProgress: {
    color: '#7FA08E',
    fontSize: 13,
  },
});
