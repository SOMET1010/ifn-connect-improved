/**
 * Système de feedback sensoriel MGX
 * Vibrations haptiques + Sons pour confirmer les actions
 */

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

/**
 * Patterns de vibration selon le type de feedback
 */
const VIBRATION_PATTERNS: Record<FeedbackType, number[]> = {
  success: [100, 50, 100], // Double vibration courte
  error: [200, 100, 200, 100, 200], // Triple vibration longue
  warning: [150, 75, 150], // Double vibration moyenne
  info: [100], // Vibration simple
};

/**
 * Fréquences sonores selon le type de feedback
 */
const SOUND_FREQUENCIES: Record<FeedbackType, number> = {
  success: 800, // Hz - Son aigu pour succès
  error: 200, // Hz - Son grave pour erreur
  warning: 500, // Hz - Son moyen pour avertissement
  info: 400, // Hz - Son neutre pour info
};

/**
 * Durées des sons en millisecondes
 */
const SOUND_DURATIONS: Record<FeedbackType, number> = {
  success: 150,
  error: 300,
  warning: 200,
  info: 100,
};

/**
 * Joue une vibration haptique si supporté par l'appareil
 */
export function playVibration(type: FeedbackType): void {
  if ('vibrate' in navigator) {
    const pattern = VIBRATION_PATTERNS[type];
    navigator.vibrate(pattern);
  }
}

/**
 * Joue un son de feedback en utilisant l'API Web Audio
 */
export function playSound(type: FeedbackType): void {
  try {
    // Créer le contexte audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Créer l'oscillateur (générateur de son)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configurer la fréquence et le type d'onde
    oscillator.frequency.value = SOUND_FREQUENCIES[type];
    oscillator.type = 'sine'; // Onde sinusoïdale pour un son doux
    
    // Configurer le volume (fade out pour éviter les clics)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + SOUND_DURATIONS[type] / 1000
    );
    
    // Connecter les nœuds
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Jouer le son
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + SOUND_DURATIONS[type] / 1000);
    
    // Nettoyer après la lecture
    setTimeout(() => {
      audioContext.close();
    }, SOUND_DURATIONS[type] + 100);
  } catch (error) {
    console.warn('Impossible de jouer le son:', error);
  }
}

/**
 * Joue un feedback complet (vibration + son)
 */
export function playSensoryFeedback(type: FeedbackType): void {
  playVibration(type);
  playSound(type);
}

/**
 * Hook React pour utiliser le feedback sensoriel
 */
export function useSensoryFeedback() {
  const feedback = (type: FeedbackType) => {
    playSensoryFeedback(type);
  };
  
  return {
    success: () => feedback('success'),
    error: () => feedback('error'),
    warning: () => feedback('warning'),
    info: () => feedback('info'),
    feedback,
  };
}
