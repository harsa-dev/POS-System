import {
  assertServiceBusinessPolicyCoverage,
  getServiceBusinessPolicySnapshot,
} from "../src/features/service-business/service-business.policy.js";

const result = assertServiceBusinessPolicyCoverage();
const policy = getServiceBusinessPolicySnapshot();

console.log("Service Business audit and permission policy coverage passed.");
console.log(`Policy entries: ${result.entryCount}`);
console.log(`Audited/sensitive entries: ${result.sensitiveEntryCount}`);
console.log(`Read-only/preview entries: ${result.readOnlyOrPreviewEntryCount}`);
console.log(
  `Permissions covered: ${new Set(policy.map((entry) => entry.permission)).size}`,
);
