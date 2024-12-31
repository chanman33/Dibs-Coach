declare global {
  interface Window {
    Calendly?: any;
  }
}

export const loadCalendlyScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.Calendly) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    
    script.onload = () => {
      console.log('[CALENDLY] Script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('[CALENDLY_ERROR] Failed to load script:', error);
      reject(new Error('Failed to load Calendly widget'));
    };
    
    document.body.appendChild(script);
  });
}; 