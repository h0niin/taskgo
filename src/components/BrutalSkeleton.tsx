import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { BORDER_WIDTH, Neutral, SHADOW_OFFSET } from '../theme';

interface BrutalSkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function BrutalSkeleton({
  width = '100%',
  height = 48,
  borderRadius = 12,
  style,
}: BrutalSkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <View style={[{ marginBottom: SHADOW_OFFSET, marginRight: SHADOW_OFFSET }, style]}>
      {/* Black hard shadow */}
      <View
        style={{
          position: 'absolute',
          top: SHADOW_OFFSET,
          left: SHADOW_OFFSET,
          right: -SHADOW_OFFSET,
          bottom: -SHADOW_OFFSET,
          backgroundColor: Neutral.black,
          borderRadius,
        }}
      />

      {/* Pulsing surface */}
      <Animated.View
        style={{
          width,
          height,
          backgroundColor: '#E5E7EB',
          borderWidth: BORDER_WIDTH - 1,
          borderColor: Neutral.black,
          borderRadius,
          opacity: opacityAnim,
        }}
      />
    </View>
  );
}

/**
 * Pre-composed Card Skeleton for feeds & dashboard lists
 */
export function BrutalCardSkeleton() {
  return (
    <View
      style={{
        backgroundColor: '#FEF9C3',
        borderWidth: BORDER_WIDTH,
        borderColor: Neutral.black,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <BrutalSkeleton width="35%" height={24} borderRadius={99} />
        <BrutalSkeleton width="25%" height={24} borderRadius={99} />
      </View>
      <BrutalSkeleton width="80%" height={20} />
      <BrutalSkeleton width="100%" height={40} />
      <BrutalSkeleton width="40%" height={28} borderRadius={99} />
    </View>
  );
}

