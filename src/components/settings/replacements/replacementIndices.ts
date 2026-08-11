export function getIndexAfterDeletion(
  currentIndex: number,
  deletedIndex: number,
): number | null {
  if (currentIndex === deletedIndex) {
    return null;
  }
  return currentIndex > deletedIndex ? currentIndex - 1 : currentIndex;
}

export function getIndexAfterInsertion(
  currentIndex: number,
  insertedIndex: number,
): number {
  return currentIndex >= insertedIndex ? currentIndex + 1 : currentIndex;
}

export function getIndexAfterMove(
  currentIndex: number,
  sourceIndex: number,
  targetIndex: number,
): number {
  if (currentIndex === sourceIndex) {
    return targetIndex;
  }
  if (sourceIndex < targetIndex && currentIndex > sourceIndex) {
    return currentIndex <= targetIndex ? currentIndex - 1 : currentIndex;
  }
  if (sourceIndex > targetIndex && currentIndex < sourceIndex) {
    return currentIndex >= targetIndex ? currentIndex + 1 : currentIndex;
  }
  return currentIndex;
}

export function mapReplacementIndices(
  indices: ReadonlySet<number>,
  mapIndex: (index: number) => number | null,
): Set<number> {
  const mappedIndices = new Set<number>();
  indices.forEach((index) => {
    const mappedIndex = mapIndex(index);
    if (mappedIndex !== null) {
      mappedIndices.add(mappedIndex);
    }
  });
  return mappedIndices;
}
