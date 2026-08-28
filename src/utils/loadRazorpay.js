/**
 * Dynamically loads the Razorpay checkout script on-demand.
 * Call this right before opening the Razorpay modal so that the
 * script is never part of the initial page load.
 *
 * Returns a Promise that resolves to true when the script is ready,
 * or false if loading fails.
 */
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let loadPromise = null;

export function loadRazorpay() {
  // Already loaded — resolve immediately
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  // Already in-flight — reuse the same promise
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      loadPromise = null; // allow retry on next call
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}
