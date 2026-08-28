/* ============================================
   ShopVerse Server Color Assistant Engine
   ============================================ */

const LUXURY_COLOR_PRESETS = [
  { name: 'Deep Spruce', hex: '#355E58' },
  { name: 'Midnight Peacock', hex: '#053229' },
  { name: 'Alpine Teal', hex: '#72B0AB' },
  { name: 'Frosted Arctic', hex: '#BCDDDC' },
  { name: 'Warm Ivory', hex: '#FFEDD1' },
  { name: 'Blush Peach', hex: '#FDC1B4' },
  { name: 'Desert Terracotta', hex: '#FE9179' },
  { name: 'Antique Sage', hex: '#CFB97E' },
  { name: 'Heritage Pistachio', hex: '#B89D47' },
  { name: 'Obsidian Black', hex: '#1A1A1A' },
  { name: 'Pure Chalk', hex: '#FFFFFF' },
  { name: 'Midnight Navy', hex: '#2C3E50' },
  { name: 'Cognac Leather', hex: '#8B5A2B' },
  { name: 'Smoked Walnut', hex: '#6B4423' },
  { name: 'Oatmeal Linen', hex: '#E6D7C3' },
  { name: 'Mineral Slate', hex: '#7F8C8D' },
  { name: 'Olive Drab', hex: '#556B2F' },
  { name: 'Vintage Burgundy', hex: '#800020' },
  { name: 'Brushed Gold', hex: '#D4AF37' },
  { name: 'Sterling Silver', hex: '#C0C0C0' },
];

function suggestAiColors({ name = '', description = '', category = '', image_url = '' }) {
  const text = `${name} ${description} ${category} ${image_url}`.toLowerCase();
  const suggestions = [];

  if (text.includes('black') || text.includes('dark') || text.includes('noir') || text.includes('speaker') || text.includes('monitor') || text.includes('studio')) {
    suggestions.push({ name: 'Obsidian Black', hex: '#1A1A1A' });
  }

  if (text.includes('wool') || text.includes('coat') || text.includes('jacket') || text.includes('overshirt') || text.includes('forest') || text.includes('green') || text.includes('spruce')) {
    suggestions.push({ name: 'Deep Spruce', hex: '#355E58' });
  }

  if (text.includes('teal') || text.includes('acoustic') || text.includes('sound') || text.includes('blue') || text.includes('denim')) {
    suggestions.push({ name: 'Alpine Teal', hex: '#72B0AB' });
    suggestions.push({ name: 'Midnight Navy', hex: '#2C3E50' });
  }

  if (text.includes('linen') || text.includes('cotton') || text.includes('white') || text.includes('ivory') || text.includes('dress') || text.includes('silk') || text.includes('ceramic')) {
    suggestions.push({ name: 'Warm Ivory', hex: '#FFEDD1' });
    suggestions.push({ name: 'Oatmeal Linen', hex: '#E6D7C3' });
  }

  if (text.includes('walnut') || text.includes('wood') || text.includes('table') || text.includes('bookshelf') || text.includes('chair') || text.includes('leather')) {
    suggestions.push({ name: 'Smoked Walnut', hex: '#6B4423' });
    suggestions.push({ name: 'Cognac Leather', hex: '#8B5A2B' });
  }

  if (text.includes('gold') || text.includes('brass') || text.includes('lamp') || text.includes('pendant') || text.includes('vintage')) {
    suggestions.push({ name: 'Brushed Gold', hex: '#D4AF37' });
    suggestions.push({ name: 'Antique Sage', hex: '#CFB97E' });
  }

  if (text.includes('terracotta') || text.includes('clay') || text.includes('blush') || text.includes('pink') || text.includes('skincare')) {
    suggestions.push({ name: 'Desert Terracotta', hex: '#FE9179' });
    suggestions.push({ name: 'Blush Peach', hex: '#FDC1B4' });
  }

  if (text.includes('sage') || text.includes('botanical') || text.includes('grooming') || text.includes('serum')) {
    suggestions.push({ name: 'Antique Sage', hex: '#CFB97E' });
    suggestions.push({ name: 'Frosted Arctic', hex: '#BCDDDC' });
  }

  if (suggestions.length === 0) {
    if (category === 'clothing') {
      suggestions.push({ name: 'Deep Spruce', hex: '#355E58' }, { name: 'Warm Ivory', hex: '#FFEDD1' }, { name: 'Obsidian Black', hex: '#1A1A1A' });
    } else if (category === 'electronics') {
      suggestions.push({ name: 'Obsidian Black', hex: '#1A1A1A' }, { name: 'Alpine Teal', hex: '#72B0AB' });
    } else {
      suggestions.push({ name: 'Smoked Walnut', hex: '#6B4423' }, { name: 'Warm Ivory', hex: '#FFEDD1' });
    }
  }

  const uniqueMap = new Map();
  suggestions.forEach(s => uniqueMap.set(s.name, s));
  return Array.from(uniqueMap.values()).slice(0, 4);
}

module.exports = {
  LUXURY_COLOR_PRESETS,
  suggestAiColors,
};
