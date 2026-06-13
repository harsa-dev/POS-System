import { retailMockRepository } from "./retail.mock-repository.js";
import type { RetailRepository } from "./retail.repository.js";

// Keep this indirection while Prisma retail models are still being prepared.
// The Prisma agent can replace this value with a real repository without changing route handlers.
export const retailRepository: RetailRepository = retailMockRepository;
