
'use client';

// Default end date, used as an in-memory variable.
// This is now just a fallback if Firestore is unavailable.
let presaleEndDate = new Date("2024-09-30T23:59:59Z");

/**
 * Gets the presale end date. It's recommended to use the server-side
 * getPresaleEndDate from firestore-service for the most up-to-date value.
 * This client-side function provides a fallback.
 * @returns {Date} The current presale end date.
 */
export function getPresaleEndDate(): Date {
  // In a real app, you might want to fetch this from a service
  // or have it sync with the Firestore value. For now, it returns
  // the in-memory value which can be updated by the admin dashboard.
  return presaleEndDate;
}

/**
 * (Client-side) Updates the in-memory presale end date.
 * Note: This only affects the current client. The authoritative date is in Firestore.
 * @param {Date} newDate The new end date for the presale.
 */
export function setClientPresaleEndDate(newDate: Date): void {
    presaleEndDate = newDate;
}
