/* Service worker del Registro Emocional.

   Todas las rutas son relativas a propósito: en GitHub Pages el sitio se
   sirve bajo /Tecno_LAB/ y no en la raíz del dominio, así que cualquier
   ruta que empiece con "/" apuntaría al lugar equivocado.

   Estrategia:
   - Navegación (el HTML): primero la red, y si no hay conexión se usa la
     copia guardada. Así una versión nueva se ve apenas se publica.
   - Resto de los archivos: se responde al instante con la copia guardada
     y en paralelo se baja la versión fresca para la próxima visita.

   VERSION se usa para nombrar la caché: al cambiarla se descartan las
   cachés viejas. Conviene subirla en cada publicación, aunque olvidarse
   no rompe nada porque los archivos igual se refrescan en segundo plano.
*/

const VERSION = "v1";
const CACHE = `registro-emocional-${VERSION}`;

const RECURSOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/script.js",
  "./js/jspdf.umd.min.js",
  "./img/favicon.png",
  "./img/icono-circular.png",
  "./img/icono-512.png",
  "./img/icono-maskable-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(RECURSOS)),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves.filter((clave) => clave !== CACHE).map((clave) => caches.delete(clave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// La página avisa cuando la persona aceptó pasar a la versión nueva.
self.addEventListener("message", (evento) => {
  if (evento.data === "activar-ahora") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;

  if (pedido.method !== "GET") {
    return;
  }

  // Nunca se intercepta otro origen.
  if (new URL(pedido.url).origin !== self.location.origin) {
    return;
  }

  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copia));
          return respuesta;
        })
        .catch(() =>
          caches
            .match("./index.html")
            .then((guardada) => guardada || caches.match("./")),
        ),
    );
    return;
  }

  evento.respondWith(
    caches.match(pedido).then((guardada) => {
      const desdeLaRed = fetch(pedido)
        .then((respuesta) => {
          if (respuesta && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((cache) => cache.put(pedido, copia));
          }
          return respuesta;
        })
        .catch(() => guardada);

      return guardada || desdeLaRed;
    }),
  );
});
