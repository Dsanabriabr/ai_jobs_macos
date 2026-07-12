export interface RunDiagnostics {
  rawHits: number;
  droppedDenied: number;
  droppedHeuristic: number;
  keptBeforeMerge: number;
  kept: number;
  followed: number;
  followLinksFound: number;
}

export function emptyDiagnostics(): RunDiagnostics {
  return {
    rawHits: 0,
    droppedDenied: 0,
    droppedHeuristic: 0,
    keptBeforeMerge: 0,
    kept: 0,
    followed: 0,
    followLinksFound: 0,
  };
}
