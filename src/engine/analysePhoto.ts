import type { Macros, UserProfile } from '../types'
import { splitDataUrl } from '../data/photo'
import { loadApiKey } from '../data/aiKey'

/*
 * Photo → estimated macros, via Claude vision.
 *
 * This is the ONLY part of the app that sends anything off the device, and it
 * only runs when the user taps Analyse on a specific meal. The key is theirs,
 * stored in their browser, and goes straight to Anthropic — there is no server
 * of ours in the middle.
 *
 * The estimates come back into an editable form on purpose. Portion size from
 * a photo is genuinely hard, and presenting a guess as a measurement would be
 * the "pretty liar" this app is trying not to be.
 */

const MODEL = 'claude-opus-5'

export interface PhotoAnalysis {
  description: string
  macros: Macros
  /** The model's own confidence, surfaced rather than hidden. */
  confidence: 'low' | 'medium' | 'high'
  /** What it could not tell from the photo. Shown to the user verbatim. */
  caveat: string
}

export type AnalysisResult =
  | { ok: true; analysis: PhotoAnalysis }
  | { ok: false; error: string }

/**
 * Constrains the reply to exactly this shape, so there is no prose to parse
 * and no chance of a half-JSON response.
 */
const SCHEMA = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: 'Short plain description of the food, e.g. "dal, rice and salad".',
    },
    protein: { type: 'integer', description: 'Estimated grams of protein.' },
    carbs: { type: 'integer', description: 'Estimated grams of carbohydrate.' },
    fat: { type: 'integer', description: 'Estimated grams of fat.' },
    confidence: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description:
        'How confident the estimate is. Use low when portion size is unclear.',
    },
    caveat: {
      type: 'string',
      description:
        'One short sentence on what could not be judged from the photo, such as oil, portion size, or hidden ingredients.',
    },
  },
  required: ['description', 'protein', 'carbs', 'fat', 'confidence', 'caveat'],
  additionalProperties: false,
} as const

function buildPrompt(profile: UserProfile | null): string {
  const preference = profile?.dietPreference
    ? ` Their stated diet preference is: ${profile.dietPreference}.`
    : ''

  return [
    'Estimate the macronutrients in this meal photo.',
    preference,
    '',
    'Be honest about uncertainty rather than precise-sounding:',
    '- Portion size is the biggest source of error. If there is nothing in frame to judge scale against, say so in the caveat and set confidence to low.',
    '- Cooking oil and butter are usually invisible in a photo. Account for them if the dish is likely to contain them, and mention it.',
    '- Estimate the whole portion shown, not a standard serving.',
    '- Round to whole grams. Do not invent precision you do not have.',
  ].join('\n')
}

/**
 * Returns a result object rather than throwing — every failure here is
 * something the user needs to read, not a crash.
 */
export async function analysePhoto(
  photoDataUrl: string,
  profile: UserProfile | null,
): Promise<AnalysisResult> {
  const apiKey = loadApiKey()
  if (!apiKey) {
    return { ok: false, error: 'No API key saved. Add one in Settings first.' }
  }

  let mediaType: string
  let base64: string
  try {
    ({ mediaType, base64 } = splitDataUrl(photoDataUrl))
  } catch {
    return { ok: false, error: "That photo couldn't be read. Try taking it again." }
  }

  try {
    // Loaded on demand so the SDK never lands in the main bundle — people who
    // never use this feature should not download it.
    const { default: Anthropic } = await import('@anthropic-ai/sdk')

    const client = new Anthropic({
      apiKey,
      // The key belongs to the user and never leaves their browser except to
      // Anthropic. There is no server in this app to proxy through.
      dangerouslyAllowBrowser: true,
    })

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: {
        format: { type: 'json_schema', schema: SCHEMA },
        // A photo estimate does not need deep reasoning, and low effort keeps
        // it fast and cheap on the user's own bill.
        effort: 'low',
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64 },
            },
            { type: 'text', text: buildPrompt(profile) },
          ],
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      return {
        ok: false,
        error: 'Claude declined to analyse that image. Enter the macros by hand.',
      }
    }

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { ok: false, error: 'No estimate came back. Try again.' }
    }

    const parsed = JSON.parse(textBlock.text) as {
      description: string
      protein: number
      carbs: number
      fat: number
      confidence: PhotoAnalysis['confidence']
      caveat: string
    }

    return {
      ok: true,
      analysis: {
        description: parsed.description,
        macros: {
          protein: Math.max(0, Math.round(parsed.protein)),
          carbs: Math.max(0, Math.round(parsed.carbs)),
          fat: Math.max(0, Math.round(parsed.fat)),
        },
        confidence: parsed.confidence,
        caveat: parsed.caveat,
      },
    }
  } catch (error) {
    return { ok: false, error: describeError(error) }
  }
}

/** Turns SDK errors into something worth reading on a phone. */
function describeError(error: unknown): string {
  const status = (error as { status?: number })?.status

  switch (status) {
    case 401:
    case 403:
      return 'That API key was rejected. Check it in Settings.'
    case 429:
      return 'Rate limited by Anthropic. Wait a moment and try again.'
    case 400:
      return 'Anthropic rejected the request. The photo may be too large.'
    default:
      break
  }

  if (status && status >= 500) {
    return 'Anthropic had a server error. Try again shortly.'
  }

  return 'Could not reach Anthropic. Check your connection, or enter macros by hand.'
}
