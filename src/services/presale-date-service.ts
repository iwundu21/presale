
'use client';

const PRESALE_END_DATE_KEY = 'presaleEndDate';

/**
 * Gets the presale end date from localStorage.
 * This client-side function provides a fallback if no date is set.
 * @returns {Date} The current presale end date.
 */
export function getClientPresaleEndDate(): Date {
  if (typeof window !== 'undefined') {
    const storedDate = localStorage.getItem(PRESALE_END_DATE_KEY);
    if (storedDate) {
      const date = new Date(storedDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  // Fallback if no valid date is in localStorage
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  return defaultEndDate;
}

/**
 * (Client-side) Updates the presale end date in localStorage.
 * This affects all tabs and sessions in the current browser.
 * @param {Date} newDate The new end date for the presale.
 */
export function setClientPresaleEndDate(newDate: Date | null): void {
    if (typeof window !== 'undefined') {
        if(newDate && !isNaN(newDate.getTime())) {
          localStorage.setItem(PRESALE_END_DATE_KEY, newDate.toISOString());
        } else {
          localStorage.removeItem(PRESALE_END_DATE_KEY);
        }
    }
}
