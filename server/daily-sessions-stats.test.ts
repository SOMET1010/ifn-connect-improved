/**
 * Tests unitaires pour les statistiques avancées des sessions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { 
  getLast30DaysStats, 
  compareWeeks, 
  compareMonths 
} from './db-daily-sessions-stats';

describe('Statistiques avancées des sessions', () => {
  beforeAll(async () => {
    // Vérifier que la connexion DB est disponible
    const db = await getDb();
    expect(db).toBeDefined();
  });

  describe('getLast30DaysStats', () => {
    it('devrait retourner un tableau de statistiques', async () => {
      const merchantId = 1;
      const stats = await getLast30DaysStats(merchantId);
      
      expect(Array.isArray(stats)).toBe(true);
      
      // Vérifier la structure des données si des sessions existent
      if (stats.length > 0) {
        const firstStat = stats[0];
        expect(firstStat).toHaveProperty('date');
        expect(firstStat).toHaveProperty('hoursWorked');
        expect(typeof firstStat.hoursWorked).toBe('number');
        expect(firstStat.hoursWorked).toBeGreaterThanOrEqual(0);
      }
    });

    it('devrait retourner au maximum 30 jours de données', async () => {
      const merchantId = 1;
      const stats = await getLast30DaysStats(merchantId);
      
      expect(stats.length).toBeLessThanOrEqual(30);
    });

    it('devrait calculer correctement les heures travaillées', async () => {
      const merchantId = 1;
      const stats = await getLast30DaysStats(merchantId);
      
      // Vérifier que toutes les heures sont des nombres positifs
      stats.forEach(stat => {
        expect(stat.hoursWorked).toBeGreaterThanOrEqual(0);
        expect(stat.hoursWorked).toBeLessThan(24); // Une journée ne peut pas dépasser 24h
      });
    });
  });

  describe('compareWeeks', () => {
    it('devrait retourner une comparaison hebdomadaire', async () => {
      const merchantId = 1;
      const comparison = await compareWeeks(merchantId);
      
      expect(comparison).toBeDefined();
      expect(comparison).toHaveProperty('thisWeek');
      expect(comparison).toHaveProperty('lastWeek');
      expect(comparison).toHaveProperty('difference');
      
      // Vérifier la structure de thisWeek
      expect(comparison.thisWeek).toHaveProperty('totalHours');
      expect(comparison.thisWeek).toHaveProperty('daysWorked');
      expect(typeof comparison.thisWeek.totalHours).toBe('number');
      expect(typeof comparison.thisWeek.daysWorked).toBe('number');
      
      // Vérifier la structure de lastWeek
      expect(comparison.lastWeek).toHaveProperty('totalHours');
      expect(comparison.lastWeek).toHaveProperty('daysWorked');
      
      // Vérifier la structure de difference
      expect(comparison.difference).toHaveProperty('hours');
      expect(comparison.difference).toHaveProperty('percentage');
      expect(typeof comparison.difference.percentage).toBe('number');
    });

    it('devrait calculer correctement le pourcentage de différence', async () => {
      const merchantId = 1;
      const comparison = await compareWeeks(merchantId);
      
      // Si lastWeek.totalHours > 0, vérifier le calcul du pourcentage
      if (comparison.lastWeek.totalHours > 0) {
        const expectedPercentage = Math.round(
          ((comparison.thisWeek.totalHours - comparison.lastWeek.totalHours) / 
          comparison.lastWeek.totalHours) * 100
        );
        expect(comparison.difference.percentage).toBe(expectedPercentage);
      } else {
        // Si lastWeek est 0, le pourcentage devrait être 0
        expect(comparison.difference.percentage).toBe(0);
      }
    });

    it('devrait avoir des valeurs cohérentes pour daysWorked', async () => {
      const merchantId = 1;
      const comparison = await compareWeeks(merchantId);
      
      // Une semaine ne peut pas avoir plus de 7 jours travaillés
      expect(comparison.thisWeek.daysWorked).toBeLessThanOrEqual(7);
      expect(comparison.lastWeek.daysWorked).toBeLessThanOrEqual(7);
      expect(comparison.thisWeek.daysWorked).toBeGreaterThanOrEqual(0);
      expect(comparison.lastWeek.daysWorked).toBeGreaterThanOrEqual(0);
    });
  });

  describe('compareMonths', () => {
    it('devrait retourner une comparaison mensuelle', async () => {
      const merchantId = 1;
      const comparison = await compareMonths(merchantId);
      
      expect(comparison).toBeDefined();
      expect(comparison).toHaveProperty('thisMonth');
      expect(comparison).toHaveProperty('lastMonth');
      expect(comparison).toHaveProperty('difference');
      
      // Vérifier la structure de thisMonth
      expect(comparison.thisMonth).toHaveProperty('totalHours');
      expect(comparison.thisMonth).toHaveProperty('daysWorked');
      expect(typeof comparison.thisMonth.totalHours).toBe('number');
      expect(typeof comparison.thisMonth.daysWorked).toBe('number');
      
      // Vérifier la structure de lastMonth
      expect(comparison.lastMonth).toHaveProperty('totalHours');
      expect(comparison.lastMonth).toHaveProperty('daysWorked');
      
      // Vérifier la structure de difference
      expect(comparison.difference).toHaveProperty('hours');
      expect(comparison.difference).toHaveProperty('percentage');
      expect(typeof comparison.difference.percentage).toBe('number');
    });

    it('devrait calculer correctement le pourcentage de différence', async () => {
      const merchantId = 1;
      const comparison = await compareMonths(merchantId);
      
      // Si lastMonth.totalHours > 0, vérifier le calcul du pourcentage
      if (comparison.lastMonth.totalHours > 0) {
        const expectedPercentage = Math.round(
          ((comparison.thisMonth.totalHours - comparison.lastMonth.totalHours) / 
          comparison.lastMonth.totalHours) * 100
        );
        expect(comparison.difference.percentage).toBe(expectedPercentage);
      } else {
        // Si lastMonth est 0, le pourcentage devrait être 0
        expect(comparison.difference.percentage).toBe(0);
      }
    });

    it('devrait avoir des valeurs cohérentes pour daysWorked', async () => {
      const merchantId = 1;
      const comparison = await compareMonths(merchantId);
      
      // Un mois ne peut pas avoir plus de 31 jours travaillés
      expect(comparison.thisMonth.daysWorked).toBeLessThanOrEqual(31);
      expect(comparison.lastMonth.daysWorked).toBeLessThanOrEqual(31);
      expect(comparison.thisMonth.daysWorked).toBeGreaterThanOrEqual(0);
      expect(comparison.lastMonth.daysWorked).toBeGreaterThanOrEqual(0);
    });

    it('devrait avoir des heures cohérentes avec les jours travaillés', async () => {
      const merchantId = 1;
      const comparison = await compareMonths(merchantId);
      
      // Si des jours sont travaillés, il devrait y avoir des heures
      if (comparison.thisMonth.daysWorked > 0) {
        expect(comparison.thisMonth.totalHours).toBeGreaterThan(0);
      }
      
      if (comparison.lastMonth.daysWorked > 0) {
        expect(comparison.lastMonth.totalHours).toBeGreaterThan(0);
      }
    });
  });

  describe('Cohérence des données entre les fonctions', () => {
    it('les données des 30 derniers jours devraient être cohérentes avec les comparaisons', async () => {
      const merchantId = 1;
      
      const last30Days = await getLast30DaysStats(merchantId);
      const weekComparison = await compareWeeks(merchantId);
      const monthComparison = await compareMonths(merchantId);
      
      // Si on a des données sur 30 jours, on devrait aussi avoir des comparaisons
      if (last30Days.length > 0) {
        expect(weekComparison).toBeDefined();
        expect(monthComparison).toBeDefined();
      }
      
      // Les totaux hebdomadaires ne peuvent pas dépasser les totaux mensuels
      const thisWeekTotal = weekComparison.thisWeek.totalHours;
      const thisMonthTotal = monthComparison.thisMonth.totalHours;
      
      expect(thisWeekTotal).toBeLessThanOrEqual(thisMonthTotal);
    });
  });
});
