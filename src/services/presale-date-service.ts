
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
