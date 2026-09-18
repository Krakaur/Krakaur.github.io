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
│   ├── badges/             # Imágenes gráficas sin metadatos personales
│   ├── qr/                 # QR oficiales o de acceso al buscador SEP
│   ├── favicon.svg
│   └── dirk-hans-krakaur.jpg
├── data/profile.json       # Síntesis pública legible por máquinas
├── data/credentials.json   # Índice verificable de registros profesionales
├── data/digital-credentials.json # Catálogo Credly y Coursera
├── credenciales/           # Doce fichas públicas de verificación
├── credenciales-digitales/ # Nueve emisiones Credly y diecinueve constancias Coursera
├── publicaciones/         # Fichas bibliográficas y enlaces a las fuentes editoriales
├── europass/               # Pasarela pública al modelo de acceso selectivo
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
node scripts/check_external.mjs
```

## Publicación

GitHub Pages publica la rama `main` desde la raíz. Cada actualización confirmada en `main` activa un despliegue del sitio. El flujo de calidad de GitHub Actions valida referencias locales, metadatos, estructura JSON, rutas de verificación y ausencia de datos restringidos.

## Criterio de información pública

La representación académica distingue cédulas profesionales registradas, estudios concluidos con titulación pendiente y programas activos en curso. Los números profesionales se publican deliberadamente porque son el dato necesario para la consulta oficial: tres registros cuentan con una ruta individual SEP y nueve utilizan el buscador institucional por número.

El repositorio no contiene cédulas o títulos digitalizados, constancias consolidadas, CURP, firmas, teléfonos, domicilio ni expedientes probatorios. La arquitectura separa el escaparate público; la verificación nativa en SEP, Credly y Coursera; el acceso selectivo y temporal en Europass; y el archivo maestro privado. La pasarela Europass no contiene identificadores internos ni enlaces personales permanentes.

Las imágenes de insignias se obtuvieron de los recursos gráficos públicos indicados por Credly, se redimensionaron localmente y se eliminaron sus metadatos. Los PDF de certificados y los Open Badge personales no se alojan en el repositorio.

La fotografía pertenece al titular del portafolio y se usa exclusivamente como imagen profesional de perfil.

## Actualización del Doctorado en Administración

El Doctorado en Administración de Universidad IEXPRO cuenta con título profesional electrónico expedido el 31 de agosto de 2026 y cédula profesional 15870296. La fecha de conclusión de estudios, 30 de agosto de 2025, permanece diferenciada de la fecha del examen y de expedición del título. El total continúa siendo doce cédulas; CEIT y Universidad Mundial conservan estudios doctorales concluidos con titulación pendiente, y el DSAE UdG continúa en curso.

`data/academic-awards.json` preserva la información del título para la regeneración de la ficha pública. La verificación registral SEP conserva su fecha independiente; el documento oficial íntegro permanece fuera del sitio público y pertenece al archivo privado.

## Publicaciones científicas

La ficha de [Optimización de Procesos en una Planta Cerámica](https://krakaur.github.io/publicaciones/optimizacion-procesos-planta-ceramica/) conserva el DOI editorial `10.64784/320`, la fecha de publicación, el orden de los cuatro autores y el alcance del estudio. Contiene metadatos bibliográficos y enlaces al artículo y al PDF publicados por la revista bajo CC BY 4.0. No aloja cartas administrativas, copias del expediente ni correos personales; los originales se conservan en el respaldo privado.

La presencia del artículo en un perfil o repositorio no se presenta como una nueva publicación ni como prueba de indexación selectiva. Las fichas y el perfil JSON deben conservar un único registro por DOI, y la validación compara título, autoría, fechas, licencia y enlaces entre ambas representaciones.

## Ampliación del perfil — 18 de septiembre de 2026

La actualización incorpora administración y ciencias sociales, formación académica en calidad y Lean Six Sigma, y práctica declarada de IA generativa, ingeniería de prompts, agentes y ciclos de verificación humana. No convierte asignaturas en certificaciones Belt ni herramientas aplicadas en certificaciones externas.

La producción incluye el DOI registrado de Taller de Investigación I (`10.64784/talleri`), enlaces editoriales y textos completos de Tamma Dalama, el artículo de divulgación coescrito **Pobreza: conceptos, fuentes y medición**, y la tesis UABCS cuya versión documental indica enero de 2019. El servicio AAPE/EPAA acredita una dictaminación en 2025, reconocida en 2026. COMIE conserva la aprobación como Asociado Candidato sin atribuir una formalización posterior; CISCIG se presenta como constancia histórica vencida en marzo de 2026.

`data/coursera-certificates.json` y `/formacion-coursera/` reúnen los 48 certificados originales respaldados: cuatro programas y 44 cursos. La selección de 19 certificados de `/credenciales-digitales/` está contenida en ese catálogo, no se suma a él. Antes de generar el catálogo completo se cotejaron los 48 SHA-256 originales y la presencia textual del titular y del identificador en cada PDF; no se afirma una nueva revisión visual de las 48 páginas ni una comprobación remota de cada enlace.
