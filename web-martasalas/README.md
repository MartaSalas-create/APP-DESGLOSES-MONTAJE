# martasalas.com · rediseño

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
