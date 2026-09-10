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
│   ├── qr/                 # QR oficiales o de acceso al buscador SEP
│   ├── favicon.svg
│   └── dirk-hans-krakaur.jpg
├── data/profile.json       # Síntesis pública legible por máquinas
├── data/credentials.json   # Índice verificable de registros profesionales
├── credenciales/           # Doce fichas públicas de verificación
├── scripts/generate_credentials.py
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

GitHub Pages publica la rama `main` desde la raíz. Cada actualización confirmada en `main` activa un despliegue del sitio. El flujo de calidad de GitHub Actions valida referencias locales, metadatos, estructura JSON, rutas de verificación y ausencia de datos restringidos.

## Criterio de información pública

La representación académica distingue cédulas profesionales registradas, estudios concluidos con titulación pendiente y programas activos en curso. Los números profesionales se publican deliberadamente porque son el dato necesario para la consulta oficial: tres registros cuentan con una ruta individual SEP y nueve utilizan el buscador institucional por número.

El repositorio no contiene cédulas o títulos digitalizados, constancias consolidadas, CURP, firmas, teléfonos, domicilio ni expedientes probatorios. La arquitectura separa el escaparate público, la verificación registral en la SEP y un eventual archivo documental externo con controles propios de acceso y redacción.

La fotografía pertenece al titular del portafolio y se usa exclusivamente como imagen profesional de perfil.
