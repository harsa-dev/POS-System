import { retailPrismaRepository } from "./retail.prisma-repository.js";
import type { RetailRepository } from "./retail.repository.js";

// Retail is now wired to Prisma through raw-query repository methods.
// The mock repository is still available for tests/local fallback, but runtime uses database persistence.
export const retailRepository: RetailRepository = retailPrismaRepository;
