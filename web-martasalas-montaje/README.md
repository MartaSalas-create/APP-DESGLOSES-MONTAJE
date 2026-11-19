# martasalas.com · rediseño (versión sala de montaje)

Web estática (HTML, CSS y JS, sin dependencias) para sustituir la web actual hecha con el editor MyWebsite de IONOS.

## Ver en local
Abre `index.html` en el navegador, o ejecuta `python3 -m http.server` dentro de esta carpeta y entra en http://localhost:8000.

## Editar contenidos
Todo el texto variable está en **`js/data.js`**:
- `featured`: tarjetas de «Trabajos destacados». Añade `poster: "assets/archivo.jpg"` para mostrar un cartel.
- `awards`: la cinta de premios.
- `reels`: identificadores de YouTube del reel de TV y de cine.
- `credits`: filmografía completa por categorías. Cada línea es `[año, "Título", "Detalle"]`.
- `teaching` y `training`: docencia y formación.

Las cifras de la cabecera (series y créditos) se calculan solas a partir de esos datos.

Los CV están en `assets/`. Para actualizarlos, sustituye los PDF manteniendo el nombre.

## Publicar
El editor MyWebsite de IONOS no permite subir HTML propio. Hay dos opciones:
1. **Hosting web de IONOS** (o cualquier hosting): sube el contenido de esta carpeta por FTP/SFTP a la raíz del dominio.
2. **Netlify, Vercel, Cloudflare Pages o GitHub Pages** (gratis): publica esta carpeta y apunta el dominio `martasalas.com` desde el panel DNS de IONOS.

## Filmografía (galería de carteles)
- **Datos:** `src/data/proyectos.json` (20 obras). Rellena a mano `rol` y `videoUrl` (enlace de YouTube o Vimeo). Si vuelves a ejecutar el script, esos campos se conservan.
- **Carteles:** `public/posters/<id>.jpg` (y `.webp`). Las obras sin cartel usan `public/posters/placeholder-poster.svg`. Para añadir uno a mano, guárdalo como `public/posters/<id>.jpg` y vuelve a ejecutar el script (o cambia la ruta `poster` en el JSON).
- **Script:** `python3 scripts/descargar-carteles.py` busca cada obra en TMDB (en español), elige el resultado en el que Marta Salas figura en los créditos, descarga el cartel en máxima resolución, lo redimensiona a 900 px de ancho, crea la copia `.webp` (calidad 85) y regenera el JSON. Necesita `TMDB_API_KEY` (clave v3 o token de acceso de lectura) y Pillow (`pip install Pillow`).
- **Ver en local:** la galería lee el JSON con `fetch`, así que hace falta un servidor: `python3 -m http.server` dentro de esta carpeta y abre http://localhost:8000/#trabajos
