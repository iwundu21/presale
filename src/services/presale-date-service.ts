
'use client';

/**
 * Gets the presale end date from the API.
 * @returns {Promise<Date>} The current presale end date.
 */
export async function getPresaleEndDate(): Promise<Date> {
  const fallbackDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d;
  };

  try {
    const response = await fetch('/api/presale-date', {
        next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!response.ok) {
      console.error('Failed to fetch presale end date, using fallback.');
      return fallbackDate();
    }
    
    const data = await response.json();
    const date = new Date(data.presaleEndDate);
    
    if (isNaN(date.getTime())) {
       console.error('Invalid date format from API, using fallback.');
       return fallbackDate();
    }
    
    return date;

  } catch (error) {
    console.error("Error fetching presale end date:", error);
    return fallbackDate();
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
