import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { TreeType } from '@/services/focusSessionsApi';

export type TreeStage = 'seed' | 'plant' | 'half-grown' | 'full-grown';

type FocusTreeVisualProps = {
  progressPercent: number;
  stage: TreeStage;
  stageLabel: string;
  treeType: TreeType;
  treeTypeLabel: string;
  isCompleted: boolean;
  isDamaged: boolean;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function FocusTreeVisual({
  progressPercent,
  stage,
  stageLabel,
  treeType,
  treeTypeLabel,
  isCompleted,
  isDamaged,
}: FocusTreeVisualProps) {
  const safeProgress = clamp(progressPercent, 0, 100);
  const trunkHeight = useRef(new Animated.Value(18)).current;
  const canopyScale = useRef(new Animated.Value(0.45)).current;
  const canopyLift = useRef(new Animated.Value(10)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const nextTrunkHeight = 18 + safeProgress * 0.82;
    const nextCanopyScale = 0.45 + safeProgress / 180;
    const nextCanopyLift = 10 - safeProgress * 0.08;

    Animated.parallel([
      Animated.timing(trunkHeight, {
        toValue: nextTrunkHeight,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(canopyScale, {
        toValue: nextCanopyScale,
        duration: 700,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(canopyLift, {
        toValue: nextCanopyLift,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [canopyLift, canopyScale, safeProgress, trunkHeight]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: isDamaged ? 0.12 : isCompleted ? 0.3 : 0.24,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: isDamaged ? 0.06 : 0.14,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [isCompleted, isDamaged, shimmerOpacity]);

  const palette = useMemo(() => {
    switch (treeType) {
      case 'OAK':
        return {
          canopy: '#6AA85B',
          canopyBorder: '#B7E38D',
          trunk: '#7A5632',
          trunkBorder: '#A87944',
          glow: '#BFE79A',
          ground: '#355D34',
        };
      case 'BIRCH':
        return {
          canopy: '#88C96D',
          canopyBorder: '#D7F2A6',
          trunk: '#D8D4C8',
          trunkBorder: '#6E6B63',
          glow: '#D8F1AE',
          ground: '#44633D',
        };
      case 'PINE':
        return {
          canopy: '#2E8B57',
          canopyBorder: '#92D9B2',
          trunk: '#765338',
          trunkBorder: '#9A714D',
          glow: '#7ED0A7',
          ground: '#294E3E',
        };
      case 'CHERRY_BLOSSOM':
        return {
          canopy: '#E7A8C3',
          canopyBorder: '#F8D6E5',
          trunk: '#6F4A39',
          trunkBorder: '#976551',
          glow: '#F3CADC',
          ground: '#5B4A52',
        };
      case 'MAPLE':
      default:
        return {
          canopy: '#E38C4E',
          canopyBorder: '#F7C58B',
          trunk: '#855C33',
          trunkBorder: '#A87944',
          glow: '#F4C589',
          ground: '#5F4D2D',
        };
    }
  }, [treeType]);

  const progressTone = isDamaged
    ? '#D8A04C'
    : isCompleted
      ? '#7EE081'
      : '#6FB7FF';

  const canopyColor = isDamaged ? '#B58C56' : palette.canopy;
  const canopyBorderColor = isDamaged ? '#E2C18C' : palette.canopyBorder;
  const stemColor = isDamaged ? '#8C6944' : palette.trunk;
  const stemBorderColor = isDamaged ? '#C59A66' : palette.trunkBorder;

  const progressMessage = useMemo(() => {
    if (isDamaged) {
      return 'Damaged by interruption';
    }

    if (isCompleted && safeProgress >= 100) {
      return 'Full bloom';
    }

    if (isCompleted) {
      return 'Session saved';
    }

    return 'Growing live';
  }, [isCompleted, isDamaged, safeProgress]);

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <ThemedText type="defaultSemiBold" style={styles.heading}>
            Your Tree
          </ThemedText>
          <ThemedText type="default" style={styles.typeText}>
            {treeTypeLabel}
          </ThemedText>
        </View>
        <ThemedText type="default" style={[styles.progressText, { color: progressTone }]}>
          {Math.round(safeProgress)}%
        </ThemedText>
      </View>

      <View style={styles.stageRow}>
        <ThemedText type="default" style={styles.stageLabel}>
          {stageLabel}
        </ThemedText>
        <ThemedText type="default" style={styles.stageMeta}>
          {progressMessage}
        </ThemedText>
      </View>

      <View style={[styles.garden, !isDamaged && { backgroundColor: `${palette.ground}CC` }]}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: shimmerOpacity,
              backgroundColor: isDamaged ? '#D2A56C' : palette.glow,
            },
          ]}
        />
        {stage === 'seed' ? (
          <Animated.View
            style={[
              styles.seedShell,
              {
                borderColor: canopyBorderColor,
                backgroundColor: canopyColor,
                transform: [{ scale: canopyScale }],
              },
            ]}
          >
            <View style={styles.seedSplit} />
          </Animated.View>
        ) : null}

        {stage === 'plant' ? (
          <>
            <Animated.View
              style={[
                styles.sproutStem,
                {
                  height: trunkHeight,
                  backgroundColor: stemColor,
                  borderColor: stemBorderColor,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.plantLeaves,
                {
                  transform: [{ translateY: canopyLift }, { scale: canopyScale }],
                },
              ]}
            >
              <View
                style={[
                  styles.leaf,
                  styles.leafLeft,
                  { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                ]}
              />
              <View
                style={[
                  styles.leaf,
                  styles.leafRight,
                  { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                ]}
              />
            </Animated.View>
          </>
        ) : null}

        {stage === 'half-grown' || stage === 'full-grown' ? (
          <>
            <Animated.View
              style={[
                styles.trunk,
                {
                  height: stage === 'full-grown' ? trunkHeight : trunkHeight.interpolate({
                    inputRange: [18, 100],
                    outputRange: [36, 74],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: stemColor,
                  borderColor: stemBorderColor,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.canopyCluster,
                {
                  transform: [{ translateY: canopyLift }, { scale: canopyScale }],
                },
              ]}
            >
              <View
                style={[
                  styles.canopy,
                  styles.canopyCenter,
                  stage === 'full-grown' && styles.canopyCenterLarge,
                  { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                ]}
              />
              <View
                style={[
                  styles.canopy,
                  styles.canopyLeft,
                  stage === 'full-grown' && styles.canopyLeftLarge,
                  { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                ]}
              />
              <View
                style={[
                  styles.canopy,
                  styles.canopyRight,
                  stage === 'full-grown' && styles.canopyRightLarge,
                  { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                ]}
              />
              {stage === 'full-grown' ? (
                <View
                  style={[
                    styles.canopy,
                    styles.canopyTop,
                    { backgroundColor: canopyColor, borderColor: canopyBorderColor },
                  ]}
                />
              ) : null}
            </Animated.View>
          </>
        ) : null}
        <View style={[styles.ground, !isDamaged && { backgroundColor: palette.ground }]} />
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${safeProgress}%`,
              backgroundColor: progressTone,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2B4A3E',
    backgroundColor: '#122821',
    padding: 18,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTextGroup: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  heading: {
    color: '#EAF6F0',
  },
  typeText: {
    color: '#8FB4A2',
    fontSize: 13,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  stageLabel: {
    color: '#D9EEE3',
    fontSize: 16,
  },
  stageMeta: {
    color: '#8FB4A2',
    fontSize: 13,
  },
  garden: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#17362B',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 26,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#97F0A4',
  },
  canopyCluster: {
    position: 'absolute',
    bottom: 56,
    width: 136,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  canopy: {
    position: 'absolute',
    backgroundColor: '#66C97A',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#9EE9AB',
  },
  canopyCenter: {
    width: 72,
    height: 72,
  },
  canopyCenterLarge: {
    width: 84,
    height: 84,
    top: 4,
  },
  canopyLeft: {
    width: 58,
    height: 58,
    left: 14,
    top: 24,
  },
  canopyLeftLarge: {
    width: 64,
    height: 64,
    left: 8,
    top: 28,
  },
  canopyRight: {
    width: 58,
    height: 58,
    right: 14,
    top: 24,
  },
  canopyRightLarge: {
    width: 64,
    height: 64,
    right: 8,
    top: 28,
  },
  canopyTop: {
    width: 52,
    height: 52,
    top: -6,
  },
  seedShell: {
    position: 'absolute',
    bottom: 18,
    width: 34,
    height: 24,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedSplit: {
    width: 2,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#F3E2C1',
    opacity: 0.8,
  },
  sproutStem: {
    position: 'absolute',
    bottom: 20,
    width: 10,
    minHeight: 20,
    borderRadius: 999,
    borderWidth: 1,
  },
  plantLeaves: {
    position: 'absolute',
    bottom: 40,
    width: 112,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  leaf: {
    position: 'absolute',
    width: 42,
    height: 22,
    borderRadius: 30,
    borderWidth: 2,
  },
  leafLeft: {
    left: 20,
    transform: [{ rotate: '-34deg' }],
  },
  leafRight: {
    right: 20,
    transform: [{ rotate: '34deg' }],
  },
  trunk: {
    position: 'absolute',
    bottom: 18,
    width: 18,
    minHeight: 18,
    borderRadius: 999,
    backgroundColor: '#855C33',
    borderWidth: 1,
    borderColor: '#A87944',
  },
  ground: {
    width: '100%',
    height: 34,
    backgroundColor: '#214B36',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#274439',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
