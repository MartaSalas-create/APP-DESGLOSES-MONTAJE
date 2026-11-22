#!/usr/bin/env python3
"""
Descarga los carteles de la filmografía desde TMDB y genera src/data/proyectos.json.

Uso (desde la carpeta web-martasalas-montaje):
    python3 scripts/descargar-carteles.py            # descarga carteles y regenera el JSON
    python3 scripts/descargar-carteles.py --forzar   # vuelve a descargar aunque el cartel ya exista

Autenticación con TMDB (cualquiera de las dos):
  · TMDB_API_KEY con la «Clave de la API» v3 (32 caracteres): se envía como ?api_key=
  · TMDB_API_KEY con el «Token de acceso de lectura» (texto largo): se envía como cabecera Bearer
  En el entorno en la nube de Claude el token lo inyecta el proxy, así que basta con
  TMDB_API_KEY=proxy-injected.

Para cada obra se buscan candidatos en TMDB y se elige el que tiene a Marta Salas en el
equipo técnico (créditos de TMDB). Si ningún candidato la incluye, se usa el más parecido
por título y año y se marca como «sin verificar» en la salida.

Si una obra no está en TMDB, su entrada usa posters/placeholder-poster.svg.
Los campos «rol» y «videoUrl» que ya estén rellenos en el JSON se conservan al regenerarlo.
"""
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO

try:
    from PIL import Image
except ImportError:  # sin Pillow: se guardan los originales sin redimensionar ni WebP
    Image = None

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_POSTERS = os.path.join(RAIZ, "public", "posters")
RUTA_JSON = os.path.join(RAIZ, "src", "data", "proyectos.json")
PLACEHOLDER = "public/posters/placeholder-poster.svg"
API = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p/original"
NOMBRE = "marta salas"
ANCHO_MAX = 900

# tipo: "movie" (película o corto) o "tv"; consultas: títulos alternativos a probar
OBRAS = [
    # --- Cine ---
    {"archivo": "ava", "titulo": "AVA", "anio": 2022, "categoria": "Cine", "tipo": "movie", "consultas": ["Ava"]},
    {"archivo": "el-lodo", "titulo": "El lodo", "anio": 2021, "categoria": "Cine", "tipo": "movie", "consultas": ["El lodo"]},
    {"archivo": "el-juego-de-las-llaves", "titulo": "El juego de las llaves", "anio": 2022, "categoria": "Cine", "tipo": "movie", "consultas": ["El juego de las llaves"]},
    {"archivo": "el-ano-de-la-furia", "titulo": "El año de la furia", "anio": 2020, "categoria": "Cine", "tipo": "movie", "consultas": ["El año de la furia"]},
    {"archivo": "un-plan-perfecto", "titulo": "Un plan perfecto", "anio": 2026, "categoria": "Cine", "tipo": "movie", "consultas": ["Un plan perfecto"]},
    # --- Televisión ---
    {"archivo": "machos-alfa", "titulo": "Machos Alfa T1/T6", "anio": 2022, "anioTexto": "2022/2026", "orden": 2026, "categoria": "Series", "tipo": "tv", "consultas": ["Machos Alfa"]},
    {"archivo": "el-comisario", "titulo": "El comisario", "anio": 2004, "anioTexto": "2004–2008", "orden": 2008, "categoria": "Series", "tipo": "tv", "consultas": ["El comisario"]},
    {"archivo": "upa-dance", "titulo": "Un paso adelante", "anio": 2002, "categoria": "Series", "tipo": "tv", "consultas": ["Un paso adelante", "UPA Dance"]},
    {"archivo": "el-ministerio-del-tiempo", "titulo": "El Ministerio del Tiempo", "anio": 2015, "categoria": "Series", "tipo": "tv", "consultas": ["El Ministerio del Tiempo"]},
    {"archivo": "vivir-sin-permiso", "titulo": "Vivir sin permiso", "anio": 2018, "categoria": "Series", "tipo": "tv", "consultas": ["Vivir sin permiso"]},
    {"archivo": "la-chica-de-ayer", "titulo": "La chica de ayer", "anio": 2009, "categoria": "Series", "tipo": "tv", "consultas": ["La chica de ayer"]},
    {"archivo": "la-otra-mirada-2", "titulo": "La otra mirada", "anio": 2019, "categoria": "Series", "tipo": "tv", "consultas": ["La otra mirada"], "temporada": 2},
    {"archivo": "brigada-costa-del-sol", "titulo": "Brigada Costa del Sol", "anio": 2019, "categoria": "Series", "tipo": "tv", "consultas": ["Brigada Costa del Sol"]},
    {"archivo": "los-serrano", "titulo": "Los Serrano", "anio": 2003, "categoria": "Series", "tipo": "tv", "consultas": ["Los Serrano"]},
    {"archivo": "seis-hermanas", "titulo": "Seis hermanas", "anio": 2015, "categoria": "Series", "tipo": "tv", "consultas": ["Seis hermanas"]},
    {"archivo": "la-victima-numero-8", "titulo": "La víctima número 8", "anio": 2018, "categoria": "Series", "tipo": "tv", "consultas": ["La víctima número 8"]},
]


def autenticacion():
    clave = os.environ.get("TMDB_API_KEY", "").strip()
    if re.fullmatch(r"[0-9a-f]{32}", clave):
        return {"api_key": clave}, {}
    # token v4 (o el que inyecta el proxy del entorno en la nube)
    return {}, {"Authorization": "Bearer " + (clave or "proxy-injected")}


PARAMS_AUTH, CABECERAS_AUTH = autenticacion()


class ErrorAutenticacion(Exception):
    pass


def api(ruta, **params):
    params.update(PARAMS_AUTH)
    url = API + ruta + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Accept": "application/json", **CABECERAS_AUTH})
    for intento in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 3:
                time.sleep(2 ** intento)
                continue
            if e.code in (401, 403):
                raise ErrorAutenticacion("TMDB rechaza la autenticación (HTTP %d). Revisa TMDB_API_KEY o el token guardado." % e.code)
            if e.code == 404:
                return None
            raise
        except urllib.error.URLError:
            if intento < 3:
                time.sleep(2 ** intento)
                continue
            raise


def normaliza(t):
    t = unicodedata.normalize("NFD", t or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def anio_de(r):
    f = r.get("release_date") or r.get("first_air_date") or ""
    return int(f[:4]) if f[:4].isdigit() else None


def tiene_a_marta(tipo, tmdb_id):
    if tipo == "movie":
        c = api("/movie/%d/credits" % tmdb_id) or {}
        equipo = c.get("crew", [])
    else:
        c = api("/tv/%d/aggregate_credits" % tmdb_id) or {}
        equipo = c.get("crew", [])
    return any(NOMBRE in normaliza(p.get("name")) for p in equipo)


def candidatos(obra):
    vistos, salida = set(), []
    tipo = obra["tipo"]
    for q in obra["consultas"]:
        for params in ({"year" if tipo == "movie" else "first_air_date_year": obra["anio"]}, {}):
            res = api("/search/" + tipo, query=q, language="es-ES", include_adult="false", **params) or {}
            for r in res.get("results", [])[:8]:
                if r["id"] not in vistos:
                    vistos.add(r["id"])
                    salida.append(r)
    return salida


def puntua(obra, r):
    titulos = [normaliza(r.get("title") or r.get("name")), normaliza(r.get("original_title") or r.get("original_name"))]
    consultas = [normaliza(q) for q in obra["consultas"]]
    p = 0
    if any(t in consultas for t in titulos):
        p += 50
    elif any(c and (c in t or t in c) for t in titulos for c in consultas if t):
        p += 20
    a = anio_de(r)
    if a:
        p += max(0, 20 - 5 * abs(a - obra["anio"]))
    if r.get("poster_path"):
        p += 5
    return p


def elige(obra):
    cands = sorted(candidatos(obra), key=lambda r: puntua(obra, r), reverse=True)
    if not cands:
        return None, False
    for r in cands[:6]:                     # el primero con Marta Salas en los créditos
        if tiene_a_marta(obra["tipo"], r["id"]):
            return r, True
    mejor = cands[0]
    return (mejor, False) if puntua(obra, mejor) >= 50 else (None, False)


def descarga_cartel(ruta_poster, base, forzar):
    jpg = os.path.join(DIR_POSTERS, base + ".jpg")
    webp = os.path.join(DIR_POSTERS, base + ".webp")
    if os.path.exists(jpg) and not forzar:
        return True
    req = urllib.request.Request(IMG + ruta_poster, headers={"User-Agent": "descargar-carteles/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        datos = r.read()
    if Image is None:
        open(jpg, "wb").write(datos)
        return True
    im = Image.open(BytesIO(datos)).convert("RGB")
    if im.width > ANCHO_MAX:
        im = im.resize((ANCHO_MAX, round(im.height * ANCHO_MAX / im.width)), Image.LANCZOS)
    im.save(jpg, "JPEG", quality=88, optimize=True, progressive=True)
    im.save(webp, "WEBP", quality=85, method=6)
    return True


def main():
    forzar = "--forzar" in sys.argv
    os.makedirs(DIR_POSTERS, exist_ok=True)
    os.makedirs(os.path.dirname(RUTA_JSON), exist_ok=True)
    previos = {}
    if os.path.exists(RUTA_JSON):
        for p in json.load(open(RUTA_JSON, encoding="utf-8")):
            previos[p["id"]] = p

    proyectos, informe = [], []
    sin_tmdb = None
    for obra in OBRAS:
        base = obra["archivo"]
        r, verificado = None, False
        if sin_tmdb is None:
            try:
                r, verificado = elige(obra)
            except ErrorAutenticacion as e:
                sin_tmdb = str(e)
                print("! " + sin_tmdb + "\n  Se genera el JSON con placeholders; vuelve a ejecutar el script cuando la clave funcione.\n")
        poster_path, sinopsis, tmdb_id = None, "", None
        if r:
            tmdb_id = r["id"]
            poster_path = r.get("poster_path")
            sinopsis = (r.get("overview") or "").strip()
            if obra.get("temporada") and obra["tipo"] == "tv":
                t = api("/tv/%d/season/%d" % (tmdb_id, obra["temporada"]), language="es-ES") or {}
                poster_path = t.get("poster_path") or poster_path
                sinopsis = (t.get("overview") or "").strip() or sinopsis
        ok = os.path.exists(os.path.join(DIR_POSTERS, base + ".jpg")) and not r  # conserva un cartel ya descargado o añadido a mano
        if poster_path:
            try:
                ok = descarga_cartel(poster_path, base, forzar)
            except Exception as e:  # noqa: BLE001
                print("  ! error al descargar %s: %s" % (base, e))
        previo = previos.get(base, {})
        proyectos.append({
            "id": base,
            "titulo": obra["titulo"],
            "anio": obra.get("orden", obra["anio"]),
            "anioTexto": obra.get("anioTexto", ""),
            "categoria": obra["categoria"],
            "poster": "public/posters/%s.jpg" % base if ok else PLACEHOLDER,
            "posterWebp": "public/posters/%s.webp" % base if ok and Image is not None else "",
            "rol": previo.get("rol", ""),
            "sinopsis": sinopsis or previo.get("sinopsis", ""),
            "videoUrl": previo.get("videoUrl", ""),
            "tmdbId": tmdb_id,
            "verificado": verificado,
        })
        estado = "OK" if ok else "PLACEHOLDER"
        detalle = ""
        if r:
            detalle = "→ %s (%s) tmdb:%s%s" % (r.get("title") or r.get("name"), anio_de(r), tmdb_id,
                                             "" if verificado else "  [sin verificar: Marta Salas no figura en sus créditos]")
        informe.append((estado, base, detalle))
        print("%-12s %-28s %s" % (estado, base, detalle))

    json.dump(proyectos, open(RUTA_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("\nJSON: %s (%d obras)" % (os.path.relpath(RUTA_JSON, RAIZ), len(proyectos)))
    faltan = [b for e, b, _ in informe if e != "OK"]
    if faltan:
        print("Añade a mano en public/posters/: " + ", ".join(b + ".jpg" for b in faltan))
    if sin_tmdb:
        sys.exit(1)


if __name__ == "__main__":
    main()
