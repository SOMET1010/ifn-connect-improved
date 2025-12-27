/**
 * Wrapper de toast avec feedback sensoriel automatique
 * Ajoute vibrations + sons sur tous les toasts success/error
 */

import { toast as sonnerToast } from 'sonner';

/**
 * Déclenche une vibration haptique
 */
function vibrate(pattern: 'success' | 'error') {
  if (!navigator.vibrate) return;
  
  if (pattern === 'success') {
    // Double pulse rapide pour succès
    navigator.vibrate([50, 50, 50]);
  } else {
    // Triple pulse plus long pour erreur
    navigator.vibrate([100, 50, 100, 50, 100]);
  }
}

/**
 * Joue un son de feedback
 */
function playSound(type: 'success' | 'error') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Fréquence selon le type
    oscillator.frequency.value = type === 'success' ? 800 : 200;
    oscillator.type = 'sine';

    // Volume et durée
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('Audio feedback non supporté:', error);
  }
}

/**
 * Toast avec feedback sensoriel automatique
 */
export const toast = {
  success: (message: string, options?: any) => {
    vibrate('success');
    playSound('success');
    return sonnerToast.success(message, options);
  },
  
  error: (message: string, options?: any) => {
    vibrate('error');
    playSound('error');
    return sonnerToast.error(message, options);
  },
  
  // Les autres méthodes sans feedback sensoriel
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  message: sonnerToast.message,
  dismiss: sonnerToast.dismiss,
};
