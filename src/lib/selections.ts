// Turns a stored product selection (cart item or order item) into readable
// label/value pairs, hiding the internal fields used for pricing.

const LABELS: Record<string, string> = {
  metalType: 'Metal',
  size: 'Size',
  gemstoneQuality: 'Gemstone quality',
  caratWeight: 'Carat weight',
  attributes: 'Options',
  addOns: 'Add-ons',
  engraving: 'Engraving',
};

const HIDDEN = new Set(['metalTypeSlug']);

function formatValue(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'text' in value) {
    const v = value as { text?: unknown; font?: unknown };
    return v.font ? `${String(v.text)} (${String(v.font)})` : String(v.text);
  }
  if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
  return String(value);
}

export function describeSelections(selected: unknown): { key: string; label: string; value: string }[] {
  if (!selected || typeof selected !== 'object') return [];
  return Object.entries(selected as Record<string, unknown>)
    .filter(([key, value]) => {
      if (key.startsWith('_') || HIDDEN.has(key)) return false;
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: LABELS[key] || key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'),
      value: formatValue(value),
    }));
}

export const LINE_ERROR_MESSAGES: Record<string, string> = {
  OPTION_UNAVAILABLE: 'An option you chose is no longer available. Please remove this item and add it again.',
  INCOMPLETE_SELECTION: 'Some options for this item are missing. Please remove it and add it again.',
};
