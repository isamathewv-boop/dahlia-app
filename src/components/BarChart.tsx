import '../ui/charts.css'

export interface Bar {
  label: string
  value: number
  /** Shown on hover, for the detail that doesn't fit in the label. */
  hint?: string
}

interface Props {
  bars: Bar[]
  /** Unit appended to each value, e.g. "min". */
  unit?: string
  /** Shown when there is genuinely nothing to plot. */
  emptyNote?: string
}

/**
 * A single-series horizontal bar chart in plain CSS.
 *
 * Horizontal on purpose: the labels are date ranges and symptom names, and
 * laying them out vertically avoids rotated axis text entirely. Every bar is
 * directly labelled with its value, so nothing is encoded in colour alone and
 * no separate table view is needed. One series, so no legend — the heading
 * above it names the measure.
 */
export default function BarChart({ bars, unit, emptyNote }: Props) {
  const max = Math.max(...bars.map((bar) => bar.value), 0)

  if (bars.length === 0 || max === 0) {
    return (
      <div className="viz-root">
        <p className="viz-empty">{emptyNote ?? 'Nothing logged yet.'}</p>
      </div>
    )
  }

  return (
    <div className="viz-root">
      <ul className="viz-bars">
        {bars.map((bar) => (
          <li key={bar.label} className="viz-bar-row">
            <span className="viz-bar-label">{bar.label}</span>
            <span
              className="viz-bar-track"
              title={bar.hint ?? `${bar.label}: ${bar.value}${unit ? ` ${unit}` : ''}`}
            >
              {bar.value > 0 && (
                <span
                  className="viz-bar-fill"
                  style={{ width: `${(bar.value / max) * 100}%` }}
                />
              )}
            </span>
            <span className="viz-bar-value">
              {bar.value}
              {unit ? ` ${unit}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
