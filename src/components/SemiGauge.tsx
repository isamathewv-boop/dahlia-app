import '../ui/charts.css'

interface Props {
  /** 0-1. Clamped, so a caller passing raw ratios never draws outside the arc. */
  value: number
  /** The number in the middle, e.g. "5/7" or "72%". Already formatted. */
  centerText: string
  /** What the ratio measures, e.g. "days logged". */
  label: string
  size?: number
}

/**
 * A single ratio against a limit — one series, so no legend. The unfilled
 * track is a lighter step of the same hue as the fill (the meter pattern),
 * not a neutral grey, so the whole arc reads as one measure at a glance.
 */
export default function SemiGauge({ value, centerText, label, size = 140 }: Props) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  const cx = size / 2
  const cy = size / 2
  const stroke = Math.max(10, Math.round(size * 0.1))
  const r = size / 2 - stroke
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const height = size / 2 + stroke / 2 + 4

  return (
    <div className="viz-root viz-gauge" style={{ width: size }}>
      <svg viewBox={`0 0 ${size} ${height}`} width={size} height={height} aria-hidden="true">
        <path d={d} pathLength={1} className="viz-gauge-track" strokeWidth={stroke} />
        <path
          d={d}
          pathLength={1}
          className="viz-gauge-fill"
          strokeWidth={stroke}
          style={{ strokeDasharray: `${clamped} 1` }}
        />
      </svg>
      <div className="viz-gauge-center">
        <div className="viz-gauge-value">{centerText}</div>
        <div className="viz-gauge-label">{label}</div>
      </div>
    </div>
  )
}
