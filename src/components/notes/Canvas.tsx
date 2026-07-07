// Drawing canvas for notes. SVG-based, uses PanResponder (RN core) so it works
// on web and native without extra deps.
//
// Serialized shape (Note.body when kind='canvas'):
//   [{ c: '#1F1B16', w: 2, p: [[x,y], [x,y], ...] }, ...]
//   points are integers in a fixed CANVAS_W × CANVAS_H coordinate space.

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { light } from '@theme/colors';

// Internal coordinate space for stored strokes. Display width adapts to
// container; touches are translated back to this fixed grid so notes render
// consistently at any display size.
export const CANVAS_INTERNAL_W = 800;
export const CANVAS_INTERNAL_H = 1200;
// Minimum pixel distance between recorded points (in *internal* coords).
// Filters redundant samples during handwriting.
const MIN_POINT_DISTANCE = 3;

export interface CanvasStroke {
  c: string;
  w: number;
  p: [number, number][];
}

// Persisted format: { ar: aspectRatio (H/W), strokes: [...] }.
// Legacy notes stored as a bare stroke array parse to default ar = 1.5.
interface CanvasBody {
  ar: number;
  strokes: CanvasStroke[];
}
const DEFAULT_AR = CANVAS_INTERNAL_H / CANVAS_INTERNAL_W;

export interface CanvasHandle {
  serialize: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}

interface CanvasProps {
  initialStrokes?: CanvasStroke[];
  color?: string;
  strokeWidth?: number;
  aspectRatio?: number; // internal H / internal W → display height = width * aspectRatio
}

function parse(body: string): CanvasBody {
  try {
    const v = JSON.parse(body);
    if (Array.isArray(v)) return { ar: DEFAULT_AR, strokes: v };
    if (v && Array.isArray(v.strokes)) {
      return { ar: typeof v.ar === 'number' ? v.ar : DEFAULT_AR, strokes: v.strokes };
    }
    return { ar: DEFAULT_AR, strokes: [] };
  } catch {
    return { ar: DEFAULT_AR, strokes: [] };
  }
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  {
    initialStrokes = [],
    color = light.text,
    strokeWidth = 3,
    aspectRatio = DEFAULT_AR,
  },
  ref,
) {
  const { height: winH } = useWindowDimensions();
  const maxDisplayH = winH * 0.6; // never taller than 60% of the viewport
  const [strokes, setStrokes] = useState<CanvasStroke[]>(initialStrokes);
  const [containerW, setContainerW] = useState(0);
  const currentRef = useRef<CanvasStroke | null>(null);
  const scaleXRef = useRef(1);
  const scaleYRef = useRef(1);
  const [tick, setTick] = useState(0);

  // Full-width, height-capped. Aspect ratio between capture and render may
  // differ, so strokes may stretch when displayed elsewhere — the Svg uses
  // preserveAspectRatio="none" so this is consistent.
  const displayW = containerW;
  const displayH = Math.min(containerW * aspectRatio, maxDisplayH);
  scaleXRef.current = displayW > 0 ? CANVAS_INTERNAL_W / displayW : 1;
  scaleYRef.current = displayH > 0 ? CANVAS_INTERNAL_H / displayH : 1;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = Math.round(e.nativeEvent.locationX * scaleXRef.current);
          const y = Math.round(e.nativeEvent.locationY * scaleYRef.current);
          const stroke: CanvasStroke = { c: color, w: strokeWidth, p: [[x, y]] };
          currentRef.current = stroke;
          setTick((t) => t + 1);
        },
        onPanResponderMove: (e) => {
          const cur = currentRef.current;
          if (!cur) return;
          const x = Math.round(e.nativeEvent.locationX * scaleXRef.current);
          const y = Math.round(e.nativeEvent.locationY * scaleYRef.current);
          const last = cur.p[cur.p.length - 1];
          if (last) {
            const dx = x - last[0];
            const dy = y - last[1];
            if (dx * dx + dy * dy < MIN_POINT_DISTANCE * MIN_POINT_DISTANCE) return;
          }
          cur.p.push([x, y]);
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

  const capturedAr = displayW > 0 ? displayH / displayW : aspectRatio;

  useImperativeHandle(ref, () => ({
    serialize: () => JSON.stringify({ ar: capturedAr, strokes }),
    clear: () => setStrokes([]),
    isEmpty: () => strokes.length === 0,
  }));

  const preview = currentRef.current;

  return (
    <View style={styles.wrap}>
      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => {
            setStrokes((prev) => prev.slice(0, -1));
          }}
          hitSlop={8}
        >
          <Text style={styles.controlLabel}>Annuler trait</Text>
        </Pressable>
        <Pressable onPress={() => setStrokes([])} hitSlop={8}>
          <Text style={styles.controlLabelMuted}>Effacer</Text>
        </Pressable>
      </View>
      <View
        {...responder.panHandlers}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
        style={[styles.canvas, { height: displayH }]}
        collapsable={false}
      >
        {displayW > 0 && (
          <Svg
            width={displayW}
            height={displayH}
            viewBox={`0 0 ${CANVAS_INTERNAL_W} ${CANVAS_INTERNAL_H}`}
            preserveAspectRatio="none"
          >
            {strokes.map((s, i) => (
              <Polyline
                key={i}
                points={s.p.map(([x, y]) => `${x},${y}`).join(' ')}
                stroke={s.c}
                strokeWidth={s.w}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {preview && preview.p.length > 0 && (
              <Polyline
                key={`preview-${tick}`}
                points={preview.p.map(([x, y]) => `${x},${y}`).join(' ')}
                stroke={preview.c}
                strokeWidth={preview.w}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </Svg>
        )}
      </View>
    </View>
  );
});

interface CanvasViewProps {
  body: string;
  // Fixed pixel width; if omitted, view fills container via onLayout.
  width?: number;
  // aspectRatio prop no longer accepted — the note's saved aspect wins.
}

export function CanvasView({ body, width }: CanvasViewProps) {
  const { ar, strokes } = parse(body);
  const [measuredW, setMeasuredW] = useState(0);
  const w = width ?? measuredW;

  const svg = (renderW: number) => (
    <Svg
      width={renderW}
      height={renderW * ar}
      viewBox={`0 0 ${CANVAS_INTERNAL_W} ${CANVAS_INTERNAL_H}`}
      preserveAspectRatio="none"
    >
      {strokes.map((s, i) => (
        <Polyline
          key={i}
          points={s.p.map(([x, y]) => `${x},${y}`).join(' ')}
          stroke={s.c}
          strokeWidth={s.w}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </Svg>
  );

  if (width !== undefined) return svg(width);

  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => setMeasuredW(e.nativeEvent.layout.width)}
    >
      {w > 0 ? svg(w) : null}
    </View>
  );
}

export function parseStrokes(body: string): CanvasStroke[] {
  return parse(body).strokes;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  canvas: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE7DD',
    overflow: 'hidden',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
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
