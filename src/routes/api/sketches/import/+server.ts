import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { CharacterPerformer } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { show_id, sketches: sketchData } = await request.json();

    if (!show_id) {
      return json({ error: 'Show ID is required' }, { status: 400 });
    }

    if (!Array.isArray(sketchData)) {
      return json({ error: 'Sketches must be an array' }, { status: 400 });
    }

    const db = createClient();
    const newSketches = [];

    for (const sketch of sketchData) {
      const newSketch = await db.createSketch({
        id: crypto.randomUUID(),
        show_id,
        title: sketch.title,
        description: sketch.description || '',
        duration: sketch.duration,
        chars: sketch.chars,
        casted: sketch.character_performers?.length || 0,
        locked: false,
        position: sketch.position,
        raw_data: sketch.raw_data,
        character_performers: sketch.character_performers?.map((cp: CharacterPerformer) => ({
          character_name: cp.character_name,
          performer_name: cp.performer_name
        })) || []
      });
      newSketches.push(newSketch);
    }

    return json(newSketches);
  } catch (error) {
    console.error('Error importing sketches:', error);
    return json({ error: 'Failed to import sketches' }, { status: 500 });
  }
}; 