// This is a simple in-memory store for the presale end date.
// In a real production app, you would use a database like Firestore or Redis.
'use server';

let presaleEndDate = new Date("2024-09-30T23:59:59Z"); // Default value

export async function getPresaleEndDate(): Promise<Date> {
  return presaleEndDate;
}

export async function setPresaleEndDate(newDate: Date): Promise<void> {
  presaleEndDate = newDate;
}
