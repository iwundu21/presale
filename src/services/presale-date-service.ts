
'use client';

/**
 * Gets the presale end date from the API.
 * @returns {Promise<Date>} The current presale end date.
 */
export async function getPresaleEndDate(): Promise<Date> {
  try {
    const response = await fetch('/api/presale-date');
    if (!response.ok) {
      throw new Error('Failed to fetch presale end date');
    }
    const data = await response.json();
    const date = new Date(data.presaleEndDate);
    if (isNaN(date.getTime())) {
       throw new Error('Invalid date format from API');
    }
    return date;
  } catch (error) {
    console.error("Error fetching presale end date:", error);
    // Fallback if API fails
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    return defaultEndDate;
  }
}

/**
 * (Admin) Updates the presale end date via the API.
 * @param {Date} newDate The new end date for the presale.
 */
export async function setPresaleEndDate(newDate: Date | null): Promise<void> {
    if (!newDate || isNaN(newDate.getTime())) {
        throw new Error("Invalid date provided.");
    }
    const response = await fetch('/api/presale-date', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presaleEndDate: newDate.toISOString() }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update presale date: ${errorData}`);
    }
}
