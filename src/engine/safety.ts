import type { SymptomLog, UserProfile } from '../types'

/**
 * Safety notes. These are never softened, skipped or overridden by
 * motivation — if there is a reason to see a doctor, that outranks the plan.
 */
export function buildSafety(
  profile: UserProfile,
  symptoms: SymptomLog[],
  cycleDay: number | null,
): string[] {
  const notes: string[] = []

  // Severe symptoms today.
  const severe = symptoms.filter((s) => s.severity >= 5)
  if (severe.length > 0) {
    const names = severe.map((s) => s.symptom).join(', ')
    notes.push(
      `You logged severe ${names}. Pain that stops you functioning is worth a doctor's opinion, not a workout tweak.`,
    )
  }

  // A period that is very late.
  if (cycleDay !== null && cycleDay > profile.cycleLength + 7) {
    notes.push(
      `Your period is more than a week later than your usual ${profile.cycleLength}-day cycle. Worth checking with a doctor.`,
    )
  }

  // Conditions that change what advice is safe.
  const flagged = [
    'PCOS',
    'Thyroid',
    'Anemia',
    'Endometriosis',
    'Diabetes',
  ].filter((condition) => profile.healthConditions.includes(condition))

  if (flagged.length > 0) {
    notes.push(
      `${flagged.join(', ')} on file — plans here stay general and conservative. Your doctor's guidance overrides anything this app says.`,
    )
  }

  if (profile.healthConditions.includes('Injury')) {
    notes.push('Injury on file: high-impact movements are excluded. Stop if anything sharpens.')
  }

  return notes
}
