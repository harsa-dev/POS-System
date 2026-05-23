import { prisma } from "../src/lib/db/prisma";

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
    },
  });

  const defaultCategories = [
    "Main Course",
    "Appetizers",
    "Desserts",
    "Beverages",
  ];

  for (const restaurant of restaurants) {
    for (const name of defaultCategories) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          restaurantId: restaurant.id,
        },
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            name,
            restaurantId: restaurant.id,
          },
        });
      }
    }
  }

  console.log("Default categories seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });