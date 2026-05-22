import { syncPermissions } from "./sync-permissions";

async function main() {
  await syncPermissions();

  console.log("Permissions synced");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {});