import { assertRawMaterialPolicyCoverage, getRawMaterialPolicySnapshot } from "../src/services/raw-material/raw-material.policy.js";

assertRawMaterialPolicyCoverage();

const snapshot = getRawMaterialPolicySnapshot();
const sensitiveCount = snapshot.filter((entry) => entry.audit.required).length;
const readOnlyCount = snapshot.length - sensitiveCount;

console.log("Raw Material audit and permission policy matrix is valid.");
console.log(`Policy entries: ${snapshot.length}`);
console.log(`Sensitive/audited entries: ${sensitiveCount}`);
console.log(`Read-only or preview entries: ${readOnlyCount}`);
