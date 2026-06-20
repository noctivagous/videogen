export interface ConnectorPoint {
  x: number;
  y: number;
}

export function centerInContainer(el: HTMLElement, container: HTMLElement): ConnectorPoint {
  const cr = container.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  return {
    x: er.left + er.width / 2 - cr.left,
    y: er.top + er.height / 2 - cr.top,
  };
}

export function pointInRect(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): boolean {
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

export function hitIndexedTargets(
  elements: (HTMLElement | null)[],
  clientX: number,
  clientY: number,
  options?: { requiredClass?: string },
): number | null {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el) continue;
    if (options?.requiredClass && !el.classList.contains(options.requiredClass)) continue;
    if (pointInRect(clientX, clientY, el.getBoundingClientRect())) return i;
  }
  return null;
}

export function hitKeyedTargets(
  elements: Record<string, HTMLElement | null>,
  clientX: number,
  clientY: number,
  filter?: (key: string) => boolean,
): string | null {
  for (const [key, el] of Object.entries(elements)) {
    if (!el) continue;
    if (filter && !filter(key)) continue;
    if (pointInRect(clientX, clientY, el.getBoundingClientRect())) return key;
  }
  return null;
}