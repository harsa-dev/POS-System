import { resolveMediaUrl } from "@/lib/api";

import type { MenuItem } from "@/features/restaurant/core-system/menu/components/menu-types";

export const ITEMS_PER_PAGE = 12;

export function getMenuImageSrc(menuItem: MenuItem, view: string) {
  const imageSrc = resolveMediaUrl(menuItem.imageUrl);

  if (menuItem.imageUrl) {
    console.debug(`[menu-image-debug] ${view} image src`, {
      name: menuItem.name,
      imageUrl: menuItem.imageUrl,
      imageSrc,
    });
  }

  return imageSrc;
}

export function getCategoryColor(category?: string | null) {
  if (!category) {
    return "bg-neutral-100 text-neutral-600";
  }

  const name = category.toLowerCase();

  if (name.includes("main")) {
    return "bg-orange-100 text-orange-700";
  }

  if (name.includes("starter")) {
    return "bg-blue-100 text-blue-700";
  }

  if (name.includes("dessert")) {
    return "bg-pink-100 text-pink-700";
  }

  if (name.includes("drink")) {
    return "bg-cyan-100 text-cyan-700";
  }

  return "bg-neutral-100 text-neutral-700";
}
