import { describe, it, expect } from 'vitest'
import {
  standardNormalPDF,
  normalPDF,
  standardNormalCDF,
  normalCDF,
  generateGaussianCurvePoints,
} from './gaussian'

describe('standardNormalPDF', () => {
  it('has peak value ~0.3989 at z=0', () => {
    const peak = 1 / Math.sqrt(2 * Math.PI)
    expect(standardNormalPDF(0)).toBeCloseTo(peak, 10)
    expect(standardNormalPDF(0)).toBeCloseTo(0.3989, 4)
  })

  it('is symmetric: f(-z) = f(z)', () => {
    const testValues = [0.5, 1, 1.5, 2, 2.5, 3]
    for (const z of testValues) {
      expect(standardNormalPDF(-z)).toBeCloseTo(standardNormalPDF(z), 15)
    }
  })

  it('approaches 0 at z = +/-4', () => {
    expect(standardNormalPDF(4)).toBeLessThan(0.0002)
    expect(standardNormalPDF(-4)).toBeLessThan(0.0002)
  })

  it('approaches 0 at z = +/-6', () => {
    expect(standardNormalPDF(6)).toBeLessThan(1e-8)
    expect(standardNormalPDF(-6)).toBeLessThan(1e-8)
  })

  it('returns known values at z=1 and z=2', () => {
    // f(1) = (1/sqrt(2pi)) * e^(-0.5) ~ 0.24197
    expect(standardNormalPDF(1)).toBeCloseTo(0.24197, 4)
    // f(2) = (1/sqrt(2pi)) * e^(-2) ~ 0.05399
    expect(standardNormalPDF(2)).toBeCloseTo(0.05399, 4)
  })

  it('is always non-negative', () => {
    const testValues = [-10, -3, -1, 0, 1, 3, 10]
    for (const z of testValues) {
      expect(standardNormalPDF(z)).toBeGreaterThanOrEqual(0)
    }
  })

  it('decreases monotonically for z > 0', () => {
    let previous = standardNormalPDF(0)
    for (let z = 0.5; z <= 5; z += 0.5) {
      const current = standardNormalPDF(z)
      expect(current).toBeLessThan(previous)
      previous = current
    }
  })
})

describe('normalPDF', () => {
  it('peaks at x = mean', () => {
    const mean = 10
    const sigma = 2
    const peak = normalPDF(mean, mean, sigma)

    // Should be the maximum: slightly off-center should yield a smaller value
    expect(normalPDF(mean - 0.1, mean, sigma)).toBeLessThan(peak)
    expect(normalPDF(mean + 0.1, mean, sigma)).toBeLessThan(peak)
  })

  it('peak value equals 1/(sigma * sqrt(2pi))', () => {
    const sigma = 2
    const expectedPeak = 1 / (sigma * Math.sqrt(2 * Math.PI))
    expect(normalPDF(10, 10, sigma)).toBeCloseTo(expectedPeak, 10)
  })

  it('shifts correctly with different means', () => {
    const sigma = 3
    // PDF(mean, mean, sigma) should be the same regardless of mean
    expect(normalPDF(0, 0, sigma)).toBeCloseTo(normalPDF(100, 100, sigma), 10)
    expect(normalPDF(50, 50, sigma)).toBeCloseTo(normalPDF(-50, -50, sigma), 10)
  })

  it('scales inversely with sigma', () => {
    // Wider distribution has a lower peak
    const peakNarrow = normalPDF(0, 0, 1)
    const peakWide = normalPDF(0, 0, 5)
    expect(peakNarrow).toBeGreaterThan(peakWide)
    expect(peakNarrow / peakWide).toBeCloseTo(5, 10) // ratio equals sigma ratio
  })

  it('relates to standardNormalPDF: normalPDF(x, mean, sigma) = standardNormalPDF(z)/sigma', () => {
    const mean = 7
    const sigma = 3
    const x = 10
    const z = (x - mean) / sigma
    expect(normalPDF(x, mean, sigma)).toBeCloseTo(standardNormalPDF(z) / sigma, 10)
  })

  describe('sigma <= 0 edge cases', () => {
    it('returns Infinity when x equals mean and sigma = 0', () => {
      expect(normalPDF(5, 5, 0)).toBe(Infinity)
    })

    it('returns 0 when x does not equal mean and sigma = 0', () => {
      expect(normalPDF(5.001, 5, 0)).toBe(0)
      expect(normalPDF(4.999, 5, 0)).toBe(0)
    })

    it('returns Infinity when x equals mean and sigma is negative', () => {
      expect(normalPDF(5, 5, -1)).toBe(Infinity)
    })

    it('returns 0 when x does not equal mean and sigma is negative', () => {
      expect(normalPDF(6, 5, -1)).toBe(0)
      expect(normalPDF(4, 5, -2)).toBe(0)
    })
  })
})

