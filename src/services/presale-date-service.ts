
'use server';

import prisma from "@/lib/prisma";
import { z } from 'zod';

const getDefaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
};

/**
 * Gets the presale end date from the database.
 * This is a server-side function.
 * @returns {Promise<Date>} The current presale end date.
 */
export async function getPresaleEndDate(): Promise<Date> {
  try {
    const config = await prisma.config.findUnique({ where: { id: 'presaleEndDate' } });
    if (config) {
        let endDateString;
        if (typeof config.value === 'object' && config.value !== null && 'value' in config.value) {
            endDateString = config.value.value as string;
        } else if (typeof config.value === 'string') {
            endDateString = config.value;
        } else {
            console.error('Invalid date format in DB, using fallback.');
            return getDefaultEndDate();
        }
        
        const date = new Date(endDateString);
        if (isNaN(date.getTime())) {
           console.error('Invalid date value parsed from DB, using fallback.');
           return getDefaultEndDate();
        }
        return date;
    }
    return getDefaultEndDate();
  } catch (error) {
    console.error("Error fetching presale end date:", error);
    return getDefaultEndDate();
  }
}

/**
 * (Admin) Updates the presale end date in the database.
 * This is a server-side function.
 * @param {Date} newDate The new end date for the presale.
 */
export async function setPresaleEndDate(newDate: Date | null): Promise<void> {
    if (!newDate || isNaN(newDate.getTime())) {
        throw new Error("Invalid date provided.");
    }

    const dateSchema = z.string().datetime();
    const parsedDate = dateSchema.parse(newDate.toISOString());

    await prisma.config.upsert({
        where: { id: 'presaleEndDate' },
        update: { value: parsedDate },
        create: { id: 'presaleEndDate', value: parsedDate },
    });
}
