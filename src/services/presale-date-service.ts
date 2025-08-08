'use server';

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const CONFIG_COLLECTION = 'appConfig';
const PRESALE_DOC = 'presale';

const DEFAULT_END_DATE = new Date("2024-09-30T23:59:59Z");

export async function getPresaleEndDate(): Promise<Date> {
  try {
    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(PRESALE_DOC);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      // Firestore stores timestamps, so we need to convert it back to a Date object
      return (data?.endDate as Timestamp).toDate();
    } else {
      // If the document doesn't exist, set it with the default value and return it
      console.log(`Presale config not found. Creating document at /${CONFIG_COLLECTION}/${PRESALE_DOC} with default date.`);
      await setPresaleEndDate(DEFAULT_END_DATE);
      return DEFAULT_END_DATE;
    }
  } catch (error) {
    console.error("Error fetching presale end date from Firestore:", error);
    // Return default date as a fallback in case of error
    return DEFAULT_END_DATE;
  }
}

export async function setPresaleEndDate(newDate: Date): Promise<void> {
   try {
    const docRef = adminDb.collection(CONFIG_COLLECTION).doc(PRESALE_DOC);
    // The date is converted to a Firestore Timestamp automatically by the admin SDK
    await docRef.set({ endDate: newDate });
  } catch (error) {
    console.error("Error setting presale end date in Firestore:", error);
    throw new Error('Failed to update presale end date in the database.');
  }
}
