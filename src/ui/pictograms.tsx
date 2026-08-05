import type { PictogramKind } from '../data/exercises'

type Point = [number, number]

interface Pose {
  head: Point
  shoulder: Point
  hip: Point
  hands: [Point, Point]
  feet: [Point, Point]
  /** Bend point for a limb; null draws a straight line for that side. */
  elbows?: [Point | null, Point | null]
  knees?: [Point | null, Point | null]
  ground?: boolean
  equipment?: 'wall' | 'bench' | 'chair' | 'bike' | 'rower'
  /** Small motion marks for fast or jumping movements. */
  dynamic?: boolean
}

// All poses live in a shared 0-100 viewBox so any kind can be dropped into
// the same <Pictogram> without per-exercise sizing.
const POSES: Record<PictogramKind, Pose> = {
  walk: {
    head: [50, 14], shoulder: [50, 24], hip: [50, 52],
    hands: [[66, 42], [34, 46]], elbows: [[60, 32], [40, 34]],
    feet: [[36, 90], [64, 88]], knees: [[42, 74], [58, 72]],
    ground: true,
  },
  jog: {
    head: [50, 12], shoulder: [50, 22], hip: [50, 50],
    hands: [[70, 38], [30, 44]], elbows: [[62, 28], [38, 32]],
    feet: [[30, 88], [70, 84]], knees: [[38, 66], [62, 62]],
    ground: true, dynamic: true,
  },
  'jump-rope': {
    head: [50, 12], shoulder: [50, 22], hip: [50, 50],
    hands: [[22, 48], [78, 48]], elbows: [[34, 36], [66, 36]],
    feet: [[44, 88], [56, 88]],
    ground: true, dynamic: true,
  },
  bike: {
    head: [36, 22], shoulder: [42, 30], hip: [58, 52],
    hands: [[22, 44], [24, 46]], elbows: [[32, 36], [34, 38]],
    feet: [[62, 68], [70, 58]], knees: [[58, 60], [66, 52]],
    ground: true, equipment: 'bike',
  },
  'rowing-machine': {
    head: [65, 30], shoulder: [60, 36], hip: [50, 55],
    hands: [[35, 45], [38, 47]], elbows: [[45, 42], [47, 44]],
    feet: [[30, 75], [34, 77]], knees: [[40, 66], [43, 68]],
    ground: true, equipment: 'rower',
  },

  'pushup-wall': {
    head: [24, 22], shoulder: [30, 28], hip: [56, 50],
    hands: [[70, 26], [70, 30]], feet: [[76, 86], [82, 88]],
    ground: true, equipment: 'wall',
  },
  'pushup-incline': {
    head: [16, 50], shoulder: [24, 52], hip: [56, 58],
    hands: [[24, 64], [28, 66]], feet: [[88, 66], [92, 68]],
    ground: true, equipment: 'bench',
  },
  'pushup-knee': {
    head: [14, 56], shoulder: [22, 57], hip: [52, 58],
    hands: [[18, 70], [22, 72]], feet: [[74, 78], [78, 80]],
    ground: true,
  },
  'pushup-flat': {
    head: [10, 56], shoulder: [18, 57], hip: [50, 58],
    hands: [[16, 72], [20, 74]], feet: [[86, 60], [90, 62]],
    ground: true,
  },
  'pike-pushup': {
    head: [26, 66], shoulder: [36, 54], hip: [52, 34],
    hands: [[28, 74], [32, 76]], feet: [[78, 76], [82, 78]],
    ground: true,
  },
  dip: {
    head: [58, 24], shoulder: [56, 32], hip: [56, 50],
    hands: [[74, 44], [76, 46]], elbows: [[68, 40], [70, 42]],
    feet: [[26, 80], [32, 82]],
    ground: true, equipment: 'chair',
  },
  plank: {
    head: [10, 55], shoulder: [18, 56], hip: [50, 58],
    hands: [[14, 72], [16, 74]], elbows: [[20, 68], [22, 70]],
    feet: [[86, 60], [90, 62]],
    ground: true,
  },
  'side-plank': {
    head: [14, 38], shoulder: [24, 40], hip: [54, 44],
    hands: [[24, 58], [50, 18]], elbows: [[24, 50], null],
    feet: [[86, 50], [90, 52]],
    ground: true,
  },
  superman: {
    head: [16, 46], shoulder: [24, 48], hip: [54, 50],
    hands: [[4, 40], [6, 44]], feet: [[86, 40], [90, 44]],
    ground: true,
  },
  row: {
    head: [70, 26], shoulder: [64, 32], hip: [56, 52],
    hands: [[40, 44], [42, 46]], elbows: [[52, 40], [54, 42]],
    feet: [[50, 88], [62, 86]],
    ground: true,
  },
  'press-overhead': {
    head: [50, 16], shoulder: [50, 26], hip: [50, 52],
    hands: [[30, 6], [70, 6]], elbows: [[36, 16], [64, 16]],
    feet: [[42, 88], [58, 88]],
    ground: true,
  },
  'chest-press': {
    head: [20, 52], shoulder: [28, 52], hip: [58, 54],
    hands: [[30, 24], [34, 26]], elbows: [[30, 40], [34, 42]],
    feet: [[80, 64], [84, 62]], knees: [[70, 62], [74, 60]],
    ground: true,
  },
  curl: {
    head: [50, 16], shoulder: [50, 26], hip: [50, 52],
    hands: [[38, 20], [62, 20]], elbows: [[40, 36], [60, 36]],
    feet: [[42, 88], [58, 88]],
    ground: true,
  },
  pulldown: {
    head: [50, 20], shoulder: [50, 28], hip: [50, 52],
    hands: [[30, 8], [70, 8]], elbows: [[36, 20], [64, 20]],
    feet: [[42, 86], [58, 86]],
    ground: true,
  },

  squat: {
    head: [50, 16], shoulder: [50, 24], hip: [50, 52],
    hands: [[30, 40], [70, 40]], feet: [[36, 86], [64, 86]],
    knees: [[38, 66], [62, 66]],
    ground: true,
  },
  lunge: {
    head: [50, 16], shoulder: [50, 24], hip: [50, 48],
    hands: [[36, 36], [64, 36]], feet: [[30, 88], [74, 80]],
    knees: [[36, 64], [66, 60]],
    ground: true,
  },
  'step-up': {
    head: [46, 16], shoulder: [46, 24], hip: [48, 48],
    hands: [[34, 38], [58, 40]], feet: [[30, 86], [64, 54]],
    knees: [[36, 60], [58, 58]],
    ground: true, equipment: 'bench',
  },
  'lateral-walk': {
    head: [50, 16], shoulder: [50, 24], hip: [50, 50],
    hands: [[34, 40], [66, 40]], feet: [[26, 86], [74, 86]],
    knees: [[38, 66], [62, 66]],
    ground: true,
  },
  bridge: {
    head: [18, 60], shoulder: [26, 60], hip: [52, 48],
    hands: [[16, 66], [18, 68]], feet: [[80, 66], [84, 64]],
    knees: [[66, 60], [70, 58]],
    ground: true,
  },
  'wall-sit': {
    head: [56, 20], shoulder: [56, 28], hip: [56, 52],
    hands: [[50, 40], [62, 40]], feet: [[56, 90], [62, 90]],
    knees: [[56, 74], [60, 74]],
    ground: true, equipment: 'wall',
  },
  'calf-raise': {
    head: [50, 14], shoulder: [50, 22], hip: [50, 48],
    hands: [[40, 34], [60, 34]], feet: [[44, 86], [56, 86]],
    ground: true,
  },
  hinge: {
    head: [70, 30], shoulder: [64, 36], hip: [52, 50],
    hands: [[58, 52], [60, 54]], feet: [[46, 88], [58, 88]],
    knees: [[48, 68], [56, 68]],
    ground: true,
  },
  'leg-press': {
    head: [20, 40], shoulder: [26, 44], hip: [40, 54],
    hands: [[24, 50], [26, 52]], feet: [[80, 44], [84, 42]],
    knees: [[58, 50], [62, 48]],
    ground: true,
  },
  'leg-raise': {
    head: [16, 40], shoulder: [24, 42], hip: [52, 46],
    hands: [[22, 50], [40, 30]], feet: [[84, 50], [70, 26]],
    ground: true,
  },

  inchworm: {
    head: [70, 60], shoulder: [62, 54], hip: [54, 40],
    hands: [[78, 70], [82, 72]], feet: [[46, 88], [50, 88]],
    ground: true,
  },
  'bear-crawl': {
    head: [18, 50], shoulder: [26, 52], hip: [52, 46],
    hands: [[16, 70], [20, 72]], feet: [[82, 68], [86, 66]],
    knees: [[62, 64], [66, 62]],
    ground: true,
  },
  'squat-thrust': {
    head: [12, 50], shoulder: [20, 52], hip: [48, 44],
    hands: [[16, 68], [20, 70]], feet: [[86, 58], [90, 60]],
    ground: true, dynamic: true,
  },
  'crab-walk': {
    head: [70, 55], shoulder: [62, 50], hip: [50, 38],
    hands: [[78, 60], [80, 62]], feet: [[24, 66], [20, 68]],
    knees: [[38, 54], [34, 56]],
    ground: true,
  },
  'get-up': {
    head: [24, 66], shoulder: [30, 60], hip: [48, 58],
    hands: [[20, 74], [42, 50]], feet: [[70, 80], [76, 50]],
    knees: [[58, 68], [64, 52]],
    ground: true,
  },

  'dead-bug': {
    head: [20, 50], shoulder: [28, 50], hip: [54, 50],
    hands: [[16, 32], [18, 64]], feet: [[78, 36], [86, 70]],
    knees: [[62, 44], [70, 66]],
    ground: true,
  },
  'bird-dog': {
    head: [20, 42], shoulder: [28, 50], hip: [54, 48],
    hands: [[10, 40], [30, 66]], elbows: [null, [30, 58]],
    feet: [[90, 42], [58, 66]], knees: [null, [56, 60]],
    ground: true,
  },
  'heel-tap': {
    head: [20, 50], shoulder: [28, 50], hip: [52, 50],
    hands: [[16, 58], [62, 72]], feet: [[56, 82], [70, 82]],
    knees: [[58, 66], [66, 66]],
    ground: true,
  },
  hollow: {
    head: [14, 44], shoulder: [22, 46], hip: [54, 50],
    hands: [[4, 38], [6, 36]], feet: [[86, 36], [90, 34]],
    ground: true,
  },
  'knee-raise': {
    head: [50, 14], shoulder: [50, 24], hip: [50, 50],
    hands: [[36, 36], [64, 40]], feet: [[42, 58], [62, 88]],
    knees: [[44, 44], [58, 66]],
    ground: true,
  },

  'stretch-kneel': {
    head: [70, 50], shoulder: [62, 48], hip: [46, 52],
    hands: [[80, 54], [84, 56]], feet: [[34, 86], [38, 88]],
    knees: [[38, 70], [42, 72]],
    ground: true,
  },
  'stretch-lie': {
    head: [16, 50], shoulder: [24, 50], hip: [52, 50],
    hands: [[10, 44], [14, 58]], feet: [[74, 20], [88, 50]],
    knees: [[64, 36], null],
    ground: true,
  },
  'wall-angel': {
    head: [70, 20], shoulder: [70, 30], hip: [70, 54],
    hands: [[46, 14], [46, 44]], elbows: [[56, 22], [56, 40]],
    feet: [[64, 88], [76, 88]],
    ground: true, equipment: 'wall',
  },
}

function Limb({ from, via, to }: { from: Point; via: Point | null; to: Point }) {
  if (via) {
    return (
      <polyline
        points={`${from[0]},${from[1]} ${via[0]},${via[1]} ${to[0]},${to[1]}`}
        fill="none"
      />
    )
  }
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />
}

function Equipment({ kind }: { kind: NonNullable<Pose['equipment']> }) {
  switch (kind) {
    case 'wall':
      return <line x1={78} y1={4} x2={78} y2={96} strokeWidth={4} />
    case 'bench':
      return <rect x={20} y={60} width={64} height={6} rx={2} strokeWidth={3} />
    case 'chair':
      return (
        <>
          <line x1={68} y1={28} x2={68} y2={50} strokeWidth={4} />
          <line x1={68} y1={50} x2={90} y2={50} strokeWidth={4} />
        </>
      )
    case 'bike':
      return (
        <>
          <circle cx={25} cy={85} r={9} strokeWidth={3} />
          <circle cx={70} cy={85} r={9} strokeWidth={3} />
          <line x1={25} y1={85} x2={50} y2={60} strokeWidth={3} />
          <line x1={50} y1={60} x2={70} y2={85} strokeWidth={3} />
        </>
      )
    case 'rower':
      return <line x1={8} y1={80} x2={92} y2={80} strokeWidth={3} />
  }
}

