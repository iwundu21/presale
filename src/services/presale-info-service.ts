
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

const defaultData: PresaleData = {
    presaleInfo: {
        seasonName: "Early Stage",
        tokenPrice: 0.09,
        hardCap: 700000000,
    },
    isPresaleActive: true
};

async function getOrCreateConfig(id: string, defaultValue: any) {
  try {
    let config = await prisma.config.findUnique({ where: { id } });
    if (!config) {
      config = await prisma.config.create({
        data: { id, value: defaultValue },
      });
    }
    return config.value;
  } catch (error) {
    console.error(`Error in getOrCreateConfig for id: ${id}`, error);
    return defaultValue;
  }
}

/**
 * Gets the current presale data (season, price, active status) from the API.
 * This is a server-side function.
 * @returns {Promise<PresaleData>} The current presale information.
 */
export async function getPresaleData(): Promise<PresaleData> {
  try {
    const presaleInfoValue = await getOrCreateConfig('presaleInfo', defaultData.presaleInfo);
    const isPresaleActiveValue = await getOrCreateConfig('isPresaleActive', { value: defaultData.isPresaleActive });

    const presaleInfo = presaleInfoSchema.safeParse(presaleInfoValue);

    return {
        presaleInfo: presaleInfo.success ? presaleInfo.data : defaultData.presaleInfo,
        isPresaleActive: (isPresaleActiveValue as { value: boolean })?.value ?? defaultData.isPresaleActive,
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
        update: { value: { value: isActive } },
        create: { id: 'isPresaleActive', value: { value: isActive } },
    });
}
