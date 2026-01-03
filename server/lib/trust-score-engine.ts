/**
 * TrustScore Engine - PNAVIM Architecture Layer 3
 *
 * Calculates trust scores based on multiple contextual factors:
 * - Device recognition (30%)
 * - Social proof (40%)
 * - Location context (15%)
 * - Time patterns (10%)
 * - Historical behavior (5%)
 *
 * Score ranges and actions:
 * - 70-100: Immediate access ✅
 * - 40-69: Additional challenge ⚠️
 * - 0-39: Agent validation required 🔒
 */

interface DeviceContext {
  fingerprint: string;
  isKnown: boolean;
  timesSeenBefore: number;
  lastSeenDaysAgo?: number;
}

interface SocialContext {
  answerProvided: boolean;
  answerCorrect: boolean;
  attemptNumber: number;
  questionDifficulty: 1 | 2 | 3;
}

interface LocationContext {
  currentLatitude?: number;
  currentLongitude?: number;
  usualLatitude?: number;
  usualLongitude?: number;
  distanceFromUsualKm?: number;
}

interface TimeContext {
  currentHour: number;
  currentDayOfWeek: number;
  usualLoginHours?: number[];
  isUsualTime: boolean;
}

interface HistoryContext {
  totalSuccessfulLogins: number;
  incidentsLast30Days: number;
  consecutiveFailures: number;
  accountAgeDays: number;
}

interface AnomalyContext {
  isNewDevice: boolean;
  isVpnDetected: boolean;
  isNightTime: boolean;
  isFarFromUsual: boolean;
  hasRecentFailures: boolean;
}

interface TrustScoreComponents {
  deviceScore: number;
  socialScore: number;
  locationScore: number;
  timeScore: number;
  historyScore: number;
  penalties: number;
  totalScore: number;
}

interface TrustScoreResult extends TrustScoreComponents {
  decision: 'allow' | 'challenge' | 'validate';
  confidence: 'high' | 'medium' | 'low';
  riskFlags: string[];
  recommendedAction: string;
  context: {
    device: DeviceContext;
    social?: SocialContext;
    location: LocationContext;
    time: TimeContext;
    history: HistoryContext;
    anomalies: AnomalyContext;
  };
}

/**
 * Weights for each scoring component
 * Total must equal 1.0 for proper normalization
 */
const SCORE_WEIGHTS = {
  device: 0.30,
  social: 0.40,
  location: 0.15,
  time: 0.10,
  history: 0.05,
} as const;

/**
 * Score thresholds for decision making
 */
const THRESHOLDS = {
  immediate: 70,
  challenge: 40,
  maxScore: 100,
} as const;

/**
 * Penalty values for various risk factors
 */
const PENALTIES = {
  newDeviceNeverSeen: 20,
  farFromUsualLocation: 15,
  nightTimeAccess: 10,
  recentFailedAttempt: 10,
  vpnProxyDetected: 25,
  multipleDevicesRecent: 8,
  unusualHour: 5,
} as const;

/**
 * Maximum distances and time windows
 */
const THRESHOLDS_CONTEXT = {
  closeLocationMeters: 100,
  nearLocationMeters: 1000,
  farLocationMeters: 5000,
  usualTimeWindowHours: 2,
  nightStartHour: 22,
  nightEndHour: 5,
  recentFailureHours: 24,
} as const;

export class TrustScoreEngine {
  /**
   * Calculate device recognition score (0-30 points)
   */
  private static calculateDeviceScore(device: DeviceContext): number {
    if (!device.isKnown) {
      return 0;
    }

    if (device.timesSeenBefore >= 10) {
      return 30;
    }

    if (device.timesSeenBefore >= 4) {
      return 20;
    }

    if (device.timesSeenBefore >= 1) {
      return 10;
    }

    return 0;
  }

  /**
   * Calculate social proof score (0-40 points)
   */
  private static calculateSocialScore(social?: SocialContext): number {
    if (!social || !social.answerProvided) {
      return 0;
    }

    if (!social.answerCorrect) {
      return 0;
    }

    if (social.attemptNumber === 1) {
      return 40;
    }

    if (social.attemptNumber === 2) {
      return 25;
    }

    if (social.attemptNumber === 3) {
      return 15;
    }

    return 0;
  }

  /**
   * Calculate location context score (0-15 points)
   */
  private static calculateLocationScore(location: LocationContext): number {
    if (
      !location.currentLatitude ||
      !location.currentLongitude ||
      !location.usualLatitude ||
      !location.usualLongitude
    ) {
      return 5;
    }

    const distance = location.distanceFromUsualKm ?? this.calculateDistance(
      location.currentLatitude,
      location.currentLongitude,
      location.usualLatitude,
      location.usualLongitude
    );

    if (distance < THRESHOLDS_CONTEXT.closeLocationMeters / 1000) {
      return 15;
    }

    if (distance < THRESHOLDS_CONTEXT.nearLocationMeters / 1000) {
      return 10;
    }

    if (distance < THRESHOLDS_CONTEXT.farLocationMeters / 1000) {
      return 5;
    }

    return 0;
  }

  /**
   * Calculate time pattern score (0-10 points)
   */
  private static calculateTimeScore(time: TimeContext): number {
    if (time.isUsualTime) {
      return 10;
    }

    const currentHour = time.currentHour;
    const isDayTime = currentHour >= 6 && currentHour <= 20;

    if (isDayTime) {
      return 5;
    }

    return 0;
  }

  /**
   * Calculate history score (0-5 points)
   */
  private static calculateHistoryScore(history: HistoryContext): number {
    if (history.incidentsLast30Days === 0 && history.accountAgeDays > 30) {
      return 5;
    }

    if (history.incidentsLast30Days === 1) {
      return 2;
    }

    return 0;
  }

  /**
   * Calculate penalties based on anomalies
   */
  private static calculatePenalties(anomalies: AnomalyContext): number {
    let totalPenalties = 0;

    if (anomalies.isNewDevice) {
      totalPenalties += PENALTIES.newDeviceNeverSeen;
    }

    if (anomalies.isFarFromUsual) {
      totalPenalties += PENALTIES.farFromUsualLocation;
    }

    if (anomalies.isNightTime) {
      totalPenalties += PENALTIES.nightTimeAccess;
    }

    if (anomalies.hasRecentFailures) {
      totalPenalties += PENALTIES.recentFailedAttempt;
    }

    if (anomalies.isVpnDetected) {
      totalPenalties += PENALTIES.vpnProxyDetected;
    }

    return totalPenalties;
  }

  /**
   * Detect anomalies in the authentication context
   */
  private static detectAnomalies(
    device: DeviceContext,
    location: LocationContext,
    time: TimeContext,
    history: HistoryContext,
    isVpnDetected: boolean
  ): AnomalyContext {
    const isNewDevice = !device.isKnown || device.timesSeenBefore === 0;

    const isFarFromUsual =
      location.distanceFromUsualKm !== undefined &&
      location.distanceFromUsualKm > THRESHOLDS_CONTEXT.farLocationMeters / 1000;

    const isNightTime =
      time.currentHour >= THRESHOLDS_CONTEXT.nightStartHour ||
      time.currentHour <= THRESHOLDS_CONTEXT.nightEndHour;

    const hasRecentFailures = history.consecutiveFailures > 0;

    return {
      isNewDevice,
      isVpnDetected,
      isNightTime,
      isFarFromUsual,
      hasRecentFailures,
    };
  }

  /**
   * Determine decision and confidence based on score
   */
  private static makeDecision(score: number): {
    decision: 'allow' | 'challenge' | 'validate';
    confidence: 'high' | 'medium' | 'low';
    recommendedAction: string;
  } {
    if (score >= THRESHOLDS.immediate) {
      return {
        decision: 'allow',
        confidence: score >= 85 ? 'high' : 'medium',
        recommendedAction: 'Autoriser l\'accès immédiat',
      };
    }

    if (score >= THRESHOLDS.challenge) {
      return {
        decision: 'challenge',
        confidence: 'medium',
        recommendedAction: 'Poser une question de sécurité supplémentaire',
      };
    }

    return {
      decision: 'validate',
      confidence: 'low',
      recommendedAction: 'Validation par agent ou coopérative requise',
    };
  }

