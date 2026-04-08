import {
  AlertTriangle,
  Droplets,
  GlassWater,
  HandHelping,
  HeartPulse,
  MoonStar,
  MoveRight,
  ShieldAlert,
  Smile,
  Soup,
  Toilet,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors, Gradients } from './theme';

export type CategoryTone = 'needs' | 'feelings' | 'actions' | 'emergency';

export interface CategoryMeta {
  slug: string;
  title: string;
  description: string;
  tone: CategoryTone;
  icon: LucideIcon;
  color: string;
  glow: string;
  gradient: readonly string[];
}

export const CATEGORY_METADATA: Record<string, CategoryMeta> = {
  needs: {
    slug: 'needs',
    title: 'Needs',
    description: 'Daily essentials that should feel immediate and calm.',
    tone: 'needs',
    icon: Droplets,
    color: Colors.primary,
    glow: Colors.glowPrimary,
    gradient: Gradients.categoryNeeds,
  },
  feelings: {
    slug: 'feelings',
    title: 'Feelings',
    description: 'Emotional states expressed with softness and dignity.',
    tone: 'feelings',
    icon: Smile,
    color: Colors.secondary,
    glow: Colors.glowViolet,
    gradient: Gradients.categoryFeelings,
  },
  actions: {
    slug: 'actions',
    title: 'Actions',
    description: 'Helpful prompts, responses, and directional phrases.',
    tone: 'actions',
    icon: MoveRight,
    color: Colors.accent,
    glow: Colors.glowMint,
    gradient: Gradients.categoryActions,
  },
  emergency: {
    slug: 'emergency',
    title: 'Emergency',
    description: 'High-priority phrases for urgent support.',
    tone: 'emergency',
    icon: ShieldAlert,
    color: Colors.warmth,
    glow: Colors.glowWarm,
    gradient: Gradients.categoryEmergency,
  },
};

export const DEFAULT_CATEGORY_COLOR = Colors.primary;

export const STARTER_CATEGORIES = [
  { id: 'cat-needs', slug: 'needs', name: 'Needs', icon_name: 'Droplets', sort_order: 0 },
  { id: 'cat-feelings', slug: 'feelings', name: 'Feelings', icon_name: 'Smile', sort_order: 1 },
  { id: 'cat-actions', slug: 'actions', name: 'Actions', icon_name: 'MoveRight', sort_order: 2 },
  { id: 'cat-emergency', slug: 'emergency', name: 'Emergency', icon_name: 'ShieldAlert', sort_order: 3 },
] as const;

export const STARTER_SOUND_CARDS = [
  {
    id: 'card-water',
    categorySlug: 'needs',
    label: 'Water',
    phrase_output: 'I want water',
    icon_name: 'GlassWater',
    is_favorite: true,
    is_emergency: false,
  },
  {
    id: 'card-food',
    categorySlug: 'needs',
    label: 'Food',
    phrase_output: 'I want food',
    icon_name: 'Soup',
    is_favorite: true,
    is_emergency: false,
  },
  {
    id: 'card-bathroom',
    categorySlug: 'needs',
    label: 'Bathroom',
    phrase_output: 'I need the bathroom',
    icon_name: 'Toilet',
    is_favorite: true,
    is_emergency: false,
  },
  {
    id: 'card-pain',
    categorySlug: 'needs',
    label: 'Pain',
    phrase_output: 'I am in pain',
    icon_name: 'HeartPulse',
    is_favorite: true,
    is_emergency: false,
  },
  {
    id: 'card-tired',
    categorySlug: 'feelings',
    label: 'Tired',
    phrase_output: 'I feel tired',
    icon_name: 'MoonStar',
    is_favorite: true,
    is_emergency: false,
  },
  {
    id: 'card-help',
    categorySlug: 'emergency',
    label: 'Help',
    phrase_output: 'I need help',
    icon_name: 'HandHelping',
    is_favorite: true,
    is_emergency: true,
  },
  {
    id: 'card-yes',
    categorySlug: 'actions',
    label: 'Yes',
    phrase_output: 'Yes',
    icon_name: 'GlassWater',
    is_favorite: false,
    is_emergency: false,
  },
  {
    id: 'card-no',
    categorySlug: 'actions',
    label: 'No',
    phrase_output: 'No',
    icon_name: 'AlertTriangle',
    is_favorite: false,
    is_emergency: false,
  },
] as const;

export const QUICK_ACTION_LABELS = ['Water', 'Food', 'Help', 'Bathroom', 'Pain', 'Tired'] as const;

export function getCategoryMeta(slug?: string | null): CategoryMeta {
  if (slug && CATEGORY_METADATA[slug]) {
    return CATEGORY_METADATA[slug];
  }
  return CATEGORY_METADATA.needs;
}

export const QUICK_ACTION_ICON_BY_LABEL: Record<string, LucideIcon> = {
  Water: GlassWater,
  Food: Soup,
  Help: HandHelping,
  Bathroom: Toilet,
  Pain: HeartPulse,
  Tired: MoonStar,
};
