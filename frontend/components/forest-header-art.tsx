import { StyleSheet, View } from 'react-native';

export function ForestHeaderArt() {
  return (
    <View style={styles.headerArt}>
      <View style={styles.headerGlowLarge} />
      <View style={styles.headerGlowSmall} />
      <View style={styles.headerHillBack} />
      <View style={styles.headerHillFront} />
      <View style={styles.headerTreeTrunk} />
      <View style={styles.headerTreeCanopyMain} />
      <View style={styles.headerTreeCanopyLeft} />
      <View style={styles.headerTreeCanopyRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerArt: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlowLarge: {
    position: 'absolute',
    top: 18,
    right: 38,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: '#CFE4B6',
    opacity: 0.6,
  },
  headerGlowSmall: {
    position: 'absolute',
    top: 40,
    right: 125,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: '#F3D28C',
    opacity: 0.75,
  },
  headerHillBack: {
    position: 'absolute',
    left: -50,
    right: -50,
    bottom: 34,
    height: 120,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#5D8D5A',
    opacity: 0.75,
  },
  headerHillFront: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -12,
    height: 125,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#2F5B41',
  },
  headerTreeTrunk: {
    position: 'absolute',
    bottom: 52,
    left: 62,
    width: 24,
    height: 110,
    borderRadius: 999,
    backgroundColor: '#6C4C2F',
  },
  headerTreeCanopyMain: {
    position: 'absolute',
    bottom: 122,
    left: 28,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: '#73B168',
    borderWidth: 3,
    borderColor: '#D1F1A9',
  },
  headerTreeCanopyLeft: {
    position: 'absolute',
    bottom: 108,
    left: -6,
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#5E9D58',
    borderWidth: 3,
    borderColor: '#C2E89A',
  },
  headerTreeCanopyRight: {
    position: 'absolute',
    bottom: 108,
    left: 76,
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: '#86C379',
    borderWidth: 3,
    borderColor: '#D8F2B3',
  },
});
