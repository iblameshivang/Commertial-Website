/* ============================================
   ShopVerse Luxury Color System & AI Color Engine
   ============================================ */

export const LUXURY_COLOR_PRESETS = [
  { name: 'Deep Spruce', hex: '#355E58', category: 'neutral' },
  { name: 'Midnight Peacock', hex: '#053229', category: 'dark' },
  { name: 'Alpine Teal', hex: '#72B0AB', category: 'accent' },
  { name: 'Frosted Arctic', hex: '#BCDDDC', category: 'light' },
  { name: 'Warm Ivory', hex: '#FFEDD1', category: 'light' },
  { name: 'Blush Peach', hex: '#FDC1B4', category: 'accent' },
  { name: 'Desert Terracotta', hex: '#FE9179', category: 'warm' },
  { name: 'Antique Sage', hex: '#CFB97E', category: 'gold' },
  { name: 'Heritage Pistachio', hex: '#B89D47', category: 'gold' },
  { name: 'Obsidian Black', hex: '#1A1A1A', category: 'dark' },
  { name: 'Pure Chalk', hex: '#FFFFFF', category: 'light' },
  { name: 'Midnight Navy', hex: '#2C3E50', category: 'dark' },
  { name: 'Cognac Leather', hex: '#8B5A2B', category: 'warm' },
  { name: 'Smoked Walnut', hex: '#6B4423', category: 'warm' },
  { name: 'Oatmeal Linen', hex: '#E6D7C3', category: 'light' },
  { name: 'Mineral Slate', hex: '#7F8C8D', category: 'neutral' },
  { name: 'Olive Drab', hex: '#556B2F', category: 'neutral' },
  { name: 'Vintage Burgundy', hex: '#800020', category: 'warm' },
  { name: 'Brushed Gold', hex: '#D4AF37', category: 'gold' },
  { name: 'Sterling Silver', hex: '#C0C0C0', category: 'neutral' },
];

const HEX_TO_NAME_MAP = {};
const NAME_TO_HEX_MAP = {};

LUXURY_COLOR_PRESETS.forEach(item => {
  HEX_TO_NAME_MAP[item.hex.toUpperCase()] = item.name;
  NAME_TO_HEX_MAP[item.name.toLowerCase()] = item.hex;
});

