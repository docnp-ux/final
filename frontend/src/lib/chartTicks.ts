/** `count` indexes spread evenly across [0, lastIndex], for axis tick placement. */
export function evenlySpacedIndexes(lastIndex: number, count: number): number[] {
  if (count <= 1) return [0]
  const raw = Array.from({ length: count }, (_, i) => Math.round((i * lastIndex) / (count - 1)))
  return Array.from(new Set(raw))
}
