import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { prisma } from "../../lib/prisma.js";
import { requireCashflowView } from "./cashflow.permissions.js";
import {
  cashflowAccounts,
  type CashflowAccount,
  type CashflowActor,
} from "./cashflow.types.js";

type AccountBalanceRow = {
  account: CashflowAccount;
  income: number;
  expense: number;
  adjustment: number;
  balance: number;
  postedCount: number;
  pendingCount: number;
  voidedCount: number;
};

export type CashflowAccountBalanceDto = AccountBalanceRow;

export type CashflowAccountBalancesDto = {
  generatedAt: string;
  totalBalance: number;
  accounts: CashflowAccountBalanceDto[];
};

function createEmptyBalance(account: CashflowAccount): AccountBalanceRow {
  return {
    account,
    income: 0,
    expense: 0,
    adjustment: 0,
    balance: 0,
    postedCount: 0,
    pendingCount: 0,
    voidedCount: 0,
  };
}

export async function getCashflowAccountBalances(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
}): Promise<CashflowAccountBalancesDto> {
  requireCashflowView(params.actor.role);

  const rows = await prisma.$queryRaw<AccountBalanceRow[]>`
    SELECT
      "account" AS "account",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount" ELSE 0 END), 0)::int AS "income",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN "amount" ELSE 0 END), 0)::int AS "expense",
      COALESCE(SUM(CASE WHEN "status" = 'POSTED' AND "type" = 'ADJUSTMENT' THEN "amount" ELSE 0 END), 0)::int AS "adjustment",
      COALESCE(SUM(CASE
        WHEN "status" != 'POSTED' THEN 0
        WHEN "type" IN ('INCOME', 'TRANSFER_IN') THEN "amount"
        WHEN "type" IN ('EXPENSE', 'TRANSFER_OUT') THEN -"amount"
        WHEN "type" = 'ADJUSTMENT' THEN "amount"
        ELSE 0
      END), 0)::int AS "balance",
      COUNT(*) FILTER (WHERE "status" = 'POSTED')::int AS "postedCount",
      COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingCount",
      COUNT(*) FILTER (WHERE "status" = 'VOIDED')::int AS "voidedCount"
    FROM "CashflowEntry"
    WHERE "businessId" = ${params.businessContext.businessId}
    GROUP BY "account"
    ORDER BY "account" ASC;
  `;

  const balancesByAccount = new Map<CashflowAccount, AccountBalanceRow>(
    rows.map((row) => [row.account, row]),
  );

  const accounts = cashflowAccounts.map((account) =>
    balancesByAccount.get(account) ?? createEmptyBalance(account),
  );

  return {
    generatedAt: new Date().toISOString(),
    totalBalance: accounts.reduce((total, account) => total + account.balance, 0),
    accounts,
  };
}
