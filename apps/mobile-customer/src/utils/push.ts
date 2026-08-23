import { apiFetch } from '../api/client';

// Standard VAPID-key boilerplate: the browser's Push API wants the
// application server key as a raw Uint8Array, not the base64url string
// the backend hands out.
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Called once, right after checkout places an order - respects "ask at
// the point of value" rather than prompting for notification permission
// before the guest has done anything. Silently no-ops on unsupported
// browsers or a declined permission prompt - the WebSocket-driven
// tracking screen keeps working either way, push is purely additive.
export async function subscribeToOrderPush(orderId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const { publicKey } = await apiFetch<{ publicKey: string }>('/notifications/vapid-public-key');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await apiFetch('/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ orderId, endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }),
    });
  } catch {
    // Best-effort - a push subscription failure should never block or
    // interrupt the ordering flow itself.
  }
}
