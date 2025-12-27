import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '../lib/trpc';

/**
 * File d'attente pour gérer la lecture séquentielle des audios
 */
class AudioQueue {
  private queue: string[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private onPlayingChange: (playing: boolean) => void;
  private audioCache: Map<string, string> = new Map();

  constructor(onPlayingChange: (playing: boolean) => void) {
    this.onPlayingChange = onPlayingChange;
  }

  /**
   * Ajouter un audio à la file d'attente
   */
  add(audioUrl: string) {
    this.queue.push(audioUrl);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Ajouter plusieurs audios à la file d'attente
   */
  addMultiple(audioUrls: string[]) {
    this.queue.push(...audioUrls);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Jouer le prochain audio dans la file
   */
  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlayingChange(false);
      return;
    }

    const audioUrl = this.queue.shift()!;
    this.isPlaying = true;
    this.onPlayingChange(true);

    try {
      await this.playAudio(audioUrl);
    } catch (error) {
      console.error('Erreur de lecture audio:', error);
    }

    // Jouer le suivant
    this.playNext();
  }

  /**
   * Jouer un audio
   */
  private playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        resolve();
      };
      
      this.currentAudio.onerror = (error) => {
        reject(error);
      };
      
      this.currentAudio.play().catch(reject);
    });
  }

  /**
   * Arrêter la lecture en cours
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.queue = [];
    this.isPlaying = false;
    this.onPlayingChange(false);
  }

  /**
   * Mettre en pause
   */
  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.isPlaying = false;
      this.onPlayingChange(false);
    }
  }

  /**
   * Reprendre la lecture
   */
  resume() {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play();
      this.isPlaying = true;
      this.onPlayingChange(true);
    }
  }

  /**
   * Vider la file d'attente
   */
  clear() {
    this.queue = [];
  }
}

/**
 * Hook pour la lecture automatique des audios
 * 
 * @param keys - Clés des audios à jouer automatiquement au chargement
 * @param autoPlay - Activer la lecture automatique (par défaut: true)
 * @param delay - Délai avant de jouer (en ms, par défaut: 500ms)
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   const { play, isPlaying, pause, resume } = useAutoPlay(['welcome.home', 'instruction.cash_register']);
 *   
 *   return (
 *     <div>
 *       <button onClick={() => play('button.sell')}>Rejouer</button>
 *       {isPlaying && <div>🔊 Audio en cours...</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAutoPlay(keys: string[], autoPlay = false, delay = 500) {
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef<AudioQueue | null>(null);
  const utils = trpc.useUtils();
  const hasPlayedRef = useRef(false);

  // Récupérer les audios depuis la base de données
  const { data: audios } = trpc.audioLibrary.getByKeys.useQuery(
    { keys },
    { enabled: keys.length > 0 }
  );

  // Initialiser la file d'attente
  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new AudioQueue(setIsPlaying);
    }

    return () => {
      queueRef.current?.stop();
    };
  }, []);

  // Lecture automatique au chargement
  useEffect(() => {
    if (!autoPlay || hasPlayedRef.current || !audios || audios.length === 0) {
      return;
    }

    // Vérifier les préférences utilisateur
    const audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
    if (!audioEnabled) {
      return;
    }

    const timer = setTimeout(() => {
      const audioUrls = audios
        .filter(a => a.audioUrl)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
        .map(a => a.audioUrl!);

      if (audioUrls.length > 0) {
        queueRef.current?.addMultiple(audioUrls);
        hasPlayedRef.current = true;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [audios, autoPlay, delay]);

  /**
   * Jouer un ou plusieurs audios manuellement
   */
  const play = useCallback(async (keyOrKeys: string | string[]) => {
    const keysToPlay = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    
    // Récupérer les audios
    const response = await utils.audioLibrary.getByKeys.fetch({ keys: keysToPlay });
    
    const audioUrls = response
      .filter((a: any) => a.audioUrl)
      .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))
      .map((a: any) => a.audioUrl!);

    if (audioUrls.length > 0) {
      queueRef.current?.addMultiple(audioUrls);
    }
  }, [utils]);

  /**
   * Mettre en pause
   */
  const pause = useCallback(() => {
    queueRef.current?.pause();
  }, []);

  /**
   * Reprendre
   */
  const resume = useCallback(() => {
    queueRef.current?.resume();
  }, []);

  /**
   * Arrêter
   */
  const stop = useCallback(() => {
    queueRef.current?.stop();
  }, []);

  /**
   * Vider la file d'attente
   */
  const clear = useCallback(() => {
    queueRef.current?.clear();
  }, []);

  return {
    play,
    pause,
    resume,
    stop,
    clear,
    isPlaying,
  };
}

/**
 * Hook simplifié pour jouer un seul audio au clic
 */
export function useAudioClick(key: string) {
  const { play } = useAutoPlay([], false);

  const playAudio = useCallback(() => {
    const audioEnabled = localStorage.getItem('audioEnabled') !== 'false';
    if (audioEnabled) {
      play(key);
    }
  }, [key, play]);

  return playAudio;
}
