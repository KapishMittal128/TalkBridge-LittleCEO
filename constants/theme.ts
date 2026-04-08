import { TextStyle, ViewStyle, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;

export const Colors = {
  background: '#F5F7FB',
  backgroundSecondary: '#FBFCFF',
  surface: '#FFFFFF',
  surfacePressed: '#EEF2FF',
  overlayTint: 'rgba(15,23,42,0.03)',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  surfaceGlassSoft: 'rgba(255, 255, 255, 0.65)',
  surfaceGlassStrong: 'rgba(255, 255, 255, 0.95)',
  surfaceMuted: '#F8FAFC',
  surfaceTintBlue: '#F2F7FF',
  surfaceTintViolet: '#F6F1FF',
  surfaceTintMint: '#EFFBF6',
  surfaceTintCoral: '#FFF4F1',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textSupport: '#64748B',
  textTertiary: '#94A3B8',
  textMuted: '#C3CEDD',
  textDisabled: '#D7DEE9',
  textInverse: '#FFFFFF',

  primary: '#2563EB',
  secondary: '#7C3AED',
  accent: '#10B981',
  warmth: '#F59E0B',
  warning: '#F59E0B',

  success: '#10B981',
  emergency: '#EF4444',
  info: '#2563EB',

  glassBorder: 'rgba(15,23,42,0.06)',
  glassBorderSubtle: 'rgba(15,23,42,0.03)',
  strokeStrong: '#DCE5F0',
  strokeMuted: '#E9EEF5',

  glowPrimary: 'rgba(37,99,235,0.18)',
  glowViolet: 'rgba(124,58,237,0.15)',
  glowMint: 'rgba(16,185,129,0.14)',
  glowWarm: 'rgba(239,68,68,0.14)',
  glowAmber: 'rgba(245,158,11,0.14)',

  statusPositiveBg: '#ECFDF5',
  statusWarningBg: '#FFFBEB',
  statusDangerBg: '#FEF2F2',
  statusInfoBg: '#EFF6FF',
  statusDraftBg: '#F5F3FF',

  statusReady: '#10B981',
  statusEmergency: '#EF4444',
  statusTrain: '#2563EB',
  statusDraft: '#7C3AED',

  surfaceElevated: '#FFFFFF',
  surfaceHighlight: 'rgba(0,0,0,0.01)',
  glass: 'rgba(255, 255, 255, 0.8)',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const Gradients = {
  aurora: ['#F8F9FB', '#F8F9FB'], // Solid for light mode per screenshot
  speakCore: ['#FFFFFF', '#F8F9FB'],
  recognitionSuccess: ['#ECFDF5', '#FFFFFF'],
  recognitionWarning: ['#FEF2F2', '#FFFFFF'],
  categoryNeeds: ['#EFF6FF', '#FFFFFF'],
  categoryFeelings: ['#F5F3FF', '#FFFFFF'],
  categoryActions: ['#ECFDF5', '#FFFFFF'],
  categoryEmergency: ['#FEF2F2', '#FFFFFF'],
} as const;

export const FontSize = {
  micro: 11,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 34,
  '5xl': 36,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Typography = {
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.9,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: -0.55,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.35,
  } satisfies TextStyle,
  supportText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: FontWeight.regular,
    color: Colors.textSupport,
  } satisfies TextStyle,
  microLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  } satisfies TextStyle,
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  } satisfies TextStyle,
  statNumber: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.6,
  } satisfies TextStyle,
} as const;

export const Ui = {
  overline: Typography.microLabel,
  display: Typography.heroTitle,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  xxl: 32, // Alias for backward compatibility or ease of use
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  xs: 12,
  sm: 16,
  md: 22,
  lg: 26,
  card: 32,
  panel: 36,
  drawer: 40,
  pill: 999,
} as const;

export const Shadow = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  } satisfies ViewStyle,
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  } satisfies ViewStyle,
  cyanGlow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
  mintGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
  coralGlow: {
    shadowColor: Colors.warmth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
  luxe: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  } satisfies ViewStyle,
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  } satisfies ViewStyle,
} as const;

export const Duration = {
  fast: 140,
  normal: 240,
  slow: 380,
  ambient: 1200,
} as const;

export const Motion = {
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 1 },
    snappy: { damping: 16, stiffness: 220, mass: 0.9 },
    bouncy: { damping: 12, stiffness: 260, mass: 0.85 },
    lazy: { damping: 30, stiffness: 70, mass: 1.3 },
    settle: { damping: 18, stiffness: 170, mass: 1 },
  },
  choreography: {
    stagger: 60,
    microStagger: 35,
    pageLift: 15,
    pressInScale: 0.98,
    pressDeepScale: 0.96,
  },
} as const;

export const TouchTarget = {
  minimum: 44,
  comfortable: 56,
  large: 64,
} as const;

export const Layout = {
  screenPadding: 24,
  compactScreenPadding: 20,
  bottomNavClearance: 140,
  isSmallDevice,
} as const;

export const GlowByTone = {
  cyan: Colors.glowPrimary,
  violet: Colors.glowViolet,
  mint: Colors.glowMint,
  coral: Colors.glowWarm,
  amber: Colors.glowAmber,
} as const;
