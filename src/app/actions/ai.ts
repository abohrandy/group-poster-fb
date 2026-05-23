'use server';

import { validateSession } from '@/lib/auth';
import { generateCaptionVariations } from '@/lib/ai';

export async function generateCaptionsAction(
  content: string
): Promise<{ error?: string; success?: string; variations?: Array<{ tone: string; caption: string }> }> {
  const session = await validateSession();
  if (!session) {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  if (!content) {
    return { error: 'Text content is required to generate variations.' };
  }

  try {
    const variations = await generateCaptionVariations(content);
    return {
      success: 'Successfully generated caption variations.',
      variations,
    };
  } catch (err: any) {
    console.error('Caption generation action error:', err);
    return { error: err.message || 'Failed to generate captions.' };
  }
}
