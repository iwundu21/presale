
'use client';

// Default end date, used as an in-memory variable.
// This is now just a fallback if Firestore is unavailable.
let presaleEndDate: Date | null = null;

/**
 * Gets the presale end date. It's recommended to use the server-side
 * getPresaleEndDate from firestore-service for the most up-to-date value.
 * This client-side function provides a fallback.
 * @returns {Date} The current presale end date.
 */
export function getClientPresaleEndDate(): Date {
  if (presaleEndDate) {
    return presaleEndDate;
  }
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  return defaultEndDate;
}

/**
 * (Client-side) Updates the in-memory presale end date.
 * Note: This only affects the current client. The authoritative date is in Firestore.
 * @param {Date} newDate The new end date for the presale.
 */
export function setClientPresaleEndDate(newDate: Date | null): void {
    if(newDate) {
      presaleEndDate = newDate;
    }
}