describe('standardNormalCDF', () => {
  it('returns 0.5 at z=0', () => {
    expect(standardNormalCDF(0)).toBeCloseTo(0.5, 8)
  })

  it('returns exactly 0 for z < -8', () => {
    expect(standardNormalCDF(-8.001)).toBe(0)
    expect(standardNormalCDF(-10)).toBe(0)
    expect(standardNormalCDF(-100)).toBe(0)
  })

  it('returns exactly 1 for z > 8', () => {
    expect(standardNormalCDF(8.001)).toBe(1)
    expect(standardNormalCDF(10)).toBe(1)
    expect(standardNormalCDF(100)).toBe(1)
  })

  it('returns known value CDF(-1) ~ 0.15866', () => {
    expect(standardNormalCDF(-1)).toBeCloseTo(0.15866, 4)
  })

  it('returns known value CDF(1) ~ 0.84134', () => {
    expect(standardNormalCDF(1)).toBeCloseTo(0.84134, 4)
  })

  it('returns known value CDF(2) ~ 0.97725', () => {
    expect(standardNormalCDF(2)).toBeCloseTo(0.97725, 4)
  })

  it('returns known value CDF(-2) ~ 0.02275', () => {
    expect(standardNormalCDF(-2)).toBeCloseTo(0.02275, 4)
  })

  it('returns known value CDF(3) ~ 0.99865', () => {
    expect(standardNormalCDF(3)).toBeCloseTo(0.99865, 4)
  })

  it('CDF(-z) + CDF(z) = 1 (symmetry property)', () => {
    const testValues = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7]
    for (const z of testValues) {
      expect(standardNormalCDF(-z) + standardNormalCDF(z)).toBeCloseTo(1, 7)
    }
  })

  it('is monotonically increasing', () => {
    let previous = standardNormalCDF(-8)
    for (let z = -7; z <= 8; z += 0.5) {
      const current = standardNormalCDF(z)
      expect(current).toBeGreaterThanOrEqual(previous)
      previous = current
    }
  })

  it('accuracy is within documented |error| < 7.5e-8 against known values', () => {
    // High-precision reference values from standard normal CDF tables
    const knownValues: Array<[number, number]> = [
      [0, 0.5],
      [1, 0.8413447460685429],
      [-1, 0.15865525393145707],
      [2, 0.9772498680518208],
      [-2, 0.022750131948179195],
      [3, 0.9986501019683699],
      [0.5, 0.6914624612740131],
      [-0.5, 0.3085375387259869],
      [1.96, 0.9750021048517796],
      [2.576, 0.9950024967498789],
    ]

    for (const [z, expected] of knownValues) {
      expect(Math.abs(standardNormalCDF(z) - expected)).toBeLessThan(7.5e-8)
    }
  })

  it('handles boundary values at z = -8 and z = 8', () => {
    // z = -8 is not less than -8, so it goes through the approximation
    // but should still be extremely close to 0
    expect(standardNormalCDF(-8)).toBeCloseTo(0, 14)
    // z = 8 is not greater than 8, so it goes through the approximation
    // but should still be extremely close to 1
    expect(standardNormalCDF(8)).toBeCloseTo(1, 14)
  })
})

describe('normalCDF', () => {
  it('returns 0.5 at x = mean', () => {
    expect(normalCDF(10, 10, 3)).toBeCloseTo(0.5, 8)
    expect(normalCDF(0, 0, 1)).toBeCloseTo(0.5, 8)
    expect(normalCDF(-5, -5, 2)).toBeCloseTo(0.5, 8)
  })

  it('transforms correctly: normalCDF(x, mean, sigma) = standardNormalCDF((x-mean)/sigma)', () => {
    const mean = 50
    const sigma = 10
    const testPoints = [30, 40, 50, 60, 70]
    for (const x of testPoints) {
      const expected = standardNormalCDF((x - mean) / sigma)
      expect(normalCDF(x, mean, sigma)).toBeCloseTo(expected, 10)
    }
  })

  it('approaches 0 for x far below mean', () => {
    expect(normalCDF(-100, 0, 1)).toBe(0) // z < -8 triggers exact 0
  })

  it('approaches 1 for x far above mean', () => {
    expect(normalCDF(100, 0, 1)).toBe(1) // z > 8 triggers exact 1
  })

  describe('sigma <= 0 edge cases', () => {
    it('returns 1 when x >= mean and sigma = 0', () => {
      expect(normalCDF(5, 5, 0)).toBe(1)
      expect(normalCDF(6, 5, 0)).toBe(1)
    })

    it('returns 0 when x < mean and sigma = 0', () => {
      expect(normalCDF(4.999, 5, 0)).toBe(0)
    })

    it('returns 1 when x >= mean and sigma is negative', () => {
      expect(normalCDF(5, 5, -1)).toBe(1)
      expect(normalCDF(10, 5, -3)).toBe(1)
    })

    it('returns 0 when x < mean and sigma is negative', () => {
      expect(normalCDF(4, 5, -1)).toBe(0)
      expect(normalCDF(0, 5, -3)).toBe(0)
    })
  })
})