  /**
   * Generate risk flags based on context
   */
  private static generateRiskFlags(
    anomalies: AnomalyContext,
    score: number
  ): string[] {
    const flags: string[] = [];

    if (anomalies.isNewDevice) {
      flags.push('NEW_DEVICE');
    }

    if (anomalies.isVpnDetected) {
      flags.push('VPN_DETECTED');
    }

    if (anomalies.isNightTime) {
      flags.push('UNUSUAL_TIME');
    }

    if (anomalies.isFarFromUsual) {
      flags.push('UNUSUAL_LOCATION');
    }

    if (anomalies.hasRecentFailures) {
      flags.push('RECENT_FAILURES');
    }

    if (score < THRESHOLDS.challenge) {
      flags.push('LOW_TRUST_SCORE');
    }

    return flags;
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Main calculation method
   * Combines all scoring components with weights and penalties
   */
  public static calculate(context: {
    device: DeviceContext;
    social?: SocialContext;
    location: LocationContext;
    time: TimeContext;
    history: HistoryContext;
    isVpnDetected?: boolean;
  }): TrustScoreResult {
    const deviceScore = this.calculateDeviceScore(context.device);
    const socialScore = this.calculateSocialScore(context.social);
    const locationScore = this.calculateLocationScore(context.location);
    const timeScore = this.calculateTimeScore(context.time);
    const historyScore = this.calculateHistoryScore(context.history);

    const anomalies = this.detectAnomalies(
      context.device,
      context.location,
      context.time,
      context.history,
      context.isVpnDetected ?? false
    );

    const penalties = this.calculatePenalties(anomalies);

    const rawTotal =
      deviceScore + socialScore + locationScore + timeScore + historyScore - penalties;

    const totalScore = Math.max(0, Math.min(THRESHOLDS.maxScore, Math.round(rawTotal)));

    const { decision, confidence, recommendedAction } = this.makeDecision(totalScore);

    const riskFlags = this.generateRiskFlags(anomalies, totalScore);

    return {
      deviceScore,
      socialScore,
      locationScore,
      timeScore,
      historyScore,
      penalties,
      totalScore,
      decision,
      confidence,
      riskFlags,
      recommendedAction,
      context: {
        device: context.device,
        social: context.social,
        location: context.location,
        time: context.time,
        history: context.history,
        anomalies,
      },
    };
  }

  /**
   * Simplified calculation for quick checks
   * Uses only device and location when social proof not yet provided
   */
  public static quickCheck(
    deviceFingerprint: string,
    isKnownDevice: boolean,
    latitude?: number,
    longitude?: number
  ): { score: number; decision: 'allow' | 'challenge' | 'validate' } {
    const now = new Date();
    const result = this.calculate({
      device: {
        fingerprint: deviceFingerprint,
        isKnown: isKnownDevice,
        timesSeenBefore: isKnownDevice ? 5 : 0,
      },
      location: {
        currentLatitude: latitude,
        currentLongitude: longitude,
      },
      time: {
        currentHour: now.getHours(),
        currentDayOfWeek: now.getDay(),
        isUsualTime: true,
      },
      history: {
        totalSuccessfulLogins: 10,
        incidentsLast30Days: 0,
        consecutiveFailures: 0,
        accountAgeDays: 60,
      },
    });

    return {
      score: result.totalScore,
      decision: result.decision,
    };
  }
}

export type {
  DeviceContext,
  SocialContext,
  LocationContext,
  TimeContext,
  HistoryContext,
  AnomalyContext,
  TrustScoreComponents,
  TrustScoreResult,
};
