import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(18, { duration: 180 }),
        withTiming(-10, { duration: 180 }),
        withTiming(0, { duration: 180 })
      ),
      3,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -2,
        },
        animatedStyle,
      ]}
      accessibilityLabel="Waving hand"
    >
      👋
    </Animated.Text>
  );
}
