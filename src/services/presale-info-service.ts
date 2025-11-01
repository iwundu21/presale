
'use server';

import prisma from "@/lib/prisma";
import { z } from 'zod';

export type PresaleInfo = {
    seasonName: string;
    tokenPrice: number;
    hardCap: number;
};

export type PresaleData = {
    presaleInfo: PresaleInfo;
    isPresaleActive: boolean;
};

const presaleInfoSchema = z.object({
  seasonName: z.string(),
  tokenPrice: z.number(),
  hardCap: z.number(),
});

const defaultData: PresaleInfo = {
    seasonName: "Presale",
    tokenPrice: 0.09,
    hardCap: 0,
};

/**
 * Gets the current presale data (season, price, active status) from the API.
 * This is a server-side function.
 * @returns {Promise<PresaleData>} The current presale information.
 */
export async function getPresaleData(): Promise<PresaleData> {
  try {
    const configs = await prisma.config.findMany({
        where: {
            id: { in: ['presaleInfo', 'isPresaleActive'] }
        }
    });

    const configMap = new Map(configs.map(c => [c.id, c.value]));

    const presaleInfoRaw = configMap.get('presaleInfo');
    const presaleInfoParsed = presaleInfoSchema.safeParse(presaleInfoRaw);
    const presaleInfo = presaleInfoParsed.success ? presaleInfoParsed.data : defaultData;

    const isPresaleActive = (configMap.get('isPresaleActive') as boolean) ?? true;

    return {
        presaleInfo: presaleInfo,
        isPresaleActive: isPresaleActive,
    };
  } catch (error) {
    console.error("Error fetching presale data:", error);
    return {
        presaleInfo: defaultData,
        isPresaleActive: true,
    };
  }
}

/**
 * (Admin) Updates the presale information.
 * @param {PresaleInfo} newInfo The new presale info object.
 */
export async function setPresaleInfo(newInfo: PresaleInfo): Promise<void> {
    const parsedInfo = presaleInfoSchema.parse(newInfo);
    await prisma.config.upsert({
        where: { id: 'presaleInfo' },
        update: { value: parsedInfo },
        create: { id: 'presaleInfo', value: parsedInfo },
    });
}

/**
 * (Admin) Updates the presale active status.
 * @param {boolean} isActive Whether the presale should be active.
 */
export async function setPresaleStatus(isActive: boolean): Promise<void> {
    await prisma.config.upsert({
        where: { id: 'isPresaleActive' },
        update: { value: isActive },
        create: { id: 'isPresaleActive', value: isActive },
    });
}
