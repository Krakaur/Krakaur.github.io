# E-portafolio profesional de Dirk Hans Krakaur Floranes

Sitio profesional estático publicado en [krakaur.github.io](https://krakaur.github.io/). Presenta un perfil interdisciplinario orientado a docencia universitaria, tecnologías de la información, informática y sistemas, soporte técnico, redes, datos, inteligencia artificial, gestión y comunicación científica.

## Arquitectura

El sitio usa HTML, CSS y JavaScript nativos, sin bibliotecas de ejecución ni servicios de terceros. Esta decisión reduce superficie de mantenimiento, mejora la estabilidad de GitHub Pages y mantiene el contenido portable.

```text
.
├── index.html              # Contenido semántico y metadatos estructurados
├── 404.html                # Página de error propia
├── assets/
│   ├── app.js              # Navegación, filtros y mejoras progresivas
│   ├── styles.css          # Sistema visual adaptable e imprimible
│   ├── favicon.svg
│   └── dirk-hans-krakaur.jpg
├── data/profile.json       # Síntesis pública legible por máquinas
├── scripts/validate.mjs    # Validación de integridad y privacidad
├── manifest.webmanifest
├── robots.txt
└── sitemap.xml
```

## Desarrollo local

No se requiere instalar dependencias. Desde la raíz del repositorio:

```powershell
py -m http.server 4173
```

Abra `http://127.0.0.1:4173/`. Para ejecutar la verificación automatizada:

```powershell
node scripts/validate.mjs
node --check assets/app.js
```

## Publicación

GitHub Pages publica la rama `main` desde la raíz. Cada actualización confirmada en `main` activa un despliegue del sitio. El flujo de calidad de GitHub Actions valida referencias locales, metadatos, estructura JSON y ausencia de datos restringidos.

## Criterio de información pública

La representación académica distingue cédulas profesionales registradas, estudios concluidos con titulación pendiente y programas activos en curso. El repositorio excluye números de cédula, teléfonos, domicilio, identificadores personales y documentos probatorios no redactados.

La fotografía pertenece al titular del portafolio y se usa exclusivamente como imagen profesional de perfil.
