//public\sw.js
const CACHE_NAME = "kronix-driver-shell-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  return;
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "KroniX Driver";
  const body = data.body || "Tienes una nueva actualización.";
  const url = data.url || "/";
  const tag = data.tag || "kronix-driver";
  const sound = data.sound || "driver-default";

  const options = {
    body,
    tag,
    renotify: true,
    requireInteraction: true,
    icon: "/kronix-icon.png",
    badge: "/kronix-icon.png",
    data: {
      url,
      sound,
      ts: data.ts || Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(urlToOpen);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});