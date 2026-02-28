import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Card as CardType } from '../../types';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { CARD_DIMENSIONS, CARD_SHADOW, ANIMATION } from '../../utils/constants';
import { useHaptics } from '../../hooks/useHaptics';

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  dealFrom?: { x: number; y: number }; // Starting position for deal animation
  dealTo?: { x: number; y: number };   // Target position
  delay?: number; // Delay before starting animation (for staggered deals)
  onDealComplete?: () => void;
}

export function Card({
  card,
  faceUp = true,
  dealFrom,
  dealTo = { x: 0, y: 0 },
  delay = 0,
  onDealComplete,
}: CardProps) {
  const haptics = useHaptics();
  
  // Animation values
  const translateX = useSharedValue(dealFrom?.x ?? dealTo.x);
  const translateY = useSharedValue(dealFrom?.y ?? dealTo.y);
  const rotateY = useSharedValue(faceUp ? 0 : 180);
  const scale = useSharedValue(dealFrom ? 0.8 : 1);
  const opacity = useSharedValue(dealFrom ? 0 : 1);

  // Trigger deal animation
  useEffect(() => {
    if (dealFrom) {
      // Start with initial position
      translateX.value = dealFrom.x;
      translateY.value = dealFrom.y;
      opacity.value = 0;
      scale.value = 0.8;

      // Animate after delay
      const timeout = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 100 });
        
        translateX.value = withSpring(dealTo.x, ANIMATION.deal, (finished) => {
          if (finished && onDealComplete) {
            runOnJS(onDealComplete)();
          }
        });
        
        translateY.value = withSpring(dealTo.y, ANIMATION.deal);
        scale.value = withSpring(1, ANIMATION.deal);

        // Trigger haptic
        haptics.dealCard();
      }, delay);

      return () => clearTimeout(timeout);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Shared values are stable refs
  }, [dealFrom, dealTo, delay]);

  // Handle flip animation
  useEffect(() => {
    rotateY.value = withTiming(faceUp ? 0 : 180, {
      duration: ANIMATION.flip.duration,
      easing: Easing.inOut(Easing.cubic),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rotateY is a stable shared value ref
  }, [faceUp]);

  // Animated styles for the container
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Front face style (visible when rotateY is 0-90)
  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden',
      opacity: rotateY.value <= 90 ? 1 : 0,
    };
  });

  // Back face style (visible when rotateY is 90-180)
  const backStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      opacity: rotateY.value > 90 ? 1 : 0,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle, CARD_SHADOW]}>
      <View style={styles.cardWrapper}>
        <Animated.View style={frontStyle}>
          <CardFace card={card} />
        </Animated.View>
        <Animated.View style={backStyle}>
          <CardBack />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_DIMENSIONS.width,
    height: CARD_DIMENSIONS.height,
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
});
