/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// The app-shell precaching vite-plugin-pwa's generateSW mode used to do
// automatically - injectManifest mode needs this one line to keep the
// same offline-shell behavior, everything else below is new.
precacheAndRoute(self.__WB_MANIFEST);

// Push only ever covers "your order status changed" while this tab isn't
// in the foreground - see NotificationsService on the backend for what
// triggers a push and why a missed one is never a real information loss
// (the same status is always also live over the WebSocket connection
// while the app is open).
self.addEventListener('push', (event: PushEvent) => {
  let payload: { title?: string; body?: string } = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { title: 'Order update', body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Order update', {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
