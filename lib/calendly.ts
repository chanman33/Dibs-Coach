declare global {
  interface Window {
    Calendly?: any;
  }
}

export const loadCalendlyScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Calendly) {
      resolve(window.Calendly);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => resolve(window.Calendly);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}; 