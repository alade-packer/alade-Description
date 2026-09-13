/* Service Worker · 缓存游戏文件，支持离线 */
var CACHE_NAME = 'alade-v1';
var FILES = [
    'index.html',
    'style.css',
    'game.js',
    'bgm.js',
    'settings.js',
    'img/hero.jpg',
    'img/town.jpg',
    'img/goblin.jpg',
    'img/bull.jpg'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(FILES).catch(function (err) {
                console.warn('部分文件缓存失败:', err);
            });
        })
    );
});

self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});