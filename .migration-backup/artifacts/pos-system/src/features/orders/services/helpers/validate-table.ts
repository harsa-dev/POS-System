import { TableStatus } from "@prisma/client";

import { BadRequestError } from "@/lib/errors";

type ValidateTableParams = {
  table: {
    id: string;
    status: TableStatus;
  } | null;
};

export function validateTable({ table }: ValidateTableParams) {
  if (!table || table.status !== TableStatus.AVAILABLE) {
    throw new BadRequestError("Table is no longer available");
  }
}
