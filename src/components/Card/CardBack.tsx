import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect, Polygon } from 'react-native-svg';
import { cardDimensions, colors } from '../../theme';

export function CardBack() {
  const width = cardDimensions.width;
  const height = cardDimensions.height;
  const patternSize = 12;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          {/* Diamond pattern definition */}
          <Pattern
            id="diamondPattern"
            patternUnits="userSpaceOnUse"
            width={patternSize}
            height={patternSize}
          >
            {/* Background for pattern tile */}
            <Rect
              width={patternSize}
              height={patternSize}
              fill={colors.card.back}
            />
            {/* Diamond shape - rotated square */}
            <Polygon
              points={`${patternSize / 2},1 ${patternSize - 1},${patternSize / 2} ${patternSize / 2},${patternSize - 1} 1,${patternSize / 2}`}
              fill="rgba(255,255,255,0.08)"
            />
          </Pattern>
        </Defs>

        {/* Main background with rounded corners */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={cardDimensions.borderRadius}
          ry={cardDimensions.borderRadius}
          fill={colors.card.back}
        />

        {/* Diamond pattern fill - clipped to inner area */}
        <Rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={cardDimensions.borderRadius - 2}
          ry={cardDimensions.borderRadius - 2}
          fill="url(#diamondPattern)"
        />

        {/* Inner border for elegance */}
        <Rect
          x={4}
          y={4}
          width={width - 8}
          height={height - 8}
          rx={cardDimensions.borderRadius - 2}
          ry={cardDimensions.borderRadius - 2}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1.5}
        />

        {/* Outer border */}
        <Rect
          x={0.5}
          y={0.5}
          width={width - 1}
          height={height - 1}
          rx={cardDimensions.borderRadius}
          ry={cardDimensions.borderRadius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardDimensions.width,
    height: cardDimensions.height,
    borderRadius: cardDimensions.borderRadius,
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default CardBack;