/** A local, stick-figure pictogram for one movement pattern. No network, no photos. */
export function Pictogram({ kind, size = 44 }: { kind: PictogramKind; size?: number }) {
  const pose = POSES[kind]
  const elbows = pose.elbows ?? [null, null]
  const knees = pose.knees ?? [null, null]

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      stroke="currentColor"
      fill="none"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {pose.ground && (
        <line x1={4} y1={92} x2={96} y2={92} strokeWidth={3} opacity={0.35} />
      )}
      {pose.equipment && <Equipment kind={pose.equipment} />}
      {pose.dynamic && (
        <>
          <path d="M4,18 Q0,24 4,30" strokeWidth={3} opacity={0.5} />
          <path d="M96,62 Q100,68 96,74" strokeWidth={3} opacity={0.5} />
        </>
      )}
      <line x1={pose.shoulder[0]} y1={pose.shoulder[1]} x2={pose.hip[0]} y2={pose.hip[1]} />
      <Limb from={pose.shoulder} via={elbows[0]} to={pose.hands[0]} />
      <Limb from={pose.shoulder} via={elbows[1]} to={pose.hands[1]} />
      <Limb from={pose.hip} via={knees[0]} to={pose.feet[0]} />
      <Limb from={pose.hip} via={knees[1]} to={pose.feet[1]} />
      <circle cx={pose.head[0]} cy={pose.head[1]} r={7} />
    </svg>
  )
}
