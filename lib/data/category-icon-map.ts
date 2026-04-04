import {
  Smartphone, Tablet, Laptop, Monitor, Watch, Headphones,
  Speaker, Mic, Camera, Gamepad2, Printer, Projector, Cable,
  Percent, LifeBuoy, Shield, HardDrive, Keyboard, Home,
  Glasses, Box,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryIcon } from "./category-icons";

const iconMap: Record<CategoryIcon, LucideIcon> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
  watch: Watch,
  headphones: Headphones,
  speaker: Speaker,
  mic: Mic,
  camera: Camera,
  "gamepad-2": Gamepad2,
  printer: Printer,
  projector: Projector,
  cable: Cable,
  percent: Percent,
  "life-buoy": LifeBuoy,
  shield: Shield,
  "hard-drive": HardDrive,
  keyboard: Keyboard,
  home: Home,
  glasses: Glasses,
  box: Box,
};

export function getCategoryIcon(name: CategoryIcon): LucideIcon {
  return iconMap[name] ?? Box;
}
