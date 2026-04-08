/**
 * TalkBridge Design Token System
 *
 * Source of truth: prompts/# DESIGN_SYSTEM.md
 *
 * These tokens must be used everywhere in the app.
 * No random hardcoded hex values in component files.
 */

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------
/**
 * TalkBridge "Luminous Soul" Design Token System
 *
 * Source of truth: Luminous Soul Redesign Plan
 */

export const Colors = {
  // Brand — Luminous Core
  primary: '#00F2FF',      // Electric Cyan
  secondary: '#B794F4',    // Soft Lavender
  accent: '#38E2B1',       // Fresh Mint
  warmth: '#FF7E67',       // Warm Coral
  
  // Background Architecture
  background: '#08090C',   // Deep Luxe Base
  surface: '#12141C',      // Material Surface
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#4A5568',
  textInverse: '#08090C',

  // Status (Emotional Mapping)
  emergency: '#FF5A5F',
  success: '#38E2B1',
  warning: '#FBD38D',
  info: '#00F2FF',

  // Overlays & Glows
  glowPrimary: 'rgba(0, 242, 255, 0.15)',
  glowWarm: 'rgba(255, 126, 103, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  /** Raised surfaces (cards on glass) */
  surfaceElevated: '#1A1D28',
  surfaceHighlight: 'rgba(255, 255, 255, 0.06)',
  strokeStrong: 'rgba(255, 255, 255, 0.2)',
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Typography helpers — use with Text */
export const Ui = {
  overline: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  display: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -1.2,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  card: 28,
  panel: 32,
  pill: 999,
} as const;

export const Shadow = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  luxe: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  }
} as const;

export const Duration = {
  fast: 150,
  normal: 300,
  slow: 500,
  cinematic: 800,
} as const;

export const TouchTarget = {
  minimum: 44,
  comfortable: 56,
  large: 64,
} as const;

export const Motion = {
  spring: {
    gentle: { damping: 20, stiffness: 40, mass: 1 },
    snappy: { damping: 15, stiffness: 200, mass: 0.5 },
    bouncy: { damping: 8, stiffness: 100, mass: 1 },
    lazy: { damping: 40, stiffness: 20, mass: 2 },
  },
  choreography: {
    stagger: 80,
    entrance: 400,
    settle: 600,
  }
} as const;