// Helper to convert hex to RGB
function hexToRgb(hex) {
  let cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Find closest luxury color name based on RGB Euclidean distance
function findClosestColor(hex) {
  const targetRgb = hexToRgb(hex);
  if (!targetRgb) return 'Custom Shade';

  let minDistance = Infinity;
  let closestName = 'Custom Shade';

  for (const preset of LUXURY_COLOR_PRESETS) {
    const presetRgb = hexToRgb(preset.hex);
    if (!presetRgb) continue;

    // Euclidean distance in RGB color space
    const d = Math.sqrt(
      Math.pow(targetRgb.r - presetRgb.r, 2) +
      Math.pow(targetRgb.g - presetRgb.g, 2) +
      Math.pow(targetRgb.b - presetRgb.b, 2)
    );

    if (d < minDistance) {
      minDistance = d;
      closestName = preset.name;
    }
  }

  return closestName;
}

/**
 * Parses any color input (hex string, color name, or object)
 * into a standardized { name, hex } object.
 */
export function normalizeColor(colorInput) {
  if (!colorInput) return { name: 'Natural', hex: '#FFEDD1' };

  if (typeof colorInput === 'object' && colorInput !== null) {
    const hex = colorInput.hex || '#355E58';
    const name = colorInput.name || HEX_TO_NAME_MAP[hex.toUpperCase()] || findClosestColor(hex);
    return { name, hex };
  }

  if (typeof colorInput === 'string') {
    const trimmed = colorInput.trim();

    // Check if it's a hex code
    if (trimmed.startsWith('#')) {
      const upperHex = trimmed.toUpperCase();
      const exactName = HEX_TO_NAME_MAP[upperHex];
      return {
        name: exactName || findClosestColor(trimmed),
        hex: trimmed,
      };
    }

    // Check if it's a known name
    const lowerName = trimmed.toLowerCase();
    if (NAME_TO_HEX_MAP[lowerName]) {
      return {
        name: trimmed,
        hex: NAME_TO_HEX_MAP[lowerName],
      };
    }

    // Fallback: Check if partial match in presets
    const found = LUXURY_COLOR_PRESETS.find(p => p.name.toLowerCase().includes(lowerName));
    if (found) {
      return { name: found.name, hex: found.hex };
    }

    return {
      name: trimmed,
      hex: '#355E58',
    };
  }

  return { name: 'Natural', hex: '#FFEDD1' };
}

/**
 * Returns clean human-readable name (NEVER displays raw hex like #355E58)
 */
export function getColorDisplayName(colorInput) {
  const norm = normalizeColor(colorInput);
  return norm.name;
}

/**
 * Returns valid CSS color string for rendering swatches
 */
export function getColorHexValue(colorInput) {
  const norm = normalizeColor(colorInput);
  return norm.hex;
}

/**
 * AI Color Suggester Engine:
 * Analyzes product context to predict the most harmonious luxury palette.
 */
export function suggestAiColors({ name = '', description = '', category = '', image_url = '' }) {
  const text = `${name} ${description} ${category} ${image_url}`.toLowerCase();
  const suggestions = [];

  // Keywords to preset mapping
  if (text.includes('black') || text.includes('dark') || text.includes('noir') || text.includes('leather') || text.includes('studio') || text.includes('speaker') || text.includes('monitor')) {
    suggestions.push({ name: 'Obsidian Black', hex: '#1A1A1A' });
  }

  if (text.includes('wool') || text.includes('coat') || text.includes('jacket') || text.includes('overshirt') || text.includes('forest') || text.includes('green') || text.includes('emerald') || text.includes('spruce')) {
    suggestions.push({ name: 'Deep Spruce', hex: '#355E58' });
  }

  if (text.includes('teal') || text.includes('acoustic') || text.includes('sound') || text.includes('blue') || text.includes('cyan') || text.includes('denim')) {
    suggestions.push({ name: 'Alpine Teal', hex: '#72B0AB' });
    suggestions.push({ name: 'Midnight Navy', hex: '#2C3E50' });
  }

  if (text.includes('linen') || text.includes('cotton') || text.includes('white') || text.includes('ivory') || text.includes('dress') || text.includes('summer') || text.includes('silk') || text.includes('ceramic') || text.includes('pottery')) {
    suggestions.push({ name: 'Warm Ivory', hex: '#FFEDD1' });
    suggestions.push({ name: 'Oatmeal Linen', hex: '#E6D7C3' });
  }

  if (text.includes('walnut') || text.includes('wood') || text.includes('table') || text.includes('bookshelf') || text.includes('chair') || text.includes('furniture') || text.includes('leather')) {
    suggestions.push({ name: 'Smoked Walnut', hex: '#6B4423' });
    suggestions.push({ name: 'Cognac Leather', hex: '#8B5A2B' });
  }

  if (text.includes('gold') || text.includes('brass') || text.includes('lamp') || text.includes('pendant') || text.includes('light') || text.includes('vintage')) {
    suggestions.push({ name: 'Brushed Gold', hex: '#D4AF37' });
    suggestions.push({ name: 'Antique Sage', hex: '#CFB97E' });
  }

  if (text.includes('terracotta') || text.includes('clay') || text.includes('blush') || text.includes('pink') || text.includes('rose') || text.includes('coral') || text.includes('skincare') || text.includes('oil')) {
    suggestions.push({ name: 'Desert Terracotta', hex: '#FE9179' });
    suggestions.push({ name: 'Blush Peach', hex: '#FDC1B4' });
  }

  if (text.includes('sage') || text.includes('botanical') || text.includes('herbal') || text.includes('serum') || text.includes('grooming')) {
    suggestions.push({ name: 'Antique Sage', hex: '#CFB97E' });
    suggestions.push({ name: 'Frosted Arctic', hex: '#BCDDDC' });
  }

  // Fallbacks if not enough matches
  if (suggestions.length === 0) {
    if (category === 'clothing') {
      suggestions.push({ name: 'Deep Spruce', hex: '#355E58' }, { name: 'Warm Ivory', hex: '#FFEDD1' }, { name: 'Obsidian Black', hex: '#1A1A1A' });
    } else if (category === 'electronics') {
      suggestions.push({ name: 'Obsidian Black', hex: '#1A1A1A' }, { name: 'Alpine Teal', hex: '#72B0AB' }, { name: 'Frosted Arctic', hex: '#BCDDDC' });
    } else if (category === 'home') {
      suggestions.push({ name: 'Smoked Walnut', hex: '#6B4423' }, { name: 'Warm Ivory', hex: '#FFEDD1' }, { name: 'Desert Terracotta', hex: '#FE9179' });
    } else {
      suggestions.push({ name: 'Antique Sage', hex: '#CFB97E' }, { name: 'Warm Ivory', hex: '#FFEDD1' }, { name: 'Blush Peach', hex: '#FDC1B4' });
    }
  }

  // Deduplicate
  const uniqueMap = new Map();
  suggestions.forEach(s => uniqueMap.set(s.name, s));
  return Array.from(uniqueMap.values()).slice(0, 4);
}
