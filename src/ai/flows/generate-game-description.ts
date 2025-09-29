
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating game descriptions using a language model.
 *
 * The flow takes a game title as input and returns a generated game description.
 * @param {GenerateGameDescriptionInput} input - The input for the generateGameDescription function.
 * @returns {Promise<GenerateGameDescriptionOutput>} - A promise that resolves with the generated game description.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGameDescriptionInputSchema = z.object({
  gameTitle: z.string().describe('The title of the game.'),
});

export type GenerateGameDescriptionInput = z.infer<
  typeof GenerateGameDescriptionInputSchema
>;

const GenerateGameDescriptionOutputSchema = z.object({
  gameDescription: z.string().describe('A description of the game.'),
});

export type GenerateGameDescriptionOutput = z.infer<
  typeof GenerateGameDescriptionOutputSchema
>;

export async function generateGameDescription(
  input: GenerateGameDescriptionInput
): Promise<GenerateGameDescriptionOutput> {
  return generateGameDescriptionFlow(input);
}

const generateGameDescriptionPrompt = ai.definePrompt({
  name: 'generateGameDescriptionPrompt',
  input: {schema: GenerateGameDescriptionInputSchema},
  output: {schema: GenerateGameDescriptionOutputSchema},
  prompt: `You are a casino game expert. Generate a concise and engaging description for the game: {{{gameTitle}}}. The description should explain the game's objective, how to play, and what makes it unique and fun.`,
});

const generateGameDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGameDescriptionFlow',
    inputSchema: GenerateGameDescriptionInputSchema,
    outputSchema: GenerateGameDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateGameDescriptionPrompt(input);
    return output!;
  }
);
