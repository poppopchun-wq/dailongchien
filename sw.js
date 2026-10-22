var GHPATH = '/-I-LONG-CHI-N';
var APP_PREFIX = 'dailongchien_';
var VERSION = 'version_02'; 
var URLS = [
  GHPATH + '/',
  GHPATH + '/index.html',
  GHPATH + '/manifest.json',
  GHPATH + '/icon.png'
];

var CACHE_NAME = APP_PREFIX + VERSION;

self.addEventListener('install', function(e) {
  console.log('[SW] Cài đặt ' + CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[SW] Kích hoạt ' + CACHE_NAME);
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME && key.indexOf(APP_PREFIX) === 0) {
            console.log('[SW] Xóa cache cũ: ' + key);
            return caches.delete(key);
          }
        })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(res) {
      if (res) return res;
      return fetch(e.request).then(function(networkRes) {
        if (networkRes && networkRes.status === 200) {
          var clone = networkRes.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return networkRes;
      }).catch(function() {
        if (e.request.mode === 'navigate') {
          return caches.match(GHPATH + '/index.html');
        }
      });
    })
  );
});