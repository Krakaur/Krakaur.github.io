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
    { name: "enlace telefónico", pattern: /(?:href=)?["']tel:/i },
    { name: "identificador o enlace personal de Europass", pattern: /europa\.eu\/europass\/(?:wallet\/|eportfolio\/shared\/)/i }
  ];
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) errors.push(`${path} contiene ${rule.name}.`);
  }
}

for (const jsonPath of ["data/profile.json", "data/credentials.json", "data/digital-credentials.json", "manifest.webmanifest"]) {
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

let digitalCredentials;
try {
  digitalCredentials = JSON.parse(await readFile(join(root, "data", "digital-credentials.json"), "utf8"));
} catch {
  digitalCredentials = null;
}

if (digitalCredentials) {
  const credly = Array.isArray(digitalCredentials.credly) ? digitalCredentials.credly : [];
  const groups = Array.isArray(digitalCredentials.coursera_groups) ? digitalCredentials.coursera_groups : [];
  const coursera = groups.flatMap((group) => Array.isArray(group.items) ? group.items : []);
  if (credly.length !== 9) errors.push(`El catálogo debe contener 9 emisiones Credly; contiene ${credly.length}.`);
  if (coursera.length !== 19) errors.push(`El catálogo debe contener 19 certificados Coursera; contiene ${coursera.length}.`);
  if (groups.length !== 4) errors.push(`El catálogo Coursera debe conservar 4 grupos; contiene ${groups.length}.`);
  if (digitalCredentials.summary?.total !== 28 || digitalCredentials.summary?.credly !== 9 || digitalCredentials.summary?.coursera !== 19) {
    errors.push("El resumen de credenciales digitales no coincide con la colección 9 + 19.");
  }

  const seenDigitalUrls = new Set();
  for (const item of credly) {
    try {
      const url = new URL(item.verification_url);
      if (url.protocol !== "https:" || url.hostname !== "www.credly.com" || !/^\/badges\/[0-9a-f-]{36}\/public_url$/.test(url.pathname)) {
        errors.push(`${item.title} no utiliza una página pública válida de Credly.`);
      }
      if (seenDigitalUrls.has(url.href)) errors.push(`URL digital duplicada: ${url.href}.`);
      seenDigitalUrls.add(url.href);
    } catch {
      errors.push(`${item.title ?? "Credencial Credly"} contiene una URL inválida.`);
    }
    if (!/^\/assets\/badges\/[a-z0-9-]+\.png$/.test(item.image ?? "")) {
      errors.push(`${item.title} no utiliza una imagen local saneada.`);
    } else {
      try {
        await stat(join(root, item.image.slice(1)));
      } catch {
        errors.push(`${item.title} referencia una imagen de insignia inexistente.`);
      }
    }
  }

  const seenAccomplishmentIds = new Set();
  for (const item of coursera) {
    if (!/^[A-Z0-9]{12}$/.test(item.accomplishment_id ?? "")) errors.push(`Identificador Coursera inválido en ${item.title}.`);
    if (seenAccomplishmentIds.has(item.accomplishment_id)) errors.push(`Identificador Coursera duplicado: ${item.accomplishment_id}.`);
    seenAccomplishmentIds.add(item.accomplishment_id);
    try {
      const url = new URL(item.verification_url);
      const expectedPath = `/account/accomplishments/verify/${item.accomplishment_id}`;
      if (url.protocol !== "https:" || url.hostname !== "www.coursera.org" || url.pathname !== expectedPath || url.search) {
        errors.push(`${item.title} no utiliza una página de verificación válida de Coursera.`);
      }
      if (seenDigitalUrls.has(url.href)) errors.push(`URL digital duplicada: ${url.href}.`);
      seenDigitalUrls.add(url.href);
    } catch {
      errors.push(`${item.title ?? "Certificado Coursera"} contiene una URL inválida.`);
    }
  }
}

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
const digitalHtml = await readFile(join(root, "credenciales-digitales", "index.html"), "utf8");
const credlyLinksInPage = [...digitalHtml.matchAll(/href="https:\/\/www\.credly\.com\/badges\//g)].length;
const courseraLinksInPage = [...digitalHtml.matchAll(/href="https:\/\/www\.coursera\.org\/account\/accomplishments\/verify\//g)].length;
if (credlyLinksInPage !== 9 || courseraLinksInPage !== 19) {
  errors.push(`La página digital expone ${credlyLinksInPage} enlaces Credly y ${courseraLinksInPage} enlaces Coursera; se esperaban 9 y 19.`);
}

// Keep a single bibliographic record per DOI and compare the public representations.
try {
  const profile = JSON.parse(await readFile(join(root, "data", "profile.json"), "utf8"));
  const publications = profile.selected_publications ?? [];
  const seenDois = new Set();

  for (const publication of publications) {
    if (!publication.doi) continue;
    const doiUrl = new URL(publication.doi);
    const doi = decodeURIComponent(doiUrl.pathname.slice(1)).trim().toLowerCase();
    if (doiUrl.protocol !== "https:" || doiUrl.hostname !== "doi.org" || !/^10\.\d{4,9}\/\S+$/.test(doi)) {
      errors.push(`${publication.title} no utiliza un DOI canónico válido.`);
    }
    if (seenDois.has(doi)) errors.push(`DOI duplicado en selected_publications: ${doi}.`);
    seenDois.add(doi);

    if (!publication.url?.startsWith("https://krakaur.github.io/publicaciones/")) continue;
    const publicationPath = new URL(publication.url).pathname.slice(1);
    const publicationHtml = await readFile(join(root, publicationPath, "index.html"), "utf8");
    const structuredMatch = publicationHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!structuredMatch) throw new Error(`${publication.title} carece de datos estructurados.`);
    const structured = JSON.parse(structuredMatch[1]);
    const citationMeta = (name) => [...publicationHtml.matchAll(/<meta name="([^"]+)" content="([^"]*)">/g)]
      .filter((match) => match[1] === name).map((match) => match[2]);
    const expectedAuthors = publication.authors ?? [];
    const actualAuthors = structured.author?.map((author) => author.name) ?? [];

    for (const [label, actual, expected] of [
      ["título estructurado", structured.name, publication.title],
      ["título bibliográfico", citationMeta("citation_title")[0], publication.title],
      ["DOI", citationMeta("citation_doi")[0], doi],
      ["identificador estructurado", structured.identifier, doi],
      ["fecha estructurada", structured.datePublished, publication.publication_date],
      ["fecha bibliográfica", citationMeta("citation_publication_date")[0], publication.publication_date?.replaceAll("-", "/")],
      ["enlace PDF", citationMeta("citation_pdf_url")[0], publication.published_pdf_url],
      ["licencia", structured.license, publication.license],
      ["URL canónica", structured.url, publication.url],
      ["fuente editorial", structured.sameAs, publication.publisher_url]
    ]) {
      if (!expected || actual !== expected) errors.push(`${publication.title}: ${label} no coincide entre la ficha y el perfil.`);
    }
    if (JSON.stringify(actualAuthors) !== JSON.stringify(expectedAuthors) ||
        JSON.stringify(citationMeta("citation_author")) !== JSON.stringify(expectedAuthors)) {
      errors.push(`${publication.title}: autoría u orden de autores inconsistentes.`);
    }
    if (structured["@type"] !== "ScholarlyArticle" || publication.type !== "journal-article") {
      errors.push(`${publication.title}: tipo de publicación inconsistente.`);
    }
    if (String(publication.year) !== publication.publication_date?.slice(0, 4)) {
      errors.push(`${publication.title}: año y fecha de publicación inconsistentes.`);
    }
    if (!html.includes(`href="/${publicationPath}"`)) errors.push(`${publication.title} no está enlazado desde la portada.`);
    for (const publicUrl of [publication.publisher_url, publication.published_pdf_url, publication.license]) {
      if (new URL(publicUrl).protocol !== "https:") errors.push(`${publication.title}: enlace público no HTTPS.`);
    }
  }
} catch (error) {
  errors.push(`No se pudo validar el catálogo de publicaciones: ${error.message}`);
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

try {
  const awards = JSON.parse(await readFile(join(root, "data", "academic-awards.json"), "utf8")).awards;
  const award = awards["doctorado-administracion"];
  const administration = credentials.find((item) => item.slug === "doctorado-administracion");
  const profile = JSON.parse(await readFile(join(root, "data", "profile.json"), "utf8"));
  const doctoral = profile.doctoral_education.find((item) => item.institution === "Universidad IEXPRO");
  const detail = await readFile(join(root, "credenciales", "doctorado-administracion", "index.html"), "utf8");
  if (!award || JSON.stringify(administration?.academic_award) !== JSON.stringify(award)) {
    errors.push("El título IEXPRO no coincide entre academic-awards.json y credentials.json.");
  }
  for (const [key, expected] of Object.entries({title_issued_on: "2026-08-31", study_start: "2024-05-04", study_end: "2025-08-30", degree_exam_on: "2026-03-01"})) {
    if (award?.[key] !== expected || doctoral?.[key] !== expected) errors.push(`Fecha IEXPRO inconsistente: ${key}.`);
  }
  if (/título\s+(?:en trámite|(?:electrónico\s+)?pendiente)/iu.test(doctoral?.status ?? "")) {
    errors.push("El perfil IEXPRO conserva un título pendiente ya expedido.");
  }
  if (profile.credentials_summary.professional_licenses !== 12 ||
      profile.credentials_summary.completed_doctoral_programs_pending_degree !== 2 ||
      profile.credentials_summary.active_doctoral_programs !== 1) errors.push("El resumen doctoral no conserva doce cédulas, dos programas pendientes y uno en curso.");
  if (!detail.includes(award?.description ?? "TITULO_AUSENTE") || !detail.includes(award?.title_folio ?? "FOLIO_AUSENTE")) {
    errors.push("La ficha IEXPRO no contiene el título expedido y su folio.");
  }
  if (!html.includes("Universidad IEXPRO · título profesional electrónico expedido el 31 de agosto de 2026")) {
    errors.push("La portada no presenta el título IEXPRO expedido.");
  }
} catch (error) {
  errors.push(`No se pudo validar el título IEXPRO: ${error.message}`);
}

// Prevent regression of the broader, evidence-bounded professional profile.
try {
  const profile = JSON.parse(await readFile(join(root, "data", "profile.json"), "utf8"));
  const catalog = JSON.parse(await readFile(join(root, "data", "coursera-certificates.json"), "utf8"));
  const catalogHtml = await readFile(join(root, "formacion-coursera", "index.html"), "utf8");
  const identifiers = new Set();
  for (const item of catalog.items) {
    if (identifiers.has(item.id)) errors.push(`Certificado Coursera duplicado: ${item.id}.`);
    identifiers.add(item.id);
    if (!item.verification_url.endsWith(item.id) || !catalogHtml.includes(item.verification_url)) errors.push(`Referencia Coursera inconsistente: ${item.id}.`);
  }
  if (catalog.items.length !== 48 || catalog.items.filter(item => item.type === "Certificado profesional").length !== 4) errors.push("El catálogo Coursera debe contener cuatro programas y 44 cursos.");
  for (const group of JSON.parse(await readFile(join(root, "data", "digital-credentials.json"), "utf8")).coursera_groups) {
    for (const item of group.items) {
      const id = new URL(item.verification_url).pathname.split("/").filter(Boolean).at(-1);
      if (!identifiers.has(id)) errors.push(`La selección Coursera contiene un certificado ausente del catálogo completo: ${id}.`);
    }
  }
  const poverty = profile.selected_publications.find(item => item.title === "Pobreza: conceptos, fuentes y medición");
  if (JSON.stringify(poverty?.authors) !== JSON.stringify(["Omar González Ortiz", "Dirk Hans Krakaur Floranes"]) || poverty?.type !== "academic-dissemination-article") errors.push("Pobreza debe conservar dos autores y la categoría divulgación académica.");
  const manual = profile.selected_publications.find(item => item.title === "Manual de Prácticas: Taller de Investigación I");
  if (manual?.doi !== "https://doi.org/10.64784/talleri" || !html.includes(manual.doi)) errors.push("Falta el DOI registrado de Taller de Investigación I.");
  const thesis = profile.selected_publications.find(item => item.type === "masters-thesis");
  if (thesis?.year !== 2019 || thesis.published_pdf_url !== "https://biblio.uabcs.mx/tesis/tesis/te4240.pdf" || !html.includes(thesis.published_pdf_url)) errors.push("Falta la tesis, su versión de 2019 o su PDF institucional.");
  for (const work of [poverty, profile.selected_publications.find(item => item.title.startsWith("Aportes y legado"))]) {
    if (!work?.publisher_url || !work.published_pdf_url || !html.includes(work.publisher_url) || !html.includes(work.published_pdf_url)) errors.push("Una publicación de Tamma Dalama carece de fuente editorial o acceso completo.");
  }
  if (html.includes('"Docente universitario"') || !html.includes('"Académico interdisciplinario"')) errors.push("Los metadatos deben presentar académico interdisciplinario, no un puesto docente actual.");
  if (profile.academic_participation.find(item => item.organization.startsWith("Colegio"))?.document_valid_until !== "2026-03-30") errors.push("No se conserva la vigencia histórica CISCIG.");
  if (profile.complementary_credentials.conocer_standards.length !== 3) errors.push("Deben conservarse los tres estándares CONOCER.");
} catch (error) { errors.push(`No se pudo validar la ampliación integral: ${error.message}`); }

if (errors.length) {
  console.error("Validación fallida:\n" + errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validación correcta: ${allFiles.length} archivos, referencias locales íntegras y controles de privacidad aprobados.`);
