import type { ComponentProps } from "react";
import {
  ArmchairIcon,
  BabyIcon,
  BirdIcon,
  BookOpenIcon,
  BrainIcon,
  CarFrontIcon,
  Gamepad2Icon,
  GiftIcon,
  HeartPulseIcon,
  HouseIcon,
  PackageIcon,
  PartyPopperIcon,
  PlaneIcon,
  ReceiptTextIcon,
  ShapesIcon,
  SlidersHorizontalIcon,
  UtensilsIcon,
  UserRoundIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import type { CategoryIconName } from "@/src/lib/categories/catalog";

const categoryIcons: Record<CategoryIconName, LucideIcon> = {
  shapes: ShapesIcon,
  "sliders-horizontal": SlidersHorizontalIcon,
  home: HouseIcon,
  utensils: UtensilsIcon,
  "heart-pulse": HeartPulseIcon,
  "car-front": CarFrontIcon,
  "book-open": BookOpenIcon,
  plane: PlaneIcon,
  gift: GiftIcon,
  wallet: WalletIcon,
  baby: BabyIcon,
  "gamepad-2": Gamepad2Icon,
  package: PackageIcon,
  "user-round": UserRoundIcon,
  brain: BrainIcon,
  armchair: ArmchairIcon,
  "receipt-text": ReceiptTextIcon,
  bird: BirdIcon,
  "party-popper": PartyPopperIcon,
};

type CategoryIconProps = {
  name: string | null;
} & Omit<ComponentProps<LucideIcon>, "name">;

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon =
    name && Object.prototype.hasOwnProperty.call(categoryIcons, name)
      ? categoryIcons[name as CategoryIconName]
      : ShapesIcon;
  return <Icon {...props} />;
}
