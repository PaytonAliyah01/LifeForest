import { StyleSheet, View } from 'react-native';

import type { TreeType } from '@/services/focusSessionsApi';

type ForestTreeCardVisualProps = {
  growthStage: number;
  treeType: TreeType;
  damaged: boolean;
};

const getTreePalette = (treeType: TreeType, damaged: boolean) => {
  if (damaged) {
    return {
      canopy: '#B58C56',
      canopyBorder: '#E2C18C',
      trunk: '#8C6944',
      trunkBorder: '#C59A66',
      glow: '#D2A56C55',
      ground: '#5F4B35',
    };
  }

  switch (treeType) {
    case 'OAK':
      return {
        canopy: '#6AA85B',
        canopyBorder: '#B7E38D',
        trunk: '#7A5632',
        trunkBorder: '#A87944',
        glow: '#BFE79A55',
        ground: '#355D34',
      };
    case 'BIRCH':
      return {
        canopy: '#88C96D',
        canopyBorder: '#D7F2A6',
        trunk: '#D8D4C8',
        trunkBorder: '#6E6B63',
        glow: '#D8F1AE55',
        ground: '#44633D',
      };
    case 'PINE':
      return {
        canopy: '#2E8B57',
        canopyBorder: '#92D9B2',
        trunk: '#765338',
        trunkBorder: '#9A714D',
        glow: '#7ED0A755',
        ground: '#294E3E',
      };
    case 'CHERRY_BLOSSOM':
      return {
        canopy: '#E7A8C3',
        canopyBorder: '#F8D6E5',
        trunk: '#6F4A39',
        trunkBorder: '#976551',
        glow: '#F3CADC66',
        ground: '#5B4A52',
      };
    case 'MAPLE':
    default:
      return {
        canopy: '#E38C4E',
        canopyBorder: '#F7C58B',
        trunk: '#855C33',
        trunkBorder: '#A87944',
        glow: '#F4C58955',
        ground: '#5F4D2D',
      };
  }
};

export function ForestTreeCardVisual({
  growthStage,
  treeType,
  damaged,
}: ForestTreeCardVisualProps) {
  const palette = getTreePalette(treeType, damaged);
  const normalizedStage = Math.max(0, Math.min(3, growthStage));
  const scale = normalizedStage === 3 ? 1 : normalizedStage === 2 ? 0.84 : normalizedStage === 1 ? 0.68 : 0.52;
  const isSeed = normalizedStage === 0;
  const isPlant = normalizedStage === 1;
  const isFullGrown = normalizedStage === 3;

  const crownSize = 72 * scale;
  const sideCrownSize = 58 * scale;
  const topCrownSize = 50 * scale;
  const trunkHeight = isPlant ? 36 * scale : 68 * scale;
  const trunkWidth = Math.max(10, 18 * scale);

  return (
    <View style={[styles.scene, { backgroundColor: `${palette.ground}33` }]}>
      <View
        style={[
          styles.glow,
          {
            backgroundColor: palette.glow,
            width: 116 * scale,
            height: 116 * scale,
          },
        ]}
      />

      {isSeed ? (
        <View
          style={[
            styles.seedShell,
            {
              backgroundColor: palette.canopy,
              borderColor: palette.canopyBorder,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.seedSplit} />
        </View>
      ) : null}

      {isPlant ? (
        <>
          <View
            style={[
              styles.plantStem,
              {
                height: trunkHeight,
                width: trunkWidth * 0.56,
                backgroundColor: palette.trunk,
                borderColor: palette.trunkBorder,
              },
            ]}
          />
          <View style={styles.plantLeaves}>
            <View
              style={[
                styles.leaf,
                styles.leafLeft,
                {
                  backgroundColor: palette.canopy,
                  borderColor: palette.canopyBorder,
                  width: 38 * scale,
                  height: 22 * scale,
                },
              ]}
            />
            <View
              style={[
                styles.leaf,
                styles.leafRight,
                {
                  backgroundColor: palette.canopy,
                  borderColor: palette.canopyBorder,
                  width: 38 * scale,
                  height: 22 * scale,
                },
              ]}
            />
          </View>
        </>
      ) : null}

      {!isSeed && !isPlant ? (
        <>
          <View
            style={[
              styles.trunk,
              {
                height: trunkHeight,
                width: trunkWidth,
                backgroundColor: palette.trunk,
                borderColor: palette.trunkBorder,
              },
            ]}
          />
          <View style={styles.canopyCluster}>
            <View
              style={[
                styles.canopy,
                styles.canopyCenter,
                isFullGrown && styles.canopyCenterLarge,
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
                styles.canopy,
                styles.canopyLeft,
                isFullGrown && styles.canopyLeftLarge,
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
                styles.canopy,
                styles.canopyRight,
                isFullGrown && styles.canopyRightLarge,
                {
                  width: sideCrownSize,
                  height: sideCrownSize,
                  backgroundColor: palette.canopy,
                  borderColor: palette.canopyBorder,
                },
              ]}
            />
            {isFullGrown ? (
              <View
                style={[
                  styles.canopy,
                  styles.canopyTop,
                  {
                    width: topCrownSize,
                    height: topCrownSize,
                    backgroundColor: palette.canopy,
                    borderColor: palette.canopyBorder,
                  },
                ]}
              />
            ) : null}
          </View>
        </>
      ) : null}

      <View style={[styles.ground, { backgroundColor: palette.ground }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 14,
    borderRadius: 999,
  },
  seedShell: {
    position: 'absolute',
    bottom: 20,
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
  plantStem: {
    position: 'absolute',
    bottom: 22,
    borderRadius: 999,
    borderWidth: 1,
  },
  plantLeaves: {
    position: 'absolute',
    bottom: 44,
    width: 112,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  leaf: {
    position: 'absolute',
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
    bottom: 20,
    borderRadius: 999,
    borderWidth: 1,
  },
  canopyCluster: {
    position: 'absolute',
    bottom: 44,
    width: 132,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  canopy: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  canopyCenter: {
    top: 8,
  },
  canopyCenterLarge: {
    top: 4,
  },
  canopyLeft: {
    left: 16,
    top: 34,
  },
  canopyLeftLarge: {
    left: 10,
    top: 30,
  },
  canopyRight: {
    right: 16,
    top: 34,
  },
  canopyRightLarge: {
    right: 10,
    top: 30,
  },
  canopyTop: {
    top: -2,
  },
  ground: {
    width: '100%',
    height: 28,
  },
});
