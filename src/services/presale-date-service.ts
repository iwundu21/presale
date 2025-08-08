// This service now uses Firestore to store the presale end date.
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CONFIG_COLLECTION = 'appConfig';
const PRESALE_DOC = 'presale';

// Default value if not set in Firestore
const DEFAULT_END_DATE = new Date("2024-09-30T23:59:59Z");

export async function getPresaleEndDate(): Promise<Date> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Firestore stores timestamps, so we need to convert it back to a Date object
      return data.endDate.toDate();
    } else {
      // If the document doesn't exist, set it with the default value and return it
      console.log('Presale config not found in Firestore, creating with default date.');
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
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    await setDoc(docRef, { endDate: newDate });
  } catch (error) {
    console.error("Error setting presale end date in Firestore:", error);
    throw new Error('Failed to update presale end date in the database.');
  }
}
