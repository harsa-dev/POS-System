import { createSidebarParityReport } from "../src/app/registry/index";

const report = createSidebarParityReport("fnb");
const shouldFail =
  report.summary.missingCount > 0 ||
  report.summary.extraCount > 0 ||
  report.summary.routeMismatchCount > 0 ||
  report.summary.labelMismatchCount > 0 ||
  report.summary.orderMismatchCount > 0 ||
  report.summary.rolePermissionMismatchCount > 0;

function printList<T>(
  title: string,
  items: readonly T[],
  format: (item: T) => string,
) {
  console.log(`${title}: ${items.length}`);

  for (const item of items) {
    console.log(`  - ${format(item)}`);
  }
}

console.log("V3 sidebar parity report");
console.log("========================");
console.log(`Runtime mode: fnb`);
console.log(`Current item count: ${report.summary.currentCount}`);
console.log(`Generated item count: ${report.summary.generatedCount}`);
console.log(`Matched item count: ${report.summary.matchingCount}`);
console.log("");

printList(
  "Missing items",
  report.missingItems,
  (item) => item.current?.label ?? "Unknown current item",
);
printList(
  "Extra items",
  report.extraItems,
  (item) => item.generated?.label ?? "Unknown generated item",
);
printList(
  "Route mismatches",
  report.routeMismatches,
  (item) =>
    `${item.current?.label ?? "Unknown"}: ${item.current?.routePath ?? "-"} -> ${item.generated?.routePath ?? "-"}`,
);
printList(
  "Label mismatches",
  report.labelMismatches,
  (item) =>
    `${item.current?.routePath ?? "Unknown"}: ${item.current?.label ?? "-"} -> ${item.generated?.label ?? "-"}`,
);
printList(
  "Order mismatches",
  report.orderMismatches,
  (item) =>
    `${item.current?.label ?? "-"} -> ${item.generated?.label ?? "-"} (${item.reason})`,
);
printList(
  "Role/permission mismatches",
  report.rolePermissionMismatches,
  (item) =>
    `${item.current?.label ?? "Unknown"}: [${item.current?.roles.join(", ") ?? ""}] -> [${item.generated?.roles.join(", ") ?? ""}]`,
);
printList(
  "Group/section mismatches (warning only)",
  report.groupSectionMismatches,
  (item) =>
    `${item.current?.label ?? "Unknown"}: ${item.current?.group ?? "-"} -> ${item.generated?.group ?? "-"}`,
);

console.log("");
console.log(
  `Route/label/order/role parity: ${shouldFail ? "FAILED" : "PASSED"}`,
);
console.log(
  `Group/section parity: ${
    report.summary.groupSectionMismatchCount === 0
      ? "PASSED"
      : "WARNING ONLY"
  }`,
);

if (shouldFail) {
  process.exitCode = 1;
}
