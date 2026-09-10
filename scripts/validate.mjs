import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const errors = [];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else files.push(target);
  }
  return files;
}

const allFiles = await filesUnder(root);
const publicTextFiles = allFiles.filter((file) => [".html", ".css", ".js", ".json", ".xml", ".txt", ".webmanifest", ".svg"].includes(extname(file)));

for (const file of allFiles) {
  const info = await stat(file);
  if (info.size > 24 * 1024 * 1024) {
    errors.push(`${relative(root, file)} supera 24 MiB.`);
  }
}

for (const file of publicTextFiles) {
  const text = await readFile(file, "utf8");
  const path = relative(root, file);
  const forbidden = [
    { name: "correo electrónico", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
    { name: "número de cédula", pattern: /c[eé]dula(?:\s+profesional)?[^\n]{0,24}\b\d{7,10}\b/i }
  ];
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) errors.push(`${path} contiene ${rule.name}.`);
  }
}

for (const jsonPath of ["data/profile.json", "manifest.webmanifest"]) {
  try {
    JSON.parse(await readFile(join(root, jsonPath), "utf8"));
  } catch (error) {
    errors.push(`${jsonPath} no contiene JSON válido: ${error.message}`);
  }
}

const html = await readFile(join(root, "index.html"), "utf8");
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

for (const reference of localReferences) {
  if (reference.startsWith("#")) {
    const id = reference.slice(1);
    if (id && !ids.has(id)) errors.push(`index.html apunta al ancla inexistente #${id}.`);
    continue;
  }
  if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
  const clean = reference.split(/[?#]/)[0].replace(/^\//, "");
  if (!clean) continue;
  try {
    await stat(join(root, clean));
  } catch {
    errors.push(`index.html referencia el archivo inexistente ${reference}.`);
  }
}

for (const required of [
  "<main id=\"contenido\">",
  "application/ld+json",
  "rel=\"canonical\"",
  "<meta name=\"description\"",
  "aria-label=\"Navegación principal\""
]) {
  if (!html.includes(required)) errors.push(`index.html no contiene ${required}.`);
}

if (errors.length) {
  console.error("Validación fallida:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validación correcta: ${allFiles.length} archivos, referencias locales íntegras y controles de privacidad aprobados.`);
