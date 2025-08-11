
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
    let config = await prisma.config.findUnique({ where: { id: 'presaleEndDate' } });
    if (!config) {
        const defaultEndDate = getDefaultEndDate().toISOString();
        config = await prisma.config.create({
            data: { id: 'presaleEndDate', value: { value: defaultEndDate } },
        });
        return new Date(defaultEndDate);
    }
    const endDateString = (config.value as { value: string }).value;
    const date = new Date(endDateString);
    if (isNaN(date.getTime())) {
       console.error('Invalid date format from DB, using fallback.');
       return getDefaultEndDate();
    }
    return date;
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
        update: { value: { value: parsedDate } },
        create: { id: 'presaleEndDate', value: { value: parsedDate } },
    });
}
