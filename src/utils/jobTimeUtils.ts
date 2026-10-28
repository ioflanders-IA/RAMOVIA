/**
 * Utility functions for parsing intervention time slots and checking expiry.
 */

export interface ParsedTime {
  hour: number;
  minute: number;
}

/**
 * Extracts the end time (hour and minute) from an intervention timeSlot string.
 * Examples handled:
 * - "08:30 - 16.00" -> 16:00
 * - "07.00/14.00"   -> 14:00
 * - "08:30 - 12:30" -> 12:30
 * - "16:00"         -> 16:00
 * - "16.00"         -> 16:00
 * - "08:00 - 17:00" -> 17:00
 * - "08.30-16.00"   -> 16:00
 * - "14:00 - 18:00" -> 18:00
 * - "Mattina"       -> 13:00
 * - "Pomeriggio"    -> 18:00
 */
export function getJobEndTime(timeSlot?: string): ParsedTime | null {
  if (!timeSlot) return null;
  const trimmed = timeSlot.trim().toLowerCase();

  // Check if slot has a range separator like '-', '/', 'fino a', 'al'
  const parts = trimmed.split(/[-–—/]|(?:fino\s+a)|(?:al)/);
  const targetStr = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();

  // Match HH:MM or HH.MM or HH:00 or single hour like 16
  const match = targetStr.match(/(\d{1,2})[:.](\d{2})/) || targetStr.match(/^(\d{1,2})\s*(?:h|:00)?$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // Keywords fallback
  if (trimmed.includes('mattina')) return { hour: 13, minute: 0 };
  if (trimmed.includes('pomeriggio')) return { hour: 18, minute: 0 };
  if (trimmed.includes('giornata')) return { hour: 17, minute: 30 };

  return null;
}

/**
 * Extracts the start time (hour and minute) from an intervention timeSlot string.
 * Examples handled:
 * - "08:30 - 16.00" -> 08:30
 * - "07.00/14.00"   -> 07:00
 * - "08:30 - 12:30" -> 08:30
 * - "14:00 - 18:00" -> 14:00
 * - "Mattina"       -> 08:30
 * - "Pomeriggio"    -> 14:00
 */
export function getJobStartTime(timeSlot?: string): ParsedTime | null {
  if (!timeSlot) return null;
  const trimmed = timeSlot.trim().toLowerCase();

  const parts = trimmed.split(/[-–—/]|(?:fino\s+a)|(?:al)/);
  const startStr = parts[0].trim();

  const match = startStr.match(/(\d{1,2})[:.](\d{2})/) || startStr.match(/^(\d{1,2})\s*(?:h|:00)?$/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  if (trimmed.includes('mattina')) return { hour: 8, minute: 30 };
  if (trimmed.includes('pomeriggio')) return { hour: 14, minute: 0 };
  if (trimmed.includes('giornata')) return { hour: 8, minute: 30 };

  return null;
}

/**
 * Checks if an intervention's scheduled time has passed/expired.
 * Returns true if the job is not completed and either:
 * - The date is in the past, OR
 * - The date is today and the current time is at or past the end time of the slot.
 */
export function isJobTimeExpired(
  job: { date: string; timeSlot?: string; status: string },
  referenceDate: Date = new Date()
): boolean {
  if (job.status === 'completed' || job.status === 'cancelled') {
    return false;
  }

  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (job.date < todayStr) {
    return true;
  }

  if (job.date > todayStr) {
    return false;
  }

  // It's today: check time slot end time
  const endTime = getJobEndTime(job.timeSlot);
  if (!endTime) {
    // If no specific end time is specified, consider it expired after standard workday 17:30
    return referenceDate.getHours() >= 17 && referenceDate.getMinutes() >= 30;
  }

  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const endMinutes = endTime.hour * 60 + endTime.minute;

  return currentMinutes >= endMinutes;
}

/**
 * Checks if an intervention is currently underway (in orario è in corso).
 * Returns true if the job is not completed, not cancelled, and:
 * - Its status is explicitly 'in_progress', OR
 * - Its scheduled date is today and the current time is between its start time and end time.
 */
export function isJobCurrentlyInProgress(
  job: { date: string; timeSlot?: string; status: string },
  referenceDate: Date = new Date()
): boolean {
  if (job.status === 'completed' || job.status === 'cancelled') {
    return false;
  }

  if (job.status === 'in_progress') {
    return true;
  }

  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (job.date !== todayStr) {
    return false;
  }

  const startTime = getJobStartTime(job.timeSlot);
  const endTime = getJobEndTime(job.timeSlot);

  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const startMinutes = startTime ? startTime.hour * 60 + startTime.minute : 8 * 60 + 30; // default 08:30
  const endMinutes = endTime ? endTime.hour * 60 + endTime.minute : 17 * 60 + 30; // default 17:30

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

