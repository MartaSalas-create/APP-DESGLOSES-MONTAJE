# Cómo actualizar la web de Marta Salas (www.martasalas.com)

- La web está en la carpeta `web-martasalas-montaje/` (HTML, CSS y JavaScript, sin compilación).
- **Publicación:** Cloudflare Pages (proyecto `martasalas`) publica automáticamente cada cambio que llega a la rama **`web-martasalas`**. Tarda uno o dos minutos.
- **Vista previa antes de publicar:** cualquier otra rama genera una vista previa en `https://<rama>.martasalas.pages.dev`. Conviene revisar ahí y, cuando Marta dé el visto bueno, llevar los cambios a `web-martasalas`.
- **Dominio:** martasalas.com está en IONOS. El registro `www` es un CNAME a `martasalas.pages.dev`, y el dominio sin www redirige a `https://www.martasalas.com/`.

## Dónde está cada cosa

- Créditos de Trayectoria, Docencia, Formación, premios y tráileres (`reels.trailers`, se abren desde las fichas y desde Trayectoria; la sección Reel se quitó): `js/data.js`.
- Carteles de Trabajos en pantalla (título, año, sinopsis, tráiler): `src/data/proyectos.json`, con las imágenes en `public/posters/`.
- Fotogramas de los tráileres: `public/stills/`.
- CV en PDF: `assets/marta-salas-cv-montaje.pdf` y `assets/marta-salas-cv-docencia.pdf`.
- Estilos: `css/site.css`. Comportamiento (timeline, monitor, reel…): `js/site.js` y `js/filmografia.js`.

## Al añadir un trabajo nuevo

1. Añadirlo en `js/data.js`, en su categoría.
2. Si lleva cartel, añadirlo a `src/data/proyectos.json` (el cartel se puede sacar de TMDB con `scripts/descargar-carteles.py`).
3. Si tiene tráiler, añadirlo también a `reels.trailers` en `js/data.js`, con su fotograma en `public/stills/`.
4. Revisar en la vista previa, en ordenador y en móvil, y publicar en `web-martasalas`.
