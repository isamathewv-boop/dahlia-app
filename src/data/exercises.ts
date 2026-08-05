import type { Equipment, WorkoutLevel } from '../types'

export type Focus =
  | 'recovery'
  | 'upper'
  | 'lower'
  | 'full-body'
  | 'core'
  | 'cardio'

export const FOCUS_LABELS: Record<Focus, string> = {
  recovery: 'Recovery',
  upper: 'Upper body',
  lower: 'Lower body',
  'full-body': 'Full body',
  core: 'Core',
  cardio: 'Cardio',
}

/** Equipment is cumulative: a full gym can do everything bodyweight can. */
const EQUIPMENT_RANK: Record<Equipment, number> = {
  bodyweight: 0,
  bands: 1,
  dumbbells: 2,
  'full-gym': 3,
}

/** Experience is cumulative too: an advanced lifter can still do beginner moves. */
const LEVEL_RANK: Record<WorkoutLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

/**
 * A movement-pattern pictogram key. Many exercises legitimately share one —
 * band row, dumbbell row and cable row are the same shape from across the
 * room — so this is a stick-figure category, not a photo per exercise.
 * Defined here rather than in ui/pictograms.tsx because the exercise data
 * owns the taxonomy; the ui layer only knows how to draw it.
 */
export type PictogramKind =
  | 'pushup-wall'
  | 'pushup-incline'
  | 'pushup-knee'
  | 'pushup-flat'
  | 'pike-pushup'
  | 'dip'
  | 'plank'
  | 'side-plank'
  | 'superman'
  | 'bird-dog'
  | 'dead-bug'
  | 'row'
  | 'press-overhead'
  | 'chest-press'
  | 'curl'
  | 'pulldown'
  | 'squat'
  | 'lunge'
  | 'step-up'
  | 'lateral-walk'
  | 'bridge'
  | 'wall-sit'
  | 'calf-raise'
  | 'hinge'
  | 'leg-press'
  | 'inchworm'
  | 'bear-crawl'
  | 'squat-thrust'
  | 'crab-walk'
  | 'get-up'
  | 'hollow'
  | 'heel-tap'
  | 'walk'
  | 'jump-rope'
  | 'jog'
  | 'bike'
  | 'rowing-machine'
  | 'stretch-kneel'
  | 'stretch-lie'
  | 'wall-angel'
  | 'leg-raise'
  | 'knee-raise'

export interface Exercise {
  name: string
  focus: Focus
  /** The least equipment needed to do this at all. */
  requires: Equipment
  /**
   * The least experience this is appropriate for. Omit for beginner — most
   * of the library is fine for anyone; only genuinely technique-demanding or
   * high-skill moves need gating up.
   */
  minLevel?: WorkoutLevel
  /** Jumping or pounding. Skipped on low-readiness days and with injuries. */
  highImpact?: boolean
  /**
   * A fixed cue, for anything where sets-and-reps makes no sense — you do not
   * do "3 × 12" of a walk.
   */
  prescription?: string
  /** Measured in seconds held rather than reps. Still scales with level. */
  isHold?: boolean
  /** One line of form guidance — the answer to "how do I actually do this". */
  cue: string
  /** Which pictogram represents this movement. */
  visual: PictogramKind
}

