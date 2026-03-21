import { addDays, differenceInDays, format, isAfter, isBefore } from 'date-fns';

export interface BenefitPeriod {
  number: number;
  startDate: Date;
  endDate: Date;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  f2fRequired: boolean;
  f2fDeadline?: Date;
  certificationDays: number; // 60, 90, or subsequent 60-day periods
  isActive: boolean;
  status: 'current' | 'upcoming' | 'completed';
}

export interface F2FRequirement {
  id?: string;
  referralId: string;
  benefitPeriodNumber: number;
  f2fType: 'initial' | 'recertification' | 'change_of_condition';
  requiredByDate: Date;
  completedDate?: Date;
  physicianName?: string;
  visitId?: string;
  certificationDays: number;
  isOverdue: boolean;
  daysUntilDue: number;
}

export class BenefitPeriodCalculator {
  /**
   * Calculate all benefit periods from admission date to current date
   */
  static calculateBenefitPeriods(
    admissionDate: Date, 
    targetDate: Date = new Date()
  ): BenefitPeriod[] {
    const periods: BenefitPeriod[] = [];
    const daysSinceAdmission = differenceInDays(targetDate, admissionDate);
    
    // First period: 60 days
    const firstPeriod = this.createBenefitPeriod(
      1, 
      admissionDate, 
      addDays(admissionDate, 60), 
      60, 
      targetDate
    );
    periods.push(firstPeriod);
    
    // Second period: 90 days (days 61-150)
    if (daysSinceAdmission > 60) {
      const secondStart = addDays(admissionDate, 60);
      const secondEnd = addDays(admissionDate, 150);
      const secondPeriod = this.createBenefitPeriod(
        2, 
        secondStart, 
        secondEnd, 
        90, 
        targetDate
      );
      periods.push(secondPeriod);
    }
    
    // Subsequent periods: 60 days each
    let periodNumber = 3;
    let periodStart = addDays(admissionDate, 150);
    
    while (isBefore(periodStart, targetDate)) {
      const periodEnd = addDays(periodStart, 60);
      const period = this.createBenefitPeriod(
        periodNumber, 
        periodStart, 
        periodEnd, 
        60, 
        targetDate
      );
      periods.push(period);
      
      periodNumber++;
      periodStart = periodEnd;
    }
    
    return periods;
  }

  /**
   * Get the current benefit period for a given date
   */
  static getCurrentBenefitPeriod(
    admissionDate: Date, 
    targetDate: Date = new Date()
  ): BenefitPeriod {
    const periods = this.calculateBenefitPeriods(admissionDate, targetDate);
    return periods.find(p => p.status === 'current') || periods[periods.length - 1];
  }

  /**
   * Calculate F2F requirements for all benefit periods
   */
  static calculateF2FRequirements(
    admissionDate: Date,
    referralId: string,
    targetDate: Date = new Date()
  ): F2FRequirement[] {
    const periods = this.calculateBenefitPeriods(admissionDate, targetDate);
    const requirements: F2FRequirement[] = [];
    
    periods.forEach(period => {
      if (period.f2fRequired && period.f2fDeadline) {
        const requirement: F2FRequirement = {
          referralId,
          benefitPeriodNumber: period.number,
          f2fType: period.number === 1 ? 'initial' : 'recertification',
          requiredByDate: period.f2fDeadline,
          certificationDays: period.certificationDays,
          isOverdue: isAfter(targetDate, period.f2fDeadline),
          daysUntilDue: differenceInDays(period.f2fDeadline, targetDate)
        };
        requirements.push(requirement);
      }
    });
    
    return requirements;
  }

  /**
   * Check if F2F is required for a specific visit date within a benefit period
   */
  static isF2FRequired(period: BenefitPeriod, visitDate: Date): boolean {
    // F2F is required if:
    // 1. We're in a benefit period that requires F2F
    // 2. The visit date is within the F2F deadline
    // 3. It's not already completed (would be checked elsewhere)
    
    if (!period.f2fRequired || !period.f2fDeadline) {
      return false;
    }
    
    return (
      visitDate >= period.startDate &&
      visitDate <= period.endDate &&
      visitDate <= period.f2fDeadline
    );
  }

  /**
   * Get the next F2F deadline for a patient
   */
  static getNextF2FDeadline(
    admissionDate: Date,
    currentDate: Date = new Date()
  ): Date | null {
    const currentPeriod = this.getCurrentBenefitPeriod(admissionDate, currentDate);
    
    if (currentPeriod.f2fRequired && currentPeriod.f2fDeadline) {
      return currentPeriod.f2fDeadline;
    }
    
    // Look for next period that requires F2F
    const periods = this.calculateBenefitPeriods(admissionDate, addDays(currentDate, 365));
    const nextPeriodWithF2F = periods.find(p => 
      p.number > currentPeriod.number && p.f2fRequired && p.f2fDeadline
    );
    
    return nextPeriodWithF2F?.f2fDeadline || null;
  }

  /**
   * Get benefit period information for a specific date
   */
  static getBenefitPeriodFromDate(
    admissionDate: Date, 
    targetDate: Date
  ): BenefitPeriod | null {
    const periods = this.calculateBenefitPeriods(admissionDate, targetDate);
    return periods.find(p => 
      targetDate >= p.startDate && targetDate <= p.endDate
    ) || null;
  }

  /**
   * Calculate days until next F2F deadline
   */
  static getDaysUntilF2FDeadline(
    admissionDate: Date,
    currentDate: Date = new Date()
  ): number {
    const nextDeadline = this.getNextF2FDeadline(admissionDate, currentDate);
    if (!nextDeadline) return -1;
    
    return differenceInDays(nextDeadline, currentDate);
  }

