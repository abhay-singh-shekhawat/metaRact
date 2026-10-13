import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";

async function main() {
  const dir = path.join(process.cwd(), ".data");
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "studio.json"),
    JSON.stringify({ seq: 0, enquiries: [], events: [], notes: [], outbox: [] }, null, 2)
  );
  console.log("Local data store reset (.data/studio.json).");
}

main();
