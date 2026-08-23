/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Same pattern as the Table PWA's custom service worker - see its sw.ts
// for the full rationale on switching from generateSW to injectManifest.
precacheAndRoute(self.__WB_MANIFEST);

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
