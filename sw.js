const CACHE_NAME = 'viridi-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  // Non chiamiamo più self.skipWaiting() qui: la nuova versione resta "in attesa"
  // finché non è l'utente (tramite il banner "Nuova versione disponibile") a
  // confermare di voler aggiornare. Così non si rischia di cambiare l'app sotto
  // le mani di qualcuno che la sta usando in quel momento.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Permette alla pagina di dire "ok, attiva subito la nuova versione" quando
// l'utente preme il bottone nel banner di aggiornamento.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Le chiamate alle funzioni (segnalazioni, like, commenti...) non vanno mai
  // messe in cache: devono sempre arrivare fresche dal server.
  if (url.pathname.startsWith('/.netlify/functions/')) return;
  if (event.request.method !== 'GET') return;

  // Strategia "prima la rete": proviamo sempre a scaricare la versione più
  // recente. Solo se la rete non risponde (offline, o connessione assente)
  // usiamo la copia salvata in cache come riserva. Questo garantisce che,
  // quando sei online, vedi sempre l'ultima versione pubblicata — mai una
  // versione vecchia rimasta bloccata in cache.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
