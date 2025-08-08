'use server';
/**
 * @fileOverview A flow to export user wallet and balance data as a CSV.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAllUsers, UserData } from '@/services/firestore-service';

const ExportUserDataOutputSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  csvData: z.string().optional().describe('The user data in CSV format.'),
});

export type ExportUserDataOutput = z.infer<
  typeof ExportUserDataOutputSchema
>;

export async function exportUserData(): Promise<ExportUserDataOutput> {
  return exportUserDataFlow();
}

const exportUserDataFlow = ai.defineFlow(
  {
    name: 'exportUserDataFlow',
    outputSchema: ExportUserDataOutputSchema,
  },
  async () => {
    try {
      const users = await getAllUsers();

      if (!users || users.length === 0) {
        return {
          success: true,
          csvData: 'walletAddress,exnBalance\n',
          message: 'No user data to export.'
        };
      }

      // Convert user data to CSV format
      const headers = 'walletAddress,exnBalance';
      const rows = users.map(user => 
        `${user.walletAddress},${user.exnBalance}`
      ).join('\n');
      
      const csvData = `${headers}\n${rows}`;

      return {
        success: true,
        csvData,
      };
    } catch (error: any) {
      console.error('Failed to export user data:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred while exporting data.',
      };
    }
  }
);
