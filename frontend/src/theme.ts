export const colors = {
  surface: '#F9F9F7',
  onSurface: '#1A211C',
  surfaceSecondary: '#FFFFFF',
  onSurfaceSecondary: '#334037',
  surfaceTertiary: '#F2F2ED',
  onSurfaceTertiary: '#4D5E53',
  surfaceInverse: '#1A211C',
  onSurfaceInverse: '#FFFFFF',
  brand: '#2A7036',
  brandPrimary: '#2A7036',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#855E42',
  onBrandSecondary: '#FFFFFF',
  brandTertiary: '#EBF2EC',
  onBrandTertiary: '#2A7036',
  success: '#2A7036',
  warning: '#F0A31D',
  error: '#D9423E',
  info: '#428761',
  border: '#E6E6E1',
  borderStrong: '#CCCCCC',
  divider: '#E6E6E1',
  muted: '#8A9A8F',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const font = {
  size: { xs: 11, sm: 12, base: 14, lg: 16, xl: 20, xxl: 24, xxxl: 30 },
  weight: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const TAGS = [
  { id: 'all', label: 'All', emoji: '🌏' },
  { id: 'tips', label: 'Organic Tips', emoji: '💡' },
  { id: 'procedure', label: 'How-To Videos', emoji: '🎬' },
  { id: 'waste', label: 'Waste Management', emoji: '♻️' },
  { id: 'cleanliness', label: 'Cleanliness', emoji: '🧹' },
  { id: 'story', label: 'Success Stories', emoji: '🌾' },
  { id: 'question', label: 'Questions', emoji: '❓' },
  { id: 'general', label: 'General', emoji: '🌱' },
];

export function tagLabel(id: string): string {
  const t = TAGS.find((t) => t.id === id);
  return t ? t.label : id;
}