  /**
   * Check if a patient has overdue F2F requirements
   */
  static hasOverdueF2F(
    admissionDate: Date,
    currentDate: Date = new Date()
  ): boolean {
    const nextDeadline = this.getNextF2FDeadline(admissionDate, currentDate);
    if (!nextDeadline) return false;
    
    return isAfter(currentDate, nextDeadline);
  }

  /**
   * Generate F2F alert message
   */
  static getF2FAlertMessage(
    admissionDate: Date,
    patientName: string,
    currentDate: Date = new Date()
  ): string | null {
    const daysUntil = this.getDaysUntilF2FDeadline(admissionDate, currentDate);
    const currentPeriod = this.getCurrentBenefitPeriod(admissionDate, currentDate);
    
    if (daysUntil < 0) return null;
    
    if (daysUntil === 0) {
      return `🚨 F2F DEADLINE TODAY for ${patientName} (Benefit Period ${currentPeriod.number})`;
    } else if (daysUntil <= 3) {
      return `⚠️ F2F due in ${daysUntil} days for ${patientName} (Benefit Period ${currentPeriod.number})`;
    } else if (daysUntil <= 7) {
      return `📅 F2F due in ${daysUntil} days for ${patientName} (Benefit Period ${currentPeriod.number})`;
    }
    
    return null;
  }

  /**
   * Private helper to create a benefit period object
   */
  private static createBenefitPeriod(
    number: number,
    startDate: Date,
    endDate: Date,
    certificationDays: number,
    targetDate: Date
  ): BenefitPeriod {
    const daysElapsed = Math.max(0, differenceInDays(targetDate, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, targetDate));
    const isActive = targetDate >= startDate && targetDate <= endDate;
    
    let status: 'current' | 'upcoming' | 'completed';
    if (isActive) {
      status = 'current';
    } else if (isBefore(targetDate, startDate)) {
      status = 'upcoming';
    } else {
      status = 'completed';
    }
    
    // F2F is required for all benefit periods, deadline is 5 days before period ends
    const f2fRequired = true;
    const f2fDeadline = addDays(endDate, -5);
    
    return {
      number,
      startDate,
      endDate,
      daysElapsed: Math.min(daysElapsed, certificationDays),
      daysRemaining,
      totalDays: certificationDays,
      f2fRequired,
      f2fDeadline,
      certificationDays,
      isActive,
      status
    };
  }
}

/**
 * Convenience function: calculate the current benefit period from an admission date string.
 * Returns period number, days remaining, and date range.
 */
export function calculateBenefitPeriod(admissionDate: string): {
  period: number;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  startDate: string;
  endDate: string;
} {
  const admission = new Date(admissionDate);
  const current = BenefitPeriodCalculator.getCurrentBenefitPeriod(admission);
  return {
    period: current.number,
    daysRemaining: current.daysRemaining,
    daysElapsed: current.daysElapsed,
    totalDays: current.totalDays,
    startDate: format(current.startDate, 'yyyy-MM-dd'),
    endDate: format(current.endDate, 'yyyy-MM-dd'),
  };
}

/**
 * Utility functions for formatting and display
 */
export class BenefitPeriodFormatter {
  static formatPeriod(period: BenefitPeriod): string {
    return `Benefit Period ${period.number} (${format(period.startDate, 'MMM dd')} - ${format(period.endDate, 'MMM dd, yyyy')})`;
  }

  static formatF2FDeadline(deadline: Date): string {
    const daysUntil = differenceInDays(deadline, new Date());
    
    if (daysUntil < 0) {
      return `❌ Overdue by ${Math.abs(daysUntil)} days`;
    } else if (daysUntil === 0) {
      return `🚨 Due TODAY`;
    } else if (daysUntil <= 3) {
      return `⚠️ Due in ${daysUntil} days`;
    } else {
      return `📅 Due ${format(deadline, 'MMM dd, yyyy')} (${daysUntil} days)`;
    }
  }

  static getPeriodStatusColor(period: BenefitPeriod): string {
    switch (period.status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  static getF2FStatusColor(daysUntil: number): string {
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil === 0) return 'text-red-500';
    if (daysUntil <= 3) return 'text-orange-500';
    if (daysUntil <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  }
}

/**
 * Hook for React components to use benefit period logic
 */
export const useBenefitPeriod = (admissionDate: Date | null) => {
  if (!admissionDate) {
    return {
      currentPeriod: null,
      allPeriods: [],
      f2fRequirements: [],
      nextF2FDeadline: null,
      hasOverdueF2F: false,
      daysUntilF2F: -1
    };
  }

  const currentPeriod = BenefitPeriodCalculator.getCurrentBenefitPeriod(admissionDate);
  const allPeriods = BenefitPeriodCalculator.calculateBenefitPeriods(admissionDate);
  const f2fRequirements = BenefitPeriodCalculator.calculateF2FRequirements(admissionDate, 'temp-id');
  const nextF2FDeadline = BenefitPeriodCalculator.getNextF2FDeadline(admissionDate);
  const hasOverdueF2F = BenefitPeriodCalculator.hasOverdueF2F(admissionDate);
  const daysUntilF2F = BenefitPeriodCalculator.getDaysUntilF2FDeadline(admissionDate);

  return {
    currentPeriod,
    allPeriods,
    f2fRequirements,
    nextF2FDeadline,
    hasOverdueF2F,
    daysUntilF2F
  };
};