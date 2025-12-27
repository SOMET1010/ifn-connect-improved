/**
 * Hook pour le feedback sensoriel (vibrations + sons)
 * Améliore l'expérience tactile sur mobile
 */

export function useSensoryFeedback() {
  /**
   * Déclenche une vibration haptique
   * @param pattern - 'success' (double pulse) ou 'error' (triple pulse)
   */
  const vibrate = (pattern: 'success' | 'error') => {
    if (!navigator.vibrate) return;
    
    if (pattern === 'success') {
      // Double pulse rapide pour succès
      navigator.vibrate([50, 50, 50]);
    } else {
      // Triple pulse plus long pour erreur
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  };

  /**
   * Joue un son de feedback
   * @param type - 'success' (800Hz) ou 'error' (200Hz)
   */
  const playSound = (type: 'success' | 'error') => {
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
  };

  /**
   * Feedback complet pour succès (vibration + son)
   */
  const triggerSuccess = () => {
    vibrate('success');
    playSound('success');
  };

  /**
   * Feedback complet pour erreur (vibration + son)
   */
  const triggerError = () => {
    vibrate('error');
    playSound('error');
  };

  return {
    triggerSuccess,
    triggerError,
    vibrate,
    playSound,
  };
}
