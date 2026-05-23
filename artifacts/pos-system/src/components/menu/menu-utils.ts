export const ITEMS_PER_PAGE = 12;

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