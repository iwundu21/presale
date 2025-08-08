'use server';
/**
 * @fileOverview A flow to update the presale end date configuration.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs/promises';
import path from 'path';

const UpdatePresaleConfigInputSchema = z.object({
  endDate: z.string().describe('The new presale end date in ISO 8601 format.'),
});

export type UpdatePresaleConfigInput = z.infer<
  typeof UpdatePresaleConfigInputSchema
>;

const UpdatePresaleConfigOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type UpdatePresaleConfigOutput = z.infer<
  typeof UpdatePresaleConfigOutputSchema
>;

export async function updatePresaleConfig(
  input: UpdatePresaleConfigInput
): Promise<UpdatePresaleConfigOutput> {
  return updatePresaleConfigFlow(input);
}

const updatePresaleConfigFlow = ai.defineFlow(
  {
    name: 'updatePresaleConfigFlow',
    inputSchema: UpdatePresaleConfigInputSchema,
    outputSchema: UpdatePresaleConfigOutputSchema,
  },
  async input => {
    try {
      const configPath = path.join(process.cwd(), 'src', 'presale-config.ts');
      
      const newDate = new Date(input.endDate);
      if (isNaN(newDate.getTime())) {
        throw new Error('Invalid date format provided.');
      }

      const fileContent = `// THIS FILE IS MANAGED BY THE ADMIN DASHBOARD
// DO NOT EDIT DIRECTLY
export const PRESALE_END_DATE = new Date("${newDate.toISOString()}");
`;

      await fs.writeFile(configPath, fileContent, 'utf8');

      return {
        success: true,
        message: 'Presale end date updated successfully.',
      };
    } catch (error: any) {
      console.error('Failed to update presale config:', error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
  }
);
