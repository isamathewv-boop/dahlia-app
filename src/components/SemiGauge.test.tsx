// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SemiGauge from './SemiGauge'

describe('SemiGauge', () => {
  it('shows the given center text and label', () => {
    render(<SemiGauge value={0.5} centerText="5/7" label="days logged" />)
    expect(screen.getByText('5/7')).toBeTruthy()
    expect(screen.getByText('days logged')).toBeTruthy()
  })

  it('draws the fill arc proportional to the value', () => {
    const { container } = render(<SemiGauge value={0.25} centerText="1/4" label="test" />)
    const fill = container.querySelector('.viz-gauge-fill') as SVGPathElement
    expect(fill.style.strokeDasharray).toBe('0.25 1')
  })

  it('clamps a value above 1 to a full arc', () => {
    const { container } = render(<SemiGauge value={4} centerText="x" label="test" />)
    const fill = container.querySelector('.viz-gauge-fill') as SVGPathElement
    expect(fill.style.strokeDasharray).toBe('1 1')
  })

  it('clamps a negative value to an empty arc', () => {
    const { container } = render(<SemiGauge value={-2} centerText="x" label="test" />)
    const fill = container.querySelector('.viz-gauge-fill') as SVGPathElement
    expect(fill.style.strokeDasharray).toBe('0 1')
  })

  it('treats a non-finite value (e.g. 0/0) as empty rather than crashing', () => {
    const { container } = render(<SemiGauge value={0 / 0} centerText="x" label="test" />)
    const fill = container.querySelector('.viz-gauge-fill') as SVGPathElement
    expect(fill.style.strokeDasharray).toBe('0 1')
  })
})
