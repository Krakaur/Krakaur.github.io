from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor


SITE = "https://krakaur.github.io"
SEP_SEARCH = "https://cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action"
SEP_HOST = "cedulaprofesional.sep.gob.mx"
VERIFIED_AT = "2026-09-10"


def make_qr(value: str, output: Path) -> None:
    widget = QrCodeWidget(value)
    widget.barFillColor = HexColor("#102c35")
    x1, y1, x2, y2 = widget.getBounds()
    width = x2 - x1
    height = y2 - y1
    size = 300
    drawing = Drawing(size, size, transform=[size / width, 0, 0, size / height, 0, 0])
    drawing.add(widget)
    output.parent.mkdir(parents=True, exist_ok=True)
    renderSVG.drawToFile(drawing, str(output))


def credential_json_ld(record: dict[str, object]) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "EducationalOccupationalCredential",
        "name": record["title"],
        "credentialCategory": record["level"],
        "recognizedBy": {
            "@type": "GovernmentOrganization",
            "name": "Dirección General de Profesiones, Secretaría de Educación Pública",
            "url": SEP_SEARCH,
        },
        "issuedBy": {
            "@type": "CollegeOrUniversity",
            "name": record["institution"],
        },
        "url": f"{SITE}/credenciales/{record['slug']}/",
        "sameAs": record["verification_url"],
    }
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def render_detail(record: dict[str, object]) -> str:
    title = html.escape(str(record["title"]))
    institution = html.escape(str(record["institution"]))
    level = html.escape(str(record["level"]))
    relevance = html.escape(str(record["relevance"]))
    registry_number = html.escape(str(record["registry_number"]))
    slug = html.escape(str(record["slug"]))
    verification_url = html.escape(str(record["verification_url"]), quote=True)
    direct = record["verification_mode"] == "direct"
    badge = "Verificación directa SEP" if direct else "Consulta SEP por número"
    explanation = (
        "Este acceso procede del QR incorporado en la cédula profesional electrónica y abre una ruta individual del Registro Nacional de Profesionistas."
        if direct else
        "La copia de origen no incorpora una ruta QR individual. El registro se comprueba en el portal oficial utilizando el número profesional indicado."
    )
    action = "Abrir verificación directa" if direct else "Abrir consulta oficial"
    qr_label = "QR de verificación directa SEP" if direct else "QR del portal oficial de consulta"
    areas = "".join(f"<li>{html.escape(area)}</li>" for area in record["areas"])

    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0d2831">
    <meta name="description" content="Verificación profesional SEP de {title}, cursado por Dirk Hans Krakaur Floranes en {institution}.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{SITE}/credenciales/{slug}/">
    <link rel="stylesheet" href="/assets/styles.css">
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <title>{title} | Verificación profesional</title>
    <script type="application/ld+json">{credential_json_ld(record)}</script>
  </head>
  <body class="credential-page">
    <a class="skip-link" href="#credencial">Saltar a la credencial</a>
    <header class="site-header" data-header>
      <div class="header-inner shell">
        <a class="brand" href="/" aria-label="Volver al portafolio">
          <span class="brand-mark" aria-hidden="true">DK</span>
          <span class="brand-copy"><strong>Dirk Hans Krakaur</strong><small>E-portafolio profesional</small></span>
        </a>
        <a class="detail-back" href="/#formacion">← Formación académica</a>
      </div>
    </header>

    <main id="credencial">
      <section class="credential-hero">
        <div class="shell credential-hero-grid">
          <div>
            <nav class="breadcrumbs" aria-label="Migas de pan"><a href="/">Inicio</a><span>/</span><a href="/#formacion">Formación</a><span>/</span><span aria-current="page">{level}</span></nav>
            <p class="eyebrow">Ficha pública de verificación</p>
            <h1>{title}</h1>
            <p class="credential-institution">{institution}</p>
          </div>
          <div class="credential-status-card">
            <span class="verification-badge">{badge}</span>
            <p>Cédula profesional registrada</p>
            <small>Comprobación técnica: {VERIFIED_AT}</small>
          </div>
        </div>
      </section>

      <section class="credential-content section">
        <div class="shell credential-content-grid">
          <article class="credential-evidence">
            <p class="section-index">Verificación registral</p>
            <h2>Comprobación en la fuente oficial</h2>
            <p>{explanation}</p>

            <div class="registry-number">
              <span>Dato para consulta</span>
              <strong>Cédula profesional {registry_number}</strong>
              <button type="button" data-copy-value="{registry_number}">Copiar número</button>
              <small aria-live="polite" data-copy-feedback></small>
            </div>

            <a class="button button-primary credential-official-link" href="{verification_url}" target="_blank" rel="nofollow noopener noreferrer">{action} <span aria-hidden="true">↗</span></a>

            <details class="qr-disclosure">
              <summary>Mostrar {qr_label.lower()}</summary>
              <div class="qr-panel">
                <img src="/assets/qr/{slug}.svg" width="220" height="220" alt="{qr_label} para {title}">
                <p>{qr_label}. El enlace textual anterior proporciona la misma ruta y es la opción accesible recomendada.</p>
              </div>
            </details>
          </article>

          <aside class="credential-context">
            <p class="section-index">Ámbito profesional</p>
            <p>{relevance}</p>
            <ul class="tag-list">{areas}</ul>
            <div class="evidence-boundary">
              <h2>Límite documental</h2>
              <p>Esta ficha no aloja la cédula, el título ni expedientes personales. La verificación sale del escaparate y se realiza en infraestructura oficial de la SEP.</p>
            </div>
          </aside>
        </div>
      </section>

      <section class="verification-model">
        <div class="shell verification-model-grid">
          <div><span>01</span><strong>Escaparate público</strong><p>Perfil, capacidades y trayectoria profesional.</p></div>
          <div class="is-current"><span>02</span><strong>Registro oficial</strong><p>Consulta individual en la SEP.</p></div>
          <div><span>03</span><strong>Expediente documental</strong><p>Originales fuera del sitio público.</p></div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="shell detail-footer"><p>Dirk Hans Krakaur Floranes · La Paz, Baja California Sur, México</p><a href="/">Volver al e-portafolio</a></div>
    </footer>
    <script src="/assets/app.js" defer></script>
  </body>
