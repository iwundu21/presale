
'use client';

export type PresaleInfo = {
    seasonName: string;
    tokenPrice: number;
};

const defaultInfo: PresaleInfo = {
    seasonName: "Early Stage",
    tokenPrice: 0.09
};

/**
 * Gets the current presale info (season and price) from the API.
 * @returns {Promise<PresaleInfo>} The current presale information.
 */
export async function getPresaleInfo(): Promise<PresaleInfo> {
  try {
    const response = await fetch('/api/presale-data');
    if (!response.ok) {
        console.error("Failed to fetch presale info, using default.");
        return defaultInfo;
    }
    const data = await response.json();
    return data.presaleInfo || defaultInfo;
  } catch (error) {
    console.error("Error fetching presale info:", error);
    return defaultInfo;
  }
}

/**
 * (Admin) Updates the presale information.
 * @param {PresaleInfo} newInfo The new presale info object.
 */
export async function setPresaleInfo(newInfo: PresaleInfo): Promise<void> {
    const response = await fetch('/api/presale-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ presaleInfo: newInfo }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update presale info: ${errorData}`);
    }
}
