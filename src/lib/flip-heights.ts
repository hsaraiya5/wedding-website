// Shared sizing for the event and hotel flip cards. Each card measures its
// front and back content plus its row (its offsetTop: cards side by side in
// the grid share one). Cards in the same row and the same state match, so two
// open cards compare at equal length and two closed ones line up, while a
// closed card beside an open one stays compact.
export type FlipMeasure = { front: number; back: number; top: number };

export function rowMatchedHeight(
  id: string,
  ids: string[],
  heights: Record<string, FlipMeasure>,
  openIds: Set<string>
): number | undefined {
  const own = heights[id];
  // Before the first measurement (server render) there's no height at all and
  // the front sizes the card.
  if (!own) return undefined;
  const isOpen = openIds.has(id);
  let height = 0;
  for (const other of ids) {
    const measured = heights[other];
    if (!measured || measured.top !== own.top || openIds.has(other) !== isOpen) continue;
    // Never shrink on open: a back shorter than its front keeps the front's height.
    height = Math.max(height, isOpen ? Math.max(measured.front, measured.back) : measured.front);
  }
  return height;
}
