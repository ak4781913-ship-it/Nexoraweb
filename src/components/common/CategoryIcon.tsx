import {
  Box,
  Briefcase,
  Code2,
  Compass,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Layers,
  Palette,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
} from 'lucide-react';

const ICON_MAP = {
  Cpu,
  Wrench,
  Sparkles,
  GraduationCap,
  Layers,
  Globe,
  Smartphone,
  Box,
  Code2,
  Database,
  Shield,
  Palette,
  Briefcase,
  Compass,
} as const;

export type CategoryIconName = keyof typeof ICON_MAP;

export const AVAILABLE_CATEGORY_ICONS: CategoryIconName[] = Object.keys(
  ICON_MAP,
) as CategoryIconName[];

export function CategoryIcon({
  name,
  className = 'h-5 w-5',
}: {
  name: string;
  className?: string;
}) {
  const IconComp = ICON_MAP[name as CategoryIconName] || Box;
  return <IconComp className={className} aria-hidden="true" />;
}
