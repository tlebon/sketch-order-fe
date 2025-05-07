import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { CharacterPerformer } from '$lib/types';
import type { NewSketchTechDetails } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { show_id, importType, data } = await request.json();

    if (!show_id) {
      return json({ error: 'Show ID is required' }, { status: 400 });
    }
    if (!importType || (importType !== 'sketches' && importType !== 'techDetails')) {
      return json({ error: 'Invalid importType. Must be \'sketches\' or \'techDetails\'.' }, { status: 400 });
    }
    if (!Array.isArray(data)) {
      return json({ error: 'Data must be an array' }, { status: 400 });
    }

    const db = createClient();
    const results = [];

    if (importType === 'sketches') {
      for (const sketch of data) {
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
        results.push({ success: true, sketch: newSketch });
      }
    } else if (importType === 'techDetails') {
      const existingSketches = await db.getSketches(show_id);
      if (!existingSketches) {
        return json({ error: 'Could not retrieve sketches for the show.' }, { status: 500 });
      }

      for (const techItem of data) {
        const sketchNameFromCsv = techItem.sketch;
        
        const matchedSketch = existingSketches.find(
          s => s.title.toLowerCase() === sketchNameFromCsv?.toLowerCase()
        );

        if (matchedSketch) {
          const techDataToUpsert: NewSketchTechDetails = {
            id: crypto.randomUUID(),
            sketch_id: matchedSketch.id,
            cues: techItem.cues || null,
            props: techItem.props || null,
            costume: techItem.costume || null,
            stage_dressing: techItem['stage dressing'] || techItem.stage_dressing || null,
          };
          try {
            const upsertedTechDetail = await db.upsertSketchTechDetails(techDataToUpsert);
            results.push({ success: true, sketch_name: sketchNameFromCsv, tech_details_id: upsertedTechDetail && upsertedTechDetail[0] ? upsertedTechDetail[0].id : null });
          } catch (upsertError) {
            console.error(`Error upserting tech details for sketch '${sketchNameFromCsv}':`, upsertError);
            results.push({ success: false, sketch_name: sketchNameFromCsv, error: 'Failed to save tech details.' });
          }
        } else {
          results.push({ success: false, sketch_name: sketchNameFromCsv, error: 'Matching sketch not found.' });
        }
      }
    }

    return json(results);
  } catch (error) {
    console.error('Error importing data:', error);
    let errorMessage = 'Failed to import data';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return json({ error: errorMessage }, { status: 500 });
  }
}; 