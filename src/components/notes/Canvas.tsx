// Drawing canvas for notes. SVG-based, uses PanResponder (RN core) so it works
// on web and native without extra deps.
//
// Serialized shape (Note.body when kind='canvas'):
//   [{ c: '#1F1B16', w: 2, p: [[x,y], [x,y], ...] }, ...]
//   points are integers in a fixed CANVAS_W × CANVAS_H coordinate space.

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { light } from '@theme/colors';

export const CANVAS_W = 320;
export const CANVAS_H = 320;

export interface CanvasStroke {
  c: string;
  w: number;
  p: [number, number][];
}

export interface CanvasHandle {
  serialize: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface CanvasProps {
  initialStrokes?: CanvasStroke[];
  color?: string;
  strokeWidth?: number;
}

function parse(body: string): CanvasStroke[] {
  try {
    const v = JSON.parse(body);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { initialStrokes = [], color = light.text, strokeWidth = 3 },
  ref,
) {
  const [strokes, setStrokes] = useState<CanvasStroke[]>(initialStrokes);
  const currentRef = useRef<CanvasStroke | null>(null);
  const [tick, setTick] = useState(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          const stroke: CanvasStroke = {
            c: color,
            w: strokeWidth,
            p: [[Math.round(locationX), Math.round(locationY)]],
          };
          currentRef.current = stroke;
          setTick((t) => t + 1);
        },
        onPanResponderMove: (e) => {
          const cur = currentRef.current;
          if (!cur) return;
          const { locationX, locationY } = e.nativeEvent;
          cur.p.push([Math.round(locationX), Math.round(locationY)]);
          setTick((t) => t + 1);
        },
        onPanResponderRelease: () => {
          if (!currentRef.current) return;
          const finished = currentRef.current;
          currentRef.current = null;
          setStrokes((prev) => [...prev, finished]);
        },
        onPanResponderTerminate: () => {
          if (!currentRef.current) return;
          const finished = currentRef.current;
          currentRef.current = null;
          setStrokes((prev) => [...prev, finished]);
        },
      }),
    [color, strokeWidth],
  );

  useImperativeHandle(ref, () => ({
    serialize: () => JSON.stringify(strokes),
    clear: () => setStrokes([]),
    isEmpty: () => strokes.length === 0,
  }));

  const preview = currentRef.current;

  return (
    <View>
      <View
        {...responder.panHandlers}
        style={styles.canvas}
        collapsable={false}
      >
        <Svg width={CANVAS_W} height={CANVAS_H}>
          {strokes.map((s, i) => (
            <Polyline
              key={i}
              points={s.p.map(([x, y]) => `${x},${y}`).join(' ')}
              stroke={s.c}
              strokeWidth={s.w}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {preview && preview.p.length > 0 && (
            <Polyline
              // tick is a state dep; suppress unused-var by referencing.
              key={`preview-${tick}`}
              points={preview.p.map(([x, y]) => `${x},${y}`).join(' ')}
              stroke={preview.c}
              strokeWidth={preview.w}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => {
            setStrokes((prev) => prev.slice(0, -1));
          }}
          hitSlop={8}
        >
          <Text style={styles.controlLabel}>Annuler dernier trait</Text>
        </Pressable>
        <Pressable onPress={() => setStrokes([])} hitSlop={8}>
          <Text style={styles.controlLabelMuted}>Effacer</Text>
        </Pressable>
      </View>
    </View>
  );
});

interface CanvasViewProps {
  body: string;
  scale?: number;
}

export function CanvasView({ body, scale = 1 }: CanvasViewProps) {
  const strokes = parse(body);
  return (
    <Svg width={CANVAS_W * scale} height={CANVAS_H * scale} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
      {strokes.map((s, i) => (
        <Polyline
          key={i}
          points={s.p.map(([x, y]) => `${x},${y}`).join(' ')}
          stroke={s.c}
          strokeWidth={s.w}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function parseStrokes(body: string): CanvasStroke[] {
  return parse(body);
}

const styles = StyleSheet.create({
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE7DD',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  controlLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.accent,
  },
  controlLabelMuted: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: light.textMuted,
  },
});
