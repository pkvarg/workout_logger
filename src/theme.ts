export type Palette = {
  paper: string
  stage: string
  card: string
  ink: string
  muted: string
  line: string
  lineStrong: string
  accent: string
  accentInk: string
  accentSoft: string
  gold: string
  sage: string
  danger: string
  onAccent: string
}

export const dark: Palette = {
  paper: '#19131A',
  stage: '#0F0A10',
  card: '#241A26',
  ink: '#F4EAF0',
  muted: '#AC97A2',
  line: 'rgba(244,234,240,0.11)',
  lineStrong: 'rgba(244,234,240,0.20)',
  accent: '#F2588F',
  accentInk: '#F794B6',
  accentSoft: '#3A1F2C',
  gold: '#EBAE5B',
  sage: '#7FB68E',
  danger: '#F2869C',
  onAccent: '#FFFFFF',
}

export const light: Palette = {
  paper: '#FBF6F1',
  stage: '#F0E7E0',
  card: '#FFFDFB',
  ink: '#241B22',
  muted: '#8A7B82',
  line: 'rgba(36,27,34,0.09)',
  lineStrong: 'rgba(36,27,34,0.16)',
  accent: '#D1316B',
  accentInk: '#D1316B',
  accentSoft: '#FCE7EE',
  gold: '#D98A2B',
  sage: '#4F8A66',
  danger: '#C23B57',
  onAccent: '#FFFFFF',
}

export const font = {
  displayMedium: 'Fraunces_500Medium',
  displaySemi: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semi: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
}

export const radius = { sm: 12, md: 16, lg: 20, xl: 26, pill: 999 }
