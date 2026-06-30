/**
 * Single shared window z-index counter so that ALL windows — both the legacy
 * DraggableWindow components and the store-driven OSWindow components — compete
 * in the same stacking context. Clicking any window brings it above every other.
 */
let z = 100;

export function nextZIndex(): number {
  z += 1;
  return z;
}

export function currentZIndex(): number {
  return z;
}
