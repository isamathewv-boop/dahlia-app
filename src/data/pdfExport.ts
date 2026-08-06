import { jsPDF } from 'jspdf'
import type { AppData } from '../types'
import {
  EQUIPMENT_LABELS,
  FLOW_LABELS,
  GOAL_LABELS,
  LEVEL_LABELS,
  SLOT_LABELS,
  SYMPTOM_LABELS,
  TONE_LABELS,
  WEIGHT_GOAL_LABELS,
} from './options'
import { formatDate } from './date'

const MARGIN = 14
const PAGE_BOTTOM = 283
const LINE_HEIGHT = 6

/** Small mutable cursor so every section can just keep writing lines. */
class Cursor {
  y = MARGIN
  private doc: jsPDF

  constructor(doc: jsPDF) {
    this.doc = doc
  }

  private ensureRoom() {
    if (this.y > PAGE_BOTTOM) {
      this.doc.addPage()
      this.y = MARGIN
    }
  }

  heading(text: string) {
    this.y += 4
    this.ensureRoom()
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(13)
    this.doc.text(text, MARGIN, this.y)
    this.y += LINE_HEIGHT
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
  }

  line(text: string) {
    this.ensureRoom()
    this.doc.text(text, MARGIN, this.y)
    this.y += LINE_HEIGHT
  }

  muted(text: string) {
    this.doc.setTextColor(120)
    this.line(text)
    this.doc.setTextColor(0)
  }

  gap() {
    this.y += 3
  }
}

/** Newest first — a reader wants to know what happened lately, not in 2023. */
function byDateDesc<T extends { date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.date.localeCompare(a.date))
}

/** Sorted, formatted profile lines — every one of these is optional. */
function profileLines(data: AppData): string[] {
  const p = data.profile
  if (!p) return ['No profile set up yet.']

  const lines = [
    `Name: ${p.name}`,
    `Goals: ${p.goals.map((g) => GOAL_LABELS[g]).join(', ') || 'none set'}`,
    `Experience level: ${LEVEL_LABELS[p.workoutLevel]}`,
    `Usual training time: ${p.timeAvailable} minutes`,
    `Equipment: ${EQUIPMENT_LABELS[p.equipment]}`,
    `Diet preference: ${p.dietPreference || 'not set'}`,
  ]

  if (p.weightKg) {
    let weightLine = `Weight: ${p.weightKg}kg`
    if (p.weightGoal === 'maintain') weightLine += ' (maintaining)'
    else if (p.weightGoal && p.targetWeightKg) {
      weightLine += ` (${WEIGHT_GOAL_LABELS[p.weightGoal].toLowerCase()}, target ${p.targetWeightKg}kg)`
    }
    lines.push(weightLine)
  }

  lines.push(
    `Health conditions: ${p.healthConditions.length ? p.healthConditions.join(', ') : 'none'}`,
    `Coach tone: ${TONE_LABELS[p.coachTone]}`,
  )

  if (p.lastPeriodDate) {
    lines.push(
      `Cycle: last period ${formatDate(p.lastPeriodDate)}, ${p.cycleLength}-day cycle, ${p.periodLength} days bleeding${p.irregularCycles ? ' (irregular)' : ''}`,
    )
  }

  return lines
}

/**
 * Builds a readable, printable record of everything in the app. This is a
 * summary for the user to keep or share (with a doctor, a trainer) — it is
 * not a machine-readable backup. Restoring the app onto a new device still
 * needs the JSON import path in Settings.
 */
export function buildExportPdf(data: AppData): jsPDF {
  const doc = new jsPDF()
  const cursor = new Cursor(doc)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Dahlia — data export', MARGIN, cursor.y)
  cursor.y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(
    `Generated ${new Date().toLocaleString()}. Your own record, kept on your device.`,
    MARGIN,
    cursor.y,
  )
  doc.setTextColor(0)
  cursor.y += 10

  cursor.heading('Profile')
  for (const line of profileLines(data)) cursor.line(line)
  cursor.gap()

  cursor.heading('Cycle log')
  if (data.cycleLogs.length === 0) {
    cursor.muted('Nothing logged yet.')
  } else {
    for (const log of byDateDesc(data.cycleLogs)) {
      cursor.line(
        `${formatDate(log.date)} — ${FLOW_LABELS[log.flow]}${log.notes ? ` — ${log.notes}` : ''}`,
      )
    }
  }
  cursor.gap()

  cursor.heading('Symptoms')
  if (data.symptomLogs.length === 0) {
    cursor.muted('Nothing logged yet.')
  } else {
    for (const log of byDateDesc(data.symptomLogs)) {
      cursor.line(
        `${formatDate(log.date)} — ${SYMPTOM_LABELS[log.symptom]}, severity ${log.severity}/5`,
      )
    }
  }
  cursor.gap()

  cursor.heading('Workouts')
  if (data.workoutLogs.length === 0) {
    cursor.muted('Nothing logged yet.')
  } else {
    for (const log of byDateDesc(data.workoutLogs)) {
      cursor.line(
        `${formatDate(log.date)} — ${log.type}, ${log.durationMinutes} min, ${log.intensity}${log.completed ? '' : ' (not finished)'}${log.notes ? ` — ${log.notes}` : ''}`,
      )
    }
  }
  cursor.gap()

  cursor.heading('Meals')
  if (data.mealLogs.length === 0) {
    cursor.muted('Nothing logged yet.')
  } else {
    for (const log of byDateDesc(data.mealLogs)) {
      const macros = log.macros
        ? ` (P ${log.macros.protein ?? '—'}g / C ${log.macros.carbs ?? '—'}g / F ${log.macros.fat ?? '—'}g${log.macrosEstimated ? ', estimated' : ''})`
        : ''
      cursor.line(`${formatDate(log.date)} — ${SLOT_LABELS[log.slot]}: ${log.description}${macros}`)
    }
  }
  cursor.gap()

  cursor.heading('Daily check-ins')
  if (data.checkIns.length === 0) {
    cursor.muted('Nothing logged yet.')
  } else {
    for (const log of byDateDesc(data.checkIns)) {
      cursor.line(
        `${formatDate(log.date)} — sleep ${log.sleepHours}h, energy ${log.energy}/5, soreness ${log.soreness}/5`,
      )
    }
  }

  return doc
}

/** Triggers a browser download of the PDF built from the given data. */
export function downloadExportPdf(data: AppData, filename: string): void {
  buildExportPdf(data).save(filename)
}