</html>
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("catalog", type=Path)
    parser.add_argument("audit", type=Path)
    parser.add_argument("root", type=Path)
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    audit = json.loads(args.audit.read_text(encoding="utf-8"))
    audit_by_file = {item["source_file"]: item for item in audit}
    output_records = []

    for record in sorted(catalog, key=lambda item: item["order"]):
        audited = audit_by_file.get(record["source_file"], {})
        verification = audited.get("verification") or {}
        direct = verification.get("host") == SEP_HOST and verification.get("http_status") == 200
        public_record = {key: value for key, value in record.items() if key != "source_file"}
        public_record["status"] = "Cédula profesional registrada"
        public_record["verified_at"] = VERIFIED_AT
        public_record["verification_mode"] = "direct" if direct else "search"
        public_record["verification_url"] = verification.get("url") if direct else SEP_SEARCH
        output_records.append(public_record)

        detail_dir = args.root / "credenciales" / record["slug"]
        detail_dir.mkdir(parents=True, exist_ok=True)
        (detail_dir / "index.html").write_text(render_detail(public_record), encoding="utf-8")
        make_qr(public_record["verification_url"], args.root / "assets" / "qr" / f"{record['slug']}.svg")

    (args.root / "data" / "credentials.json").write_text(
        json.dumps(output_records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    sitemap_urls = [f"  <url><loc>{SITE}/</loc><lastmod>{VERIFIED_AT}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>"]
    sitemap_urls.extend(
        f"  <url><loc>{SITE}/credenciales/{record['slug']}/</loc><lastmod>{VERIFIED_AT}</lastmod><changefreq>yearly</changefreq><priority>0.7</priority></url>"
        for record in output_records
    )
    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" + "\n".join(sitemap_urls) + "\n</urlset>\n"
    (args.root / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    direct_count = sum(record["verification_mode"] == "direct" for record in output_records)
    print(json.dumps({"credentials": len(output_records), "direct_sep": direct_count, "search_sep": len(output_records) - direct_count, "detail_pages": len(output_records), "qr_assets": len(output_records)}))


if __name__ == "__main__":
    main()
