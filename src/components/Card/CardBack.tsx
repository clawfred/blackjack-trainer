import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, CARD_DIMENSIONS } from '../../utils/constants';

export function CardBack() {
  return (
    <View style={styles.container}>
      {/* Inner border for visual detail */}
      <View style={styles.innerBorder}>
        {/* Diamond pattern */}
        <View style={styles.pattern}>
          <View style={styles.diamond} />
          <View style={[styles.diamond, styles.diamond2]} />
          <View style={[styles.diamond, styles.diamond3]} />
          <View style={[styles.diamond, styles.diamond4]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_DIMENSIONS.width,
    height: CARD_DIMENSIONS.height,
    backgroundColor: COLORS.card.back,
    borderRadius: CARD_DIMENSIONS.borderRadius,
    borderWidth: CARD_DIMENSIONS.borderWidth,
    borderColor: CARD_DIMENSIONS.borderColor,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    borderRadius: CARD_DIMENSIONS.borderRadius - 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pattern: {
    width: 30,
    height: 30,
    position: 'relative',
  },
  diamond: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ rotate: '45deg' }],
    top: 11,
    left: 11,
  },
  diamond2: {
    top: 4,
    left: 4,
  },
  diamond3: {
    top: 4,
    left: 18,
  },
  diamond4: {
    top: 18,
    left: 4,
  },
});
