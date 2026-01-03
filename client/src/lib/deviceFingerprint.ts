/**
 * Device Fingerprinting Utility
 *
 * Generates a unique identifier for the user's device based on:
 * - Browser characteristics (user agent, languages, timezone)
 * - Hardware capabilities (screen, canvas, WebGL)
 * - Software features (plugins, fonts, audio context)
 *
 * This fingerprint is used as a trust factor in the PNAVIM authentication system.
 * It helps identify returning users without relying on cookies or local storage alone.
 *
 * Privacy Note: This is a client-side identifier only. No persistent tracking.
 * Used solely for security and fraud prevention within the IFN Connect app.
 */

interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  userAgent: string;
  browserInfo: {
    name: string;
    version: string;
    platform: string;
    language: string;
    languages: string[];
    timezone: string;
    screenResolution: string;
    colorDepth: number;
    pixelRatio: number;
    hardwareConcurrency: number;
    deviceMemory?: number;
    cookieEnabled: boolean;
    doNotTrack: string | null;
  };
}

export class DeviceFingerprint {
  private static cachedFingerprint: string | null = null;
  private static cachedDeviceInfo: DeviceInfo | null = null;

  /**
   * Generate a device fingerprint hash
   */
  public static async generate(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    const components = await this.collectComponents();
    const fingerprintString = JSON.stringify(components);

    const fingerprint = await this.hashString(fingerprintString);

    this.cachedFingerprint = fingerprint;

    return fingerprint;
  }

  /**
   * Get detailed device information including fingerprint
   */
  public static async getDeviceInfo(): Promise<DeviceInfo> {
    if (this.cachedDeviceInfo) {
      return this.cachedDeviceInfo;
    }

    const fingerprint = await this.generate();
    const browserInfo = this.getBrowserInfo();

    const deviceInfo: DeviceInfo = {
      fingerprint,
      deviceName: this.getDeviceName(),
      userAgent: navigator.userAgent,
      browserInfo,
    };

    this.cachedDeviceInfo = deviceInfo;

    return deviceInfo;
  }

  /**
   * Collect all fingerprinting components
   */
  private static async collectComponents(): Promise<Record<string, any>> {
    const components: Record<string, any> = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || null,
      screenResolution: `${screen.width}x${screen.height}`,
      screenAvailableResolution: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    };

    const canvasFingerprint = await this.getCanvasFingerprint();
    if (canvasFingerprint) {
      components.canvas = canvasFingerprint;
    }

    const webglFingerprint = this.getWebGLFingerprint();
    if (webglFingerprint) {
      components.webgl = webglFingerprint;
    }

    const audioFingerprint = await this.getAudioFingerprint();
    if (audioFingerprint) {
      components.audio = audioFingerprint;
    }

    const fonts = this.detectFonts();
    if (fonts.length > 0) {
      components.fonts = fonts.join(',');
    }

    return components;
  }

  /**
   * Generate Canvas fingerprint
   */
  private static async getCanvasFingerprint(): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('IFN Connect 🇨🇮', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device ID', 4, 17);

      const dataUrl = canvas.toDataURL();
      return await this.hashString(dataUrl);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate WebGL fingerprint
   */
  private static getWebGLFingerprint(): string | null {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return null;

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;

      const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      return `${vendor}|${renderer}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate Audio Context fingerprint
   */
  private static async getAudioFingerprint(): Promise<string | null> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return null;

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const output = event.outputBuffer.getChannelData(0);
          const hash = Array.from(output.slice(0, 30))
            .map((v) => Math.abs(v))
            .reduce((a, b) => a + b, 0)
            .toString();

          oscillator.stop();
          scriptProcessor.disconnect();
          gainNode.disconnect();
          analyser.disconnect();
          oscillator.disconnect();

          context.close();

          resolve(hash);
        };
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect installed fonts
   */
  private static detectFonts(): string[] {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial',
      'Verdana',
      'Courier New',
      'Georgia',
      'Times New Roman',
      'Trebuchet MS',
      'Comic Sans MS',
      'Impact',
    ];

    const detected: string[] = [];

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return detected;

    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const baselines: Record<string, number> = {};
    for (const baseFont of baseFonts) {
      context.font = `${testSize} ${baseFont}`;
      baselines[baseFont] = context.measureText(testString).width;
    }

    for (const font of testFonts) {
      let isDetected = false;

      for (const baseFont of baseFonts) {
        context.font = `${testSize} '${font}', ${baseFont}`;
        const width = context.measureText(testString).width;

        if (width !== baselines[baseFont]) {
          isDetected = true;
          break;
        }
      }

      if (isDetected) {
        detected.push(font);
      }
    }

    return detected;
  }

  /**
   * Get browser information
   */
  private static getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || null,
    };
  }

  /**
   * Generate device name for display
   */
  private static getDeviceName(): string {
    const ua = navigator.userAgent;

    if (/Android/.test(ua)) {
      const match = ua.match(/Android\s([\d.]+)/);
      return `Android ${match?.[1] || ''}`;
    }

    if (/iPhone/.test(ua)) {
      return 'iPhone';
    }

    if (/iPad/.test(ua)) {
      return 'iPad';
    }

    if (/Windows/.test(ua)) {
      return 'Windows PC';
    }

    if (/Macintosh/.test(ua)) {
      return 'Mac';
    }

    if (/Linux/.test(ua)) {
      return 'Linux';
    }

    return 'Appareil Inconnu';
  }

  /**
   * Hash a string using SubtleCrypto API
   */
  private static async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Clear cached fingerprint (useful for testing)
   */
  public static clearCache(): void {
    this.cachedFingerprint = null;
    this.cachedDeviceInfo = null;
  }

  /**
   * Get or create persistent device ID from localStorage
   * Falls back to fingerprint if localStorage unavailable
   */
  public static async getPersistentId(): Promise<string> {
    const STORAGE_KEY = 'ifn_device_id';

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return stored;
      }

      const fingerprint = await this.generate();
      localStorage.setItem(STORAGE_KEY, fingerprint);

      return fingerprint;
    } catch (error) {
      return await this.generate();
    }
  }
}

export type { DeviceInfo };
