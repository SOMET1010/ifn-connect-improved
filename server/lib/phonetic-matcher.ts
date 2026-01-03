/**
 * Phonetic Matching Utility for Social Authentication
 *
 * Handles fuzzy matching of voice-transcribed answers to account for:
 * - Pronunciation variations
 * - Transcription errors (STT inaccuracies)
 * - Accent differences
 * - Background noise artifacts
 *
 * Uses three-level validation:
 * 1. Exact normalized match (fastest)
 * 2. Phonetic similarity (Soundex for French)
 * 3. String distance (Levenshtein with threshold)
 */

import crypto from 'crypto';

interface MatchResult {
  isMatch: boolean;
  matchMethod: 'exact' | 'phonetic' | 'fuzzy' | 'none';
  similarity: number;
  normalizedInput: string;
  normalizedStored: string;
}

export class PhoneticMatcher {
  private static readonly SIMILARITY_THRESHOLD = 0.85;
  private static readonly MAX_LEVENSHTEIN_DISTANCE = 3;

  /**
   * Normalize text for comparison
   * Removes accents, special chars, extra spaces, converts to lowercase
   */
  public static normalize(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * French Soundex algorithm
   * Adapted for French pronunciation patterns
   */
  public static frenchSoundex(word: string): string {
    if (!word) return '';

    let normalized = word.toLowerCase().trim();

    const replacements: [RegExp, string][] = [
      [/[aeiouy]+/g, 'a'],
      [/ph/g, 'f'],
      [/ch/g, 's'],
      [/qu/g, 'k'],
      [/c([eiy])/g, 's$1'],
      [/c/g, 'k'],
      [/g([eiy])/g, 'j$1'],
      [/gn/g, 'n'],
      [/tion/g, 'sion'],
      [/[bpfv]/g, 'b'],
      [/[dt]/g, 'd'],
      [/[kg]/g, 'k'],
      [/[mn]/g, 'm'],
      [/[lr]/g, 'r'],
      [/[sz]/g, 's'],
    ];

    for (const [pattern, replacement] of replacements) {
      normalized = normalized.replace(pattern, replacement);
    }

    normalized = normalized.replace(/(.)\1+/g, '$1');

    const firstChar = normalized[0] || '';
    const restChars = normalized
      .slice(1)
      .replace(/[aeiouyhw]/g, '')
      .substring(0, 3)
      .padEnd(3, '0');

    return (firstChar + restChars).toUpperCase();
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  public static levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    const matrix: number[][] = [];

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate similarity percentage between two strings
   */
  public static calculateSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  /**
   * Match voice input against stored answer
   * Returns detailed match result with method used
   */
  public static match(voiceInput: string, storedAnswer: string): MatchResult {
    const normalizedInput = this.normalize(voiceInput);
    const normalizedStored = this.normalize(storedAnswer);

    if (normalizedInput === normalizedStored) {
      return {
        isMatch: true,
        matchMethod: 'exact',
        similarity: 1.0,
        normalizedInput,
        normalizedStored,
      };
    }

    const inputWords = normalizedInput.split(' ');
    const storedWords = normalizedStored.split(' ');

    if (inputWords.length === storedWords.length) {
      const phoneticMatch = inputWords.every((inputWord, index) => {
        const storedWord = storedWords[index];
        return this.frenchSoundex(inputWord) === this.frenchSoundex(storedWord);
      });

      if (phoneticMatch) {
        const similarity = this.calculateSimilarity(normalizedInput, normalizedStored);
        return {
          isMatch: true,
          matchMethod: 'phonetic',
          similarity,
          normalizedInput,
          normalizedStored,
        };
      }
    }

    const similarity = this.calculateSimilarity(normalizedInput, normalizedStored);

    const distance = this.levenshteinDistance(normalizedInput, normalizedStored);

    if (
      similarity >= this.SIMILARITY_THRESHOLD ||
      distance <= this.MAX_LEVENSHTEIN_DISTANCE
    ) {
      return {
        isMatch: true,
        matchMethod: 'fuzzy',
        similarity,
        normalizedInput,
        normalizedStored,
      };
    }

    return {
      isMatch: false,
      matchMethod: 'none',
      similarity,
      normalizedInput,
      normalizedStored,
    };
  }

  /**
   * Hash answer for secure storage
   * Uses bcrypt-like approach with salt
   */
  public static async hashAnswer(answer: string): Promise<string> {
    const normalized = this.normalize(answer);
    const salt = crypto.randomBytes(16).toString('hex');

    const hash = crypto
      .pbkdf2Sync(normalized, salt, 10000, 64, 'sha512')
      .toString('hex');

    return `${salt}:${hash}`;
  }

  /**
   * Verify hashed answer
   */
  public static async verifyHash(answer: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, originalHash] = storedHash.split(':');
      if (!salt || !originalHash) return false;

      const normalized = this.normalize(answer);

      const hash = crypto
        .pbkdf2Sync(normalized, salt, 10000, 64, 'sha512')
        .toString('hex');

      return hash === originalHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Prepare answer for storage
   * Returns all formats needed for multi-level matching
   */
  public static async prepareForStorage(answer: string): Promise<{
    normalized: string;
    soundex: string;
    hash: string;
  }> {
    const normalized = this.normalize(answer);

    const words = normalized.split(' ');
    const soundexCodes = words.map((word) => this.frenchSoundex(word));
    const soundex = soundexCodes.join('-');

    const hash = await this.hashAnswer(answer);

    return {
      normalized,
      soundex,
      hash,
    };
  }

  /**
   * Batch compare multiple stored answers against voice input
   * Returns best match
   */
  public static findBestMatch(
    voiceInput: string,
    storedAnswers: Array<{ normalized: string; soundex: string }>
  ): MatchResult | null {
    let bestMatch: MatchResult | null = null;
    let highestSimilarity = 0;

    for (const stored of storedAnswers) {
      const result = this.match(voiceInput, stored.normalized);

      if (result.isMatch && result.similarity > highestSimilarity) {
        highestSimilarity = result.similarity;
        bestMatch = result;
      }
    }

    return bestMatch;
  }

  /**
   * Validate phone number format
   * Supports Ivorian formats: +225 XX XX XX XX XX
   */
  public static validatePhoneNumber(input: string): {
    isValid: boolean;
    formatted?: string;
    cleanNumber?: string;
  } {
    const cleaned = input.replace(/\D/g, '');

    const patterns = [
      /^225\d{10}$/,
      /^0\d{9}$/,
      /^\d{10}$/,
    ];

    const isValid = patterns.some((pattern) => pattern.test(cleaned));

    if (!isValid) {
      return { isValid: false };
    }

    let formatted = cleaned;
    if (formatted.startsWith('225')) {
      formatted = `+${formatted}`;
    } else if (formatted.startsWith('0')) {
      formatted = `+225${formatted.slice(1)}`;
    } else if (formatted.length === 10) {
      formatted = `+225${formatted}`;
    }

    return {
      isValid: true,
      formatted,
      cleanNumber: cleaned,
    };
  }
}

export type { MatchResult };
