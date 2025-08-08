
'use client';

// Default end date, used as an in-memory variable.
let presaleEndDate = new Date("2024-09-30T23:59:59Z");

/**
 * Gets the presale end date from memory.
 * @returns {Date} The current presale end date.
 */
export function getPresaleEndDate(): Date {
  return presaleEndDate;
}

/**
 * Sets the presale end date in memory for the current session.
 * @param {Date} newDate - The new date to set.
 */
export function setPresaleEndDate(newDate: Date): void {
  if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      presaleEndDate = newDate;
  } else {
      console.error("Invalid date provided to setPresaleEndDate");
  }
}
