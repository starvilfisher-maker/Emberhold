// Compare the requested markup, not the browser's normalized innerHTML.
export function createMarkupWriter() {
  const cache = new WeakMap();
  return (element, markup) => {
    if (cache.get(element) === markup) return false;
    element.innerHTML = markup;
    cache.set(element, markup);
    return true;
  };
}

// A drag is only committed on the matching pointer's release, never on move.
export class DragGesture {
  constructor(threshold = 8) { this.threshold = threshold; this.current = null; }
  begin(pointerId, x, y, unitId, source) {
    if (this.current) return false;
    this.current = {pointerId, x, y, unitId, source, dragging: false};
    return true;
  }
  move(pointerId, x, y) {
    const current = this.current;
    if (!current || current.pointerId !== pointerId) return null;
    if (Math.hypot(x - current.x, y - current.y) >= this.threshold) current.dragging = true;
    return current;
  }
  end(pointerId, x, y) {
    const current = this.move(pointerId, x, y);
    if (current) this.current = null;
    return current;
  }
  cancel() { const current = this.current; this.current = null; return current; }
}
