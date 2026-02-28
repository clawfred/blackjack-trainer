import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Card as CardType } from '../../types';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { cardDimensions, animation, shadows } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

interface CardProps {
  card: CardType;
  faceUp?: boolean;
  dealFrom?: { x: number; y: number }; // Starting position for deal animation
  dealTo?: { x: number; y: number }; // Target position
  delay?: number; // Delay before starting animation (for staggered deals)
  onDealComplete?: () => void;
}

// easeInOutCubic easing
const easeInOutCubic = Easing.bezier(0.65, 0, 0.35, 1);

export function Card({
  card,
  faceUp = true,
  dealFrom,
  dealTo = { x: 0, y: 0 },
  delay = 0,
  onDealComplete,
}: CardProps) {
  const haptics = useHaptics();

  // Track previous faceUp state to detect flips
  const prevFaceUp = useRef(faceUp);

  // Animation values
  const translateX = useSharedValue(dealFrom?.x ?? dealTo.x);
  const translateY = useSharedValue(dealFrom?.y ?? dealTo.y);
  const rotateY = useSharedValue(faceUp ? 0 : 180);
  const scale = useSharedValue(dealFrom ? 0.8 : 1);
  const opacity = useSharedValue(dealFrom ? 0 : 1);

  // For tracking which face to show during flip
  const showFront = useSharedValue(faceUp);

  // Deal animation with parabolic arc
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

        // Calculate the arc parameters
        const dx = dealTo.x - dealFrom.x;
        const distance = Math.abs(dx);
        // Arc height proportional to distance (max 60px arc)
        const arcHeight = Math.min(60, distance * 0.3);

        // X moves with spring (horizontal motion)
        translateX.value = withSpring(dealTo.x, animation.spring.deal, (finished) => {
          if (finished && onDealComplete) {
            runOnJS(onDealComplete)();
          }
        });

        // Y follows a parabolic arc: starts at dealFrom.y, arcs up, lands at dealTo.y
        // We approximate with a sequence: go up first, then settle down
        const midY = Math.min(dealFrom.y, dealTo.y) - arcHeight;

        translateY.value = withSequence(
          // Arc up to peak
          withTiming(midY, {
            duration: animation.normal * 0.4,
            easing: Easing.out(Easing.quad),
          }),
          // Arc down to target with spring for natural landing
          withSpring(dealTo.y, {
            damping: 18,
            stiffness: 250,
            mass: 0.6,
          })
        );

        scale.value = withSpring(1, animation.spring.deal);

        // Trigger haptic
        haptics.dealCard();
      }, delay);

      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Shared values are stable refs
  }, [dealFrom?.x, dealFrom?.y, dealTo.x, dealTo.y, delay]);

  // Handle flip animation - proper 2-phase: 0→90°, swap face, 90→0
  useEffect(() => {
    if (prevFaceUp.current !== faceUp) {
      prevFaceUp.current = faceUp;

      const halfDuration = animation.flip.phaseHalf;

      // Phase 1: Rotate to 90° (card edge-on)
      rotateY.value = withTiming(
        faceUp ? 90 : 90,
        { duration: halfDuration, easing: easeInOutCubic },
        (finished) => {
          if (finished) {
            // Swap which face is shown at the midpoint
            showFront.value = faceUp;

            // Phase 2: Rotate from 90° to final position
            rotateY.value = withTiming(faceUp ? 0 : 180, {
              duration: halfDuration,
              easing: easeInOutCubic,
            });
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rotateY/showFront are stable shared value refs
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

  // Front face style
  const frontStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 90, 180], [0, 90, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden' as const,
      opacity: showFront.value ? 1 : 0,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
    };
  });

  // Back face style
  const backStyle = useAnimatedStyle(() => {
    // Back face is rotated 180° relative to front
    const rotate = interpolate(rotateY.value, [0, 90, 180], [180, 90, 0]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotate}deg` }],
      backfaceVisibility: 'hidden' as const,
      opacity: showFront.value ? 0 : 1,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle, shadows.card]}>
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
    width: cardDimensions.width,
    height: cardDimensions.height,
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
});
