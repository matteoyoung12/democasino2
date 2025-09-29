
'use server';

/**
 * @fileOverview Generates the crash curve for the Crash game using GenAI and a seed for unpredictability and fairness.
 *
 * - generateCrashCurve - A function that generates the crash curve.
 * - GenerateCrashCurveInput - The input type for the generateCrashCurve function.
 * - GenerateCrashCurveOutput - The return type for the generateCrashCurve function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCrashCurveInputSchema = z.object({
  seed: z
    .string()
    .describe('The seed to use for generating the crash curve.'),
});
export type GenerateCrashCurveInput = z.infer<
  typeof GenerateCrashCurveInputSchema
>;

const GenerateCrashCurveOutputSchema = z.object({
  curveData: z
    .array(z.number())
    .describe('The generated crash curve data as an array of numbers.'),
});
export type GenerateCrashCurveOutput = z.infer<
  typeof GenerateCrashCurveOutputSchema
>;

export async function generateCrashCurve(
  input: GenerateCrashCurveInput
): Promise<GenerateCrashCurveOutput> {
  return generateCrashCurveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCrashCurvePrompt',
  input: {schema: GenerateCrashCurveInputSchema},
  output: {schema: GenerateCrashCurveOutputSchema},
  prompt: `You are an expert game developer specializing in fair and engaging game mechanics.

You will generate the crash curve data for a Crash game based on the provided seed. The crash curve data should be an array of numbers representing the multiplier at different points in time.

The goal is to create a curve that is unpredictable and fair, ensuring a unique and engaging experience for each game.

Seed: {{{seed}}}

Generate the crash curve data:
`,
});

const generateCrashCurveFlow = ai.defineFlow(
  {
    name: 'generateCrashCurveFlow',
    inputSchema: GenerateCrashCurveInputSchema,
    outputSchema: GenerateCrashCurveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
