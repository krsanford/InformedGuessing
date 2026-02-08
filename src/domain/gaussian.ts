/**
 * Pure Gaussian (normal distribution) math functions for visualizations.
 * No React dependency — used by domain/visualization.ts and DistributionCurve.
 */

const SQRT_2PI = Math.sqrt(2 * Math.PI)

/** Standard normal PDF: φ(z) = (1/√2π) × e^(-z²/2) */
export function standardNormalPDF(z: number): number {
  return Math.exp(-0.5 * z * z) / SQRT_2PI
}

/** Normal PDF with given mean and sigma */
export function normalPDF(x: number, mean: number, sigma: number): number {
  if (sigma <= 0) return x === mean ? Infinity : 0
  return standardNormalPDF((x - mean) / sigma) / sigma
}

/**
 * Approximate standard normal CDF using Abramowitz & Stegun 26.2.17
 * |error| < 7.5e-8
 */
export function standardNormalCDF(z: number): number {
  if (z < -8) return 0
  if (z > 8) return 1

  const negative = z < 0
  const absZ = Math.abs(z)

  const p = 0.2316419
  const b1 = 0.319381530
  const b2 = -0.356563782
  const b3 = 1.781477937
  const b4 = -1.821255978
  const b5 = 1.330274429

  const t = 1.0 / (1.0 + p * absZ)
  const t2 = t * t
  const t3 = t2 * t
  const t4 = t3 * t
  const t5 = t4 * t

  const pdf = standardNormalPDF(absZ)
  const cdf = 1.0 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5)

  return negative ? 1.0 - cdf : cdf
}

/** Normal CDF with given mean and sigma */
export function normalCDF(x: number, mean: number, sigma: number): number {
  if (sigma <= 0) return x >= mean ? 1 : 0
  return standardNormalCDF((x - mean) / sigma)
}

/**
 * Generate {x, y} points along a Gaussian curve for SVG path rendering.
 * Spans from mean - numSigma*sigma to mean + numSigma*sigma.
 */
export function generateGaussianCurvePoints(
  mean: number,
  sigma: number,
  numPoints = 120,
  numSigma = 3.5
): Array<{ x: number; y: number }> {
  if (sigma <= 0) return []

  const xMin = mean - numSigma * sigma
  const xMax = mean + numSigma * sigma
  const step = (xMax - xMin) / (numPoints - 1)

  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step
    const y = normalPDF(x, mean, sigma)
    points.push({ x, y })
  }
  return points
}
