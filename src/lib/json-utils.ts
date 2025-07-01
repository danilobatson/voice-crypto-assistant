/**
 * Safely parse JSON from AI model responses that may include markdown formatting
 */
export function parseAIResponse(responseText: string): any {
  try {
    // First, try parsing as-is
    return JSON.parse(responseText);
  } catch (error) {
    try {
      // Remove markdown code blocks and extract JSON
      const cleanedText = responseText
        .replace(/```json\s*/g, '') // Remove opening ```json
        .replace(/```\s*/g, '')     // Remove closing ```
        .replace(/^[\s\n]*/, '')    // Remove leading whitespace
        .replace(/[\s\n]*$/, '')    // Remove trailing whitespace
        .trim();
      
      return JSON.parse(cleanedText);
    } catch (secondError) {
      try {
        // Try to extract JSON from between any brackets
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON found in response');
      } catch (thirdError) {
        console.error('❌ All JSON parsing attempts failed:', {
          original: responseText.substring(0, 200),
          firstError: error instanceof Error ? error.message : String(error),
          secondError: secondError instanceof Error ? secondError.message : String(secondError),
          thirdError: thirdError instanceof Error ? thirdError.message : String(thirdError)
        });
        throw new Error('Failed to parse AI response as JSON');
      }
    }
  }
}

/**
 * Enhanced Gemini prompt that strongly emphasizes JSON-only responses
 */
export function createStrictJSONPrompt(basePrompt: string): string {
  return `${basePrompt}

CRITICAL: Respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or code blocks. 
Start your response directly with { and end with }. No additional text before or after the JSON.`;
}
