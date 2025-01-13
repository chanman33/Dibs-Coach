/*! coi-serviceworker v0.1.6 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener('fetch', function (event) {
        if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return;
        }

        event.respondWith(
            fetch(event.request, {
                mode: 'cors',
                credentials: coepCredentialless ? 'omit' : 'same-origin'
            }).catch(error => {
                console.error('Fetch error:', error);
                throw error;
            })
        );
    });
} else {
    (() => {
        // You can customize the behavior by setting these variables before loading this script
        if (typeof window.CoiConfig === 'object') {
            if (typeof window.CoiConfig.coepCredentialless === 'boolean') coepCredentialless = window.CoiConfig.coepCredentialless;
        }

        const registerCoiServiceWorker = async () => {
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.log('Service workers require HTTPS (or localhost)');
                return;
            }

            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('/coi-serviceworker.js');
                } catch (error) {
                    console.error('Service worker registration failed:', error);
                }
            }
        };

        registerCoiServiceWorker();
    })();
} 