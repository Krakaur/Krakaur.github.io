import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const errors = [];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "tmp"].includes(entry.name)) continue;
    const target = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(target));
    else files.push(target);
  }
  return files;
}

const allFiles = await filesUnder(root);
const publicTextFiles = allFiles.filter((file) => [".html", ".css", ".js", ".json", ".xml", ".txt", ".webmanifest", ".svg"].includes(extname(file)));
const forbiddenDocumentExtensions = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".7z"]);

for (const file of allFiles) {
  const info = await stat(file);
  if (info.size > 24 * 1024 * 1024) {
    errors.push(`${relative(root, file)} supera 24 MiB.`);
  }
  if (forbiddenDocumentExtensions.has(extname(file).toLowerCase())) {
    errors.push(`${relative(root, file)} es un documento probatorio o contenedor no permitido.`);
  }
}

for (const file of publicTextFiles) {
  const text = await readFile(file, "utf8");
  const path = relative(root, file);
  const forbidden = [
    { name: "correo electrónico", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
    { name: "parámetro CURP", pattern: /[?&](?:amp;)?curp=/i },
    { name: "enlace telefónico", pattern: /(?:href=)?["']tel:/i }
  ];
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) errors.push(`${path} contiene ${rule.name}.`);
  }
}

for (const jsonPath of ["data/profile.json", "data/credentials.json", "manifest.webmanifest"]) {
  try {
    JSON.parse(await readFile(join(root, jsonPath), "utf8"));
  } catch (error) {
    errors.push(`${jsonPath} no contiene JSON válido: ${error.message}`);
  }
}

let credentials = [];
try {
  credentials = JSON.parse(await readFile(join(root, "data", "credentials.json"), "utf8"));
  if (!Array.isArray(credentials) || credentials.length !== 12) errors.push("data/credentials.json debe contener 12 registros.");
} catch {
  credentials = [];
}

const allowedDirectKeys = new Set(["idCedula", "idProfesionista", "token"]);
const seenSlugs = new Set();
const seenNumbers = new Set();
let directCount = 0;
let searchCount = 0;

for (const credential of credentials) {
  const { slug, registry_number: registryNumber, verification_mode: mode, verification_url: verificationUrl } = credential;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) errors.push(`Slug de credencial inválido: ${slug}.`);
  if (!/^\d{7,10}$/.test(String(registryNumber ?? ""))) errors.push(`Número profesional inválido en ${slug}.`);
  if (seenSlugs.has(slug)) errors.push(`Slug de credencial duplicado: ${slug}.`);
  if (seenNumbers.has(String(registryNumber))) errors.push(`Número profesional duplicado en ${slug}.`);
  seenSlugs.add(slug);
  seenNumbers.add(String(registryNumber));

  try {
    const url = new URL(verificationUrl);
    if (url.protocol !== "https:" || url.hostname !== "cedulaprofesional.sep.gob.mx") {
      errors.push(`${slug} no utiliza el dominio HTTPS oficial de la DGP.`);
    }
    if (mode === "direct") {
      directCount += 1;
      const keys = [...url.searchParams.keys()];
      if (keys.length !== 3 || keys.some((key) => !allowedDirectKeys.has(key))) errors.push(`${slug} contiene parámetros directos no autorizados.`);
      for (const key of allowedDirectKeys) if (!url.searchParams.get(key)) errors.push(`${slug} omite el parámetro ${key}.`);
    } else if (mode === "search") {
      searchCount += 1;
      if (url.search) errors.push(`${slug} debe usar el buscador DGP sin parámetros personales.`);
    } else {
      errors.push(`${slug} tiene un modo de verificación desconocido.`);
    }
  } catch {
    errors.push(`${slug} contiene una URL de verificación inválida.`);
  }

  for (const requiredPath of [
    join(root, "credenciales", slug ?? "", "index.html"),
    join(root, "assets", "qr", `${slug}.svg`)
  ]) {
    try {
      await stat(requiredPath);
    } catch {
      errors.push(`Falta ${relative(root, requiredPath)}.`);
    }
  }
}

if (directCount !== 3 || searchCount !== 9) errors.push(`Distribución registral inesperada: ${directCount} directas y ${searchCount} por búsqueda.`);

const htmlFiles = allFiles.filter((file) => extname(file) === ".html");
for (const htmlFile of htmlFiles) {
  const htmlText = await readFile(htmlFile, "utf8");
  const htmlPath = relative(root, htmlFile);
  const ids = new Set([...htmlText.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const localReferences = [...htmlText.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const reference of localReferences) {
    if (reference.startsWith("#")) {
      const id = reference.slice(1);
      if (id && !ids.has(id)) errors.push(`${htmlPath} apunta al ancla inexistente #${id}.`);
      continue;
    }
    if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0].replace(/^\//, "");
    if (!clean) continue;
    try {
      await stat(join(root, clean));
    } catch {
      errors.push(`${htmlPath} referencia el archivo inexistente ${reference}.`);
    }
  }
}

const html = await readFile(join(root, "index.html"), "utf8");

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
