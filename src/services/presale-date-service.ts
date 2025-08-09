
'use client';

const PRESALE_END_DATE_KEY = 'presaleEndDate';

/**
 * Gets the presale end date from sessionStorage.
 * This client-side function provides a fallback if no date is set.
 * @returns {Date} The current presale end date.
 */
export function getClientPresaleEndDate(): Date {
  if (typeof window !== 'undefined') {
    const storedDate = sessionStorage.getItem(PRESALE_END_DATE_KEY);
    if (storedDate) {
      const date = new Date(storedDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Fallback if no valid date is in sessionStorage
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  return defaultEndDate;
}

/**
 * (Client-side) Updates the presale end date in sessionStorage.
 * This affects all tabs in the current browser session.
 * @param {Date} newDate The new end date for the presale.
 */
export function setClientPresaleEndDate(newDate: Date | null): void {
    if (typeof window !== 'undefined') {
        if(newDate && !isNaN(newDate.getTime())) {
          sessionStorage.setItem(PRESALE_END_DATE_KEY, newDate.toISOString());
        } else {
          sessionStorage.removeItem(PRESALE_END_DATE_KEY);
        }
    }
}
