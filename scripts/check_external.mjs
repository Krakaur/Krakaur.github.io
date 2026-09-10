import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(await readFile(resolve(root, "data", "digital-credentials.json"), "utf8"));
const targets = [
  ...catalog.credly.map((item) => ({ platform: "Credly", title: item.title, url: item.verification_url })),
  ...catalog.coursera_groups.flatMap((group) => group.items.map((item) => ({ platform: "Coursera", title: item.title, url: item.verification_url })))
];

const results = [];
const queue = [...targets];

async function worker() {
  while (queue.length) {
    const target = queue.shift();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(target.url, {
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "krakaur.github.io link-integrity-check/1.0" }
      });
      await response.body?.cancel();
      results.push({ ...target, status: response.status, ok: response.ok, finalUrl: response.url });
    } catch (error) {
      results.push({ ...target, status: 0, ok: false, error: error.message });
    } finally {
      clearTimeout(timeout);
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
results.sort((a, b) => a.platform.localeCompare(b.platform) || a.title.localeCompare(b.title));

for (const result of results) {
  console.log(`${result.ok ? "OK" : "FAIL"} ${String(result.status).padStart(3)} ${result.platform.padEnd(8)} ${result.title}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length) {
  console.error(`\n${failures.length} de ${results.length} enlaces no respondieron correctamente.`);
  process.exit(1);
}

console.log(`\n${results.length} de ${results.length} enlaces externos respondieron correctamente.`);