describe('generateGaussianCurvePoints', () => {
  it('returns default 120 points', () => {
    const points = generateGaussianCurvePoints(0, 1)
    expect(points).toHaveLength(120)
  })

  it('returns custom number of points', () => {
    const points = generateGaussianCurvePoints(0, 1, 50)
    expect(points).toHaveLength(50)
  })

  it('x range spans mean +/- numSigma * sigma with default numSigma=3.5', () => {
    const mean = 10
    const sigma = 2
    const points = generateGaussianCurvePoints(mean, sigma)

    const xMin = points[0].x
    const xMax = points[points.length - 1].x

    expect(xMin).toBeCloseTo(mean - 3.5 * sigma, 10)
    expect(xMax).toBeCloseTo(mean + 3.5 * sigma, 10)
  })

  it('x range spans mean +/- custom numSigma * sigma', () => {
    const mean = 5
    const sigma = 3
    const numSigma = 4
    const points = generateGaussianCurvePoints(mean, sigma, 120, numSigma)

    const xMin = points[0].x
    const xMax = points[points.length - 1].x

    expect(xMin).toBeCloseTo(mean - numSigma * sigma, 10)
    expect(xMax).toBeCloseTo(mean + numSigma * sigma, 10)
  })

  it('returns empty array when sigma = 0', () => {
    expect(generateGaussianCurvePoints(0, 0)).toEqual([])
  })

  it('returns empty array when sigma is negative', () => {
    expect(generateGaussianCurvePoints(0, -1)).toEqual([])
    expect(generateGaussianCurvePoints(10, -5)).toEqual([])
  })

  it('peak y value occurs at the center point closest to the mean', () => {
    const mean = 10
    const sigma = 2
    const points = generateGaussianCurvePoints(mean, sigma)

    // Find the point with the maximum y value
    const maxPoint = points.reduce((max, p) => (p.y > max.y ? p : max), points[0])

    // The peak should be near the mean (within one step of the grid)
    const step = (3.5 * sigma * 2) / (120 - 1)
    expect(Math.abs(maxPoint.x - mean)).toBeLessThanOrEqual(step)

    // The peak y value should match normalPDF at that point
    expect(maxPoint.y).toBeCloseTo(normalPDF(maxPoint.x, mean, sigma), 10)
  })

  it('y values are symmetric around the mean', () => {
    const mean = 0
    const sigma = 1
    const numPoints = 121 // Odd number so there is a center point exactly at mean
    const points = generateGaussianCurvePoints(mean, sigma, numPoints)

    // Compare first and last, second and second-to-last, etc.
    for (let i = 0; i < Math.floor(numPoints / 2); i++) {
      expect(points[i].y).toBeCloseTo(points[numPoints - 1 - i].y, 10)
    }
  })

  it('x values are evenly spaced', () => {
    const points = generateGaussianCurvePoints(0, 1, 10)
    const step = points[1].x - points[0].x
    for (let i = 2; i < points.length; i++) {
      expect(points[i].x - points[i - 1].x).toBeCloseTo(step, 10)
    }
  })

  it('all y values are non-negative', () => {
    const points = generateGaussianCurvePoints(50, 10, 200)
    for (const p of points) {
      expect(p.y).toBeGreaterThanOrEqual(0)
    }
  })

  it('works with large mean and sigma values', () => {
    const mean = 1000
    const sigma = 200
    const points = generateGaussianCurvePoints(mean, sigma)

    expect(points).toHaveLength(120)
    expect(points[0].x).toBeCloseTo(mean - 3.5 * sigma, 5)

    const maxPoint = points.reduce((max, p) => (p.y > max.y ? p : max), points[0])
    const step = (3.5 * sigma * 2) / (120 - 1)
    expect(Math.abs(maxPoint.x - mean)).toBeLessThanOrEqual(step)
  })
})
