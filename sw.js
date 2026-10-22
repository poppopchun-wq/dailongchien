var GHPATH = '/dailongchien';
var APP_PREFIX = 'dailongchien_';
var VERSION = 'version_01'; // Tăng lên version_02, version_03... mỗi khi sửa game
var URLS = [
  GHPATH + '/',
  GHPATH + '/index.html',
  GHPATH + '/manifest.json',
  GHPATH + '/icon.png'
];

var CACHE_NAME = APP_PREFIX + VERSION;

// Cài đặt: tải và lưu các file vào máy
self.addEventListener('install', function(e) {
  console.log('[SW] Cài đặt ' + CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    }).then(function() { return self.skipWaiting(); })
  );
});

// Kích hoạt: xóa cache cũ nếu có version mới
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

// Đánh chặn request: ưu tiên lấy từ cache → không có thì lên mạng
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // bỏ qua cross-origin

  e.respondWith(
    caches.match(e.request).then(function(res) {
      if (res) return res; // có trong cache → trả về (chơi offline)
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