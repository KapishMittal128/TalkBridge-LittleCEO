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
  Star,
  Toilet,
  Volume2,
  type LucideIcon,
} from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
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
  Star,
  Toilet,
  Volume2,
};

export function getIconByName(name?: string | null): LucideIcon {
  if (name && ICONS[name]) {
    return ICONS[name];
  }

  return Volume2;
}
