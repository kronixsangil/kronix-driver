//public\sw.js
const CACHE_NAME = "kronix-driver-shell-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  return;
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      const visibleClients = clientsArr.filter((client) => {
        return client.visibilityState === "visible";
      });

      if (visibleClients.length > 0) {
        visibleClients.forEach((client) => {
          client.postMessage({
            type: "KRONIX_DRIVER_PUSH_FOREGROUND",
            payload: data,
          });
        });

        return;
      }

      const title = data.title || "KroniX Driver";
      const body = data.body || "Tienes una nueva actualización.";
      const url = data.url || "/";
      const tag = data.tag || "kronix-driver";

      return self.registration.showNotification(title, {
        body,
        tag,
        renotify: true,
        requireInteraction: true,
        icon: "/kronix-icon.png",
        badge: "/kronix-icon.png",
        data: {
          url,
          sound: data.sound || "driver-default",
          ts: data.ts || Date.now(),
        },
      });
    })
  );
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