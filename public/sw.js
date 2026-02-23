self.addEventListener("install", (event) => {
  const cacheName = "tasker-static-v1";
  const offlineUrl = "/offline.html";
  const precache = ["/", "/app", offlineUrl, "/favicon.ico", "/manifest.json"];

  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(precache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const cacheName = "tasker-static-v1";
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((key) => (key === cacheName ? null : caches.delete(key))))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    const destination = event.request.destination;
    if (["style", "script", "image", "font"].includes(destination)) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            const responseClone = response.clone();
            caches.open("tasker-static-v1").then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
        })
      );
    }
  }
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Task reminder";
  const options = {
    body: data.body || "You have a task due soon.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: data.url || "/app",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
