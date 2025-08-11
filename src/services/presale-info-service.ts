
'use client';

export type PresaleInfo = {
    seasonName: string;
    tokenPrice: number;
};

export type PresaleData = {
    presaleInfo: PresaleInfo;
    isPresaleActive: boolean;
}

const defaultData: PresaleData = {
    presaleInfo: {
        seasonName: "Early Stage",
        tokenPrice: 0.09
    },
    isPresaleActive: true
};

/**
 * Gets the current presale data (season, price, active status) from the API.
 * @returns {Promise<PresaleData>} The current presale information.
 */
export async function getPresaleData(): Promise<PresaleData> {
  try {
    const response = await fetch('/api/presale-data');
    if (!response.ok) {
        console.error("Failed to fetch presale data, using defaults.");
        return defaultData;
    }
    const data = await response.json();
    return {
        presaleInfo: data.presaleInfo || defaultData.presaleInfo,
        isPresaleActive: data.isPresaleActive === undefined ? defaultData.isPresaleActive : data.isPresaleActive,
    };
  } catch (error) {
    console.error("Error fetching presale data:", error);
    return defaultData;
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

/**
 * (Admin) Updates the presale active status.
 * @param {boolean} isActive Whether the presale should be active.
 */
export async function setPresaleStatus(isActive: boolean): Promise<void> {
    const response = await fetch('/api/presale-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPresaleActive: isActive }),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update presale status: ${errorData}`);
    }
}
