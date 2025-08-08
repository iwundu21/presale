
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const CONFIG_COLLECTION = 'appConfig';
const PRESALE_DOC = 'presale';

// Set a default end date far in the future as a fallback.
const DEFAULT_END_DATE = new Date("2024-09-30T23:59:59Z");

export async function getPresaleEndDate(): Promise<Date> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure we handle the Timestamp conversion correctly
      return (data?.endDate as Timestamp).toDate();
    } else {
      console.log(`Presale config not found. Creating document at /${CONFIG_COLLECTION}/${PRESALE_DOC} with default date.`);
      await setPresaleEndDate(DEFAULT_END_DATE);
      return DEFAULT_END_DATE;
    }
  } catch (error) {
    console.error("Error fetching presale end date from Firestore:", error);
    // Return default date on error to avoid breaking the UI
    return DEFAULT_END_DATE;
  }
}

export async function setPresaleEndDate(newDate: Date): Promise<void> {
   try {
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    await setDoc(docRef, { endDate: Timestamp.fromDate(newDate) });
  } catch (error) {
    console.error("Error setting presale end date in Firestore:", error);
    throw new Error('Failed to update presale end date in the database.');
  }
}
