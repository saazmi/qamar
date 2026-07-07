// Tri-color progress bar. SPEC §10.3 — green memorized / amber learning /
// subtle marker for needsReview share.

import { StyleSheet, View } from 'react-native';
import { light } from '@theme/colors';

interface Props {
  memorized: number;
  learning: number;
  needsReview: number;
  total: number;
  height?: number;
}

export function SurahProgressBar({
  memorized,
  learning,
  needsReview,
  total,
  height = 6,
}: Props) {
  if (total <= 0) return <View style={[styles.track, { height }]} />;
  const mem = Math.min(memorized, total);
  const learn = Math.min(learning, total - mem);
  const memPct = (mem / total) * 100;
  const learnPct = (learn / total) * 100;
  const reviewPct = Math.min(needsReview / total, 1) * memPct;

  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.segment, { width: `${memPct}%`, backgroundColor: light.accent }]} />
      <View
        style={[
          styles.segment,
          { left: `${memPct}%`, width: `${learnPct}%`, backgroundColor: '#D9B25A' },
        ]}
      />
      {reviewPct > 0 && (
        <View
          style={[
            styles.reviewTick,
            { width: `${reviewPct}%`, backgroundColor: light.state.needsReview },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: light.border,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  reviewTick: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
  },
});
