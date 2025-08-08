
'use server';

import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase";

const CONFIG_COLLECTION = 'appConfig';
const PRESALE_DOC = 'presale';
const DEFAULT_END_DATE = new Date("2024-09-30T23:59:59Z");

export async function getPresaleEndDate(): Promise<Date> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Firestore stores timestamps, so we need to convert them to Date objects
      return data.endDate.toDate();
    } else {
      console.log("No presale config found, creating with default date.");
      // If the document doesn't exist, create it with the default date
      await setDoc(docRef, { endDate: DEFAULT_END_DATE });
      return DEFAULT_END_DATE;
    }
  } catch (error) {
    console.error("Error getting presale end date:", error);
    // Return default date as a fallback in case of error
    return DEFAULT_END_DATE;
  }
}

export async function setPresaleEndDate(newDate: Date): Promise<void> {
   try {
    const docRef = doc(db, CONFIG_COLLECTION, PRESALE_DOC);
    await setDoc(docRef, { endDate: newDate });
   } catch (error) {
     console.error("Error setting presale end date:", error);
     throw new Error("Could not update the presale date in the database.");
   }
}