export const EXERCISES: Exercise[] = [
  // Recovery — always available, never high impact. Each carries its own cue.
  {
    name: 'Easy walk',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '10-15 minutes, easy pace',
    cue: 'Comfortable pace, breathing easy the whole time.',
    visual: 'walk',
  },
  {
    name: 'Full-body stretch',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '5 minutes, slow',
    cue: 'Lie down, stretch out slowly, hold whatever feels tight.',
    visual: 'stretch-lie',
  },
  {
    name: 'Cat-cow',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '10 slow reps',
    cue: 'On hands and knees, arch your back up, then dip it down — slow and controlled.',
    visual: 'stretch-kneel',
  },
  {
    name: "Child's pose",
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 60 seconds',
    cue: 'Kneel, sit back onto your heels, reach your arms forward on the floor.',
    visual: 'stretch-kneel',
  },
  {
    name: 'Hip flexor stretch',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 45 seconds each side',
    cue: 'Kneel on one knee, push your hips gently forward until you feel a stretch at the front of that hip.',
    visual: 'stretch-kneel',
  },
  {
    name: 'Legs up the wall',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: 'hold 3-5 minutes',
    cue: 'Lie on your back, rest your legs straight up against a wall.',
    visual: 'stretch-lie',
  },
  {
    name: 'Slow breathing',
    focus: 'recovery',
    requires: 'bodyweight',
    prescription: '5 minutes',
    cue: 'Lie or sit comfortably. In for 4 counts, out for 6.',
    visual: 'stretch-lie',
  },

  // Upper. Three push-up regressions on purpose — a beginner should never
  // land on the standard version by default.
  {
    name: 'Wall push-up',
    focus: 'upper',
    requires: 'bodyweight',
    cue: "Stand an arm's length from a wall, hands flat at shoulder height, bend your elbows to bring your chest to the wall.",
    visual: 'pushup-wall',
  },
  {
    name: 'Incline push-up',
    focus: 'upper',
    requires: 'bodyweight',
    cue: 'Hands on a table or bench, feet back, lower your chest to the edge and press back up.',
    visual: 'pushup-incline',
  },
  {
    name: 'Knee push-up',
    focus: 'upper',
    requires: 'bodyweight',
    cue: 'Knees on the floor, hands under shoulders, lower your chest to the floor keeping a straight line from knees to head.',
    visual: 'pushup-knee',
  },
  {
    name: 'Push-up',
    focus: 'upper',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Hands under shoulders, body in a straight line, lower until your chest nearly touches the floor.',
    visual: 'pushup-flat',
  },
  {
    name: 'Superman',
    focus: 'upper',
    requires: 'bodyweight',
    isHold: true,
    cue: 'Lie face down, lift arms and legs a few inches off the floor at the same time.',
    visual: 'superman',
  },
  {
    name: 'Plank shoulder tap',
    focus: 'upper',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'In a push-up plank, tap the opposite shoulder with each hand without letting your hips rock.',
    visual: 'plank',
  },
  {
    name: 'Pike push-up',
    focus: 'upper',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Hips high in an inverted V, lower the top of your head toward the floor between your hands.',
    visual: 'pike-pushup',
  },
  {
    name: 'Diamond push-up',
    focus: 'upper',
    requires: 'bodyweight',
    minLevel: 'advanced',
    cue: 'Hands together under your chest, thumbs and index fingers touching, elbows stay close to your body.',
    visual: 'pushup-flat',
  },
  {
    name: 'Chair dip',
    focus: 'upper',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Hands on the edge of a sturdy chair behind you, bend your elbows to lower your hips, press back up.',
    visual: 'dip',
  },
  {
    name: 'Prone Y-raise',
    focus: 'upper',
    requires: 'bodyweight',
    cue: 'Lie face down, arms out overhead in a Y shape, lift them a few inches off the floor.',
    visual: 'superman',
  },
  {
    name: 'Band row',
    focus: 'upper',
    requires: 'bands',
    cue: 'Anchor the band, pull the handles to your ribs, squeeze your shoulder blades together.',
    visual: 'row',
  },
  {
    name: 'Band pull-apart',
    focus: 'upper',
    requires: 'bands',
    cue: 'Arms straight out in front holding the band, pull it apart until your arms are wide.',
    visual: 'row',
  },
  {
    name: 'Band overhead press',
    focus: 'upper',
    requires: 'bands',
    cue: 'Band under your feet, press the handles straight overhead.',
    visual: 'press-overhead',
  },
  {
    name: 'Dumbbell shoulder press',
    focus: 'upper',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: 'Dumbbells at shoulder height, press straight up until your arms are extended.',
    visual: 'press-overhead',
  },
  {
    name: 'Dumbbell row',
    focus: 'upper',
    requires: 'dumbbells',
    cue: 'Hinge forward, pull the dumbbell to your hip, keep your back flat.',
    visual: 'row',
  },
  {
    name: 'Dumbbell chest press',
    focus: 'upper',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: 'Lying down, dumbbells at chest height, press them up until your arms are extended.',
    visual: 'chest-press',
  },
  {
    name: 'Dumbbell curl',
    focus: 'upper',
    requires: 'dumbbells',
    cue: 'Elbows at your sides, curl the dumbbells up toward your shoulders, lower slowly.',
    visual: 'curl',
  },
  {
    name: 'Lat pulldown',
    focus: 'upper',
    requires: 'full-gym',
    cue: 'Grip the bar wide, pull it down to your upper chest, control it back up.',
    visual: 'pulldown',
  },
  {
    name: 'Cable row',
    focus: 'upper',
    requires: 'full-gym',
    cue: 'Sit tall, pull the handle to your stomach, squeeze your shoulder blades.',
    visual: 'row',
  },
  {
    name: 'Assisted pull-up',
    focus: 'upper',
    requires: 'full-gym',
    minLevel: 'intermediate',
    cue: 'Knee or foot on the assist platform, pull your chin over the bar.',
    visual: 'pulldown',
  },
  {
    name: 'Wall angel',
    focus: 'upper',
    requires: 'bodyweight',
    cue: 'Back against a wall, arms in a W shape, slide them up overhead and back down while keeping contact with the wall.',
    visual: 'wall-angel',
  },
  {
    name: 'Towel row',
    focus: 'upper',
    requires: 'bodyweight',
    cue: 'Sit with legs extended, loop a towel around your feet, pull the ends toward your ribs and squeeze your shoulder blades together.',
    visual: 'row',
  },

  // Lower
  {
    name: 'Bodyweight squat',
    focus: 'lower',
    requires: 'bodyweight',
    cue: 'Feet shoulder-width, sit your hips back and down like sitting in a chair, chest up.',
    visual: 'squat',
  },
  {
    name: 'Glute bridge',
    focus: 'lower',
    requires: 'bodyweight',
    cue: 'Lie on your back, knees bent, feet flat, lift your hips until your body forms a straight line.',
    visual: 'bridge',
  },
  {
    name: 'Reverse lunge',
    focus: 'lower',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Step one foot back, lower your back knee toward the floor, push through the front foot to return.',
    visual: 'lunge',
  },
  {
    name: 'Wall sit',
    focus: 'lower',
    requires: 'bodyweight',
    isHold: true,
    cue: 'Back against a wall, slide down until your knees are at 90 degrees, hold.',
    visual: 'wall-sit',
  },
  {
    name: 'Calf raise',
    focus: 'lower',
    requires: 'bodyweight',
    cue: 'Rise up onto your toes, pause, lower slowly.',
    visual: 'calf-raise',
  },
  {
    name: 'Step-up',
    focus: 'lower',
    requires: 'bodyweight',
    cue: 'Step your whole foot onto a sturdy step or box, drive through that heel to stand up.',
    visual: 'step-up',
  },
  {
    name: 'Jump squat',
    focus: 'lower',
    requires: 'bodyweight',
    minLevel: 'advanced',
    highImpact: true,
    cue: 'Squat down, then explode upward into a jump. Land soft with bent knees.',
    visual: 'squat',
  },
  {
    name: 'Band lateral walk',
    focus: 'lower',
    requires: 'bands',
    cue: 'Band around your thighs or ankles, half-squat, step sideways keeping tension on the band.',
    visual: 'lateral-walk',
  },
  {
    name: 'Band squat',
    focus: 'lower',
    requires: 'bands',
    cue: 'Band around your thighs, squat down keeping your knees pushed out against the band.',
    visual: 'squat',
  },
  {
    name: 'Goblet squat',
    focus: 'lower',
    requires: 'dumbbells',
    cue: 'Hold a dumbbell at your chest, squat down keeping your elbows inside your knees.',
    visual: 'squat',
  },
  {
    name: 'Romanian deadlift',
    focus: 'lower',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: 'Soft knees, push your hips back and lower the weight down your thighs, keep your back flat.',
    visual: 'hinge',
  },
  {
    name: 'Split squat',
    focus: 'lower',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: 'Rear foot elevated behind you, lower straight down through the front leg.',
    visual: 'lunge',
  },
  {
    name: 'Hip thrust',
    focus: 'lower',
    requires: 'full-gym',
    minLevel: 'intermediate',
    cue: 'Upper back on a bench, drive your hips up until your body is a straight line.',
    visual: 'bridge',
  },
  {
    name: 'Leg press',
    focus: 'lower',
    requires: 'full-gym',
    cue: 'Feet shoulder-width on the platform, lower under control, press back without locking your knees.',
    visual: 'leg-press',
  },
  {
    name: 'Side-lying leg raise',
    focus: 'lower',
    requires: 'bodyweight',
    cue: 'Lie on your side, lift your top leg toward the ceiling keeping it straight, lower slowly.',
    visual: 'leg-raise',
  },

  // Full body
  {
    name: 'Squat to reach',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: 'Squat down, then stand and reach both arms overhead.',
    visual: 'squat',
  },
  {
    name: 'Inchworm',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Bend and walk your hands out to a plank, then walk your feet back up to meet them.',
    visual: 'inchworm',
  },
  {
    name: 'Bear crawl',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Hands and toes on the floor, knees hovering just off the ground, crawl forward.',
    visual: 'bear-crawl',
  },
  {
    name: 'Mountain climber',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'In a plank, drive your knees toward your chest one at a time, quick but controlled.',
    visual: 'plank',
  },
  {
    name: 'Squat thrust',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Squat down, place hands on the floor, jump your feet back to a plank, then jump them back in and stand.',
    visual: 'squat-thrust',
  },
  {
    name: 'Crab walk',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    cue: 'Sit with hands behind you, lift your hips, walk forward on hands and feet facing up.',
    visual: 'crab-walk',
  },
  {
    name: 'Get-up from the floor',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: "From lying down, roll to your side and press up to standing using your hands — no momentum.",
    visual: 'get-up',
  },
  {
    name: 'Burpee',
    focus: 'full-body',
    requires: 'bodyweight',
    minLevel: 'advanced',
    highImpact: true,
    cue: 'Squat thrust straight into a jump at the top. Land soft and go again.',
    visual: 'squat-thrust',
  },
  {
    name: 'Dumbbell thruster',
    focus: 'full-body',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: 'Squat with dumbbells at your shoulders, stand and press them overhead in one motion.',
    visual: 'squat',
  },
  {
    name: 'Dumbbell deadlift to press',
    focus: 'full-body',
    requires: 'dumbbells',
    minLevel: 'intermediate',
    cue: "Hinge to lift the dumbbells from the floor, then press them overhead once you're standing tall.",
    visual: 'hinge',
  },
  {
    name: 'Renegade row',
    focus: 'full-body',
    requires: 'dumbbells',
    minLevel: 'advanced',
    cue: 'In a plank with hands on dumbbells, row one at a time without letting your hips twist.',
    visual: 'plank',
  },
  {
    name: 'Standing marching',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: 'Stand tall, march in place lifting your knees to hip height, swing your arms.',
    visual: 'walk',
  },
  {
    name: 'Standing toe touch',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: 'Stand tall, hinge forward reaching toward your toes, come back up slowly.',
    visual: 'hinge',
  },
  {
    name: 'Standing knee raise',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: 'Stand tall, lift one knee toward your chest, hold a beat, lower and switch sides.',
    visual: 'knee-raise',
  },
  {
    name: 'Sit-to-stand',
    focus: 'full-body',
    requires: 'bodyweight',
    cue: 'Sit on the edge of a sturdy chair, stand up without using your hands, sit back down with control.',
    visual: 'squat',
  },

  // Core
  {
    name: 'Dead bug',
    focus: 'core',
    requires: 'bodyweight',
    cue: 'On your back, arms up and knees bent 90 degrees, lower opposite arm and leg without arching your back.',
    visual: 'dead-bug',
  },
  {
    name: 'Plank',
    focus: 'core',
    requires: 'bodyweight',
    isHold: true,
    cue: 'Forearms and toes on the floor, body in a straight line, brace your core.',
    visual: 'plank',
  },
  {
    name: 'Side plank',
    focus: 'core',
    requires: 'bodyweight',
    isHold: true,
    minLevel: 'intermediate',
    cue: 'On one forearm, stack your feet, lift your hips so your body forms a straight line.',
    visual: 'side-plank',
  },
  {
    name: 'Bird dog',
    focus: 'core',
    requires: 'bodyweight',
    cue: 'On hands and knees, extend opposite arm and leg, keep your hips level.',
    visual: 'bird-dog',
  },
  {
    name: 'Heel tap',
    focus: 'core',
    requires: 'bodyweight',
    cue: "On your back, knees bent, reach one hand down to tap that side's heel, alternate.",
    visual: 'heel-tap',
  },
  {
    name: 'Hollow hold',
    focus: 'core',
    requires: 'bodyweight',
    isHold: true,
    minLevel: 'advanced',
    cue: 'On your back, lift shoulders and legs a few inches off the floor, low back stays flat to the ground.',
    visual: 'hollow',
  },
  {
    name: 'Seated knee lift',
    focus: 'core',
    requires: 'bodyweight',
    cue: 'Sit tall on the edge of a chair, lift one knee toward your chest, lower with control, alternate sides.',
    visual: 'knee-raise',
  },
  {
    name: 'Pelvic tilt',
    focus: 'core',
    requires: 'bodyweight',
    cue: 'Lie on your back, knees bent, flatten your low back into the floor by tightening your abs, then release.',
    visual: 'dead-bug',
  },

  // Cardio
  {
    name: 'Brisk walk',
    focus: 'cardio',
    requires: 'bodyweight',
    cue: "Fast enough that talking is a little harder, not fast enough that you can't.",
    visual: 'walk',
  },
  {
    name: 'Stair climb',
    focus: 'cardio',
    requires: 'bodyweight',
    cue: 'Steady pace up and down stairs, use the rail if you need to.',
    visual: 'walk',
  },
  {
    name: 'Dance',
    focus: 'cardio',
    requires: 'bodyweight',
    cue: 'Whatever gets you moving and keeps your heart rate up.',
    visual: 'walk',
  },
  {
    name: 'Shadow boxing',
    focus: 'cardio',
    requires: 'bodyweight',
    cue: 'Throw punches at the air, keep your feet moving, stay light on your toes.',
    visual: 'walk',
  },
  {
    name: 'Jump rope',
    focus: 'cardio',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    highImpact: true,
    cue: 'Small jumps, land on the balls of your feet, keep your elbows close to your body.',
    visual: 'jump-rope',
  },
  {
    name: 'Jog',
    focus: 'cardio',
    requires: 'bodyweight',
    minLevel: 'intermediate',
    highImpact: true,
    cue: 'Easy, conversational pace. Land under your hips, not out in front.',
    visual: 'jog',
  },
  {
    name: 'Stationary bike',
    focus: 'cardio',
    requires: 'full-gym',
    cue: 'Steady pedal cadence, resistance you can hold for the whole session.',
    visual: 'bike',
  },
  {
    name: 'Rowing machine',
    focus: 'cardio',
    requires: 'full-gym',
    cue: 'Legs push first, then lean back, then pull the handle to your ribs — reverse the order coming back.',
    visual: 'rowing-machine',
  },
]

/**
 * Exercises the user can actually do, given equipment, experience and impact
 * limits.
 *
 * Sorted best-equipment-first: if someone owns dumbbells, they should be
 * offered dumbbell work before push-ups, not buried under it.
 */
export function availableExercises(
  focus: Focus,
  equipment: Equipment,
  level: WorkoutLevel,
  allowHighImpact: boolean,
): Exercise[] {
  return EXERCISES.filter(
    (exercise) =>
      exercise.focus === focus &&
      EQUIPMENT_RANK[exercise.requires] <= EQUIPMENT_RANK[equipment] &&
      LEVEL_RANK[exercise.minLevel ?? 'beginner'] <= LEVEL_RANK[level] &&
      (allowHighImpact || !exercise.highImpact),
  ).sort(
    (a, b) => EQUIPMENT_RANK[b.requires] - EQUIPMENT_RANK[a.requires],
  )
}
