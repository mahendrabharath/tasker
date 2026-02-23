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
