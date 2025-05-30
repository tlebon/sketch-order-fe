import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestHandler } from './$types';
import type { CharacterPerformer } from '$lib/types';
import type { NewSketchTechDetails } from '$lib/server/db/schema';
import { parseStageDressing } from '$lib/utils/stageDressing';

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
      // Get the current number of sketches for this show
      const existingSketches = await db.getSketches(show_id);
      const startPosition = existingSketches ? existingSketches.length : 0;

      for (const [i, sketch] of data.entries()) {
        console.log('Inserting sketch:', sketch);
        try {
          const newSketch = await db.createSketch({
            id: crypto.randomUUID(),
            show_id,
            title: sketch.title,
            description: sketch.description || '',
            duration: sketch.duration,
            chars: sketch.chars,
            casted: sketch.character_performers?.length || 0,
            locked: false,
            position: startPosition + i,
            raw_data: JSON.stringify(sketch.raw_data),
            character_performers: sketch.character_performers?.map((cp: CharacterPerformer) => ({
              character_name: cp.character_name,
              performer_name: cp.performer_name
            })) || []
          });

          // Upsert tech details if present in the imported sketch
          if (
            sketch.stage_dressing ||
            typeof sketch.chairs === 'number' ||
            typeof sketch.stools === 'number' ||
            (typeof sketch.other_props === 'string' && sketch.other_props.length > 0)
          ) {
            const techDataToUpsert: NewSketchTechDetails = {
              id: crypto.randomUUID(),
              sketch_id: newSketch.id,
              cues: null,
              props: null,
              costume: null,
              stage_dressing: sketch.stage_dressing || null,
              chairs: typeof sketch.chairs === 'number' ? sketch.chairs : 0,
              stools: typeof sketch.stools === 'number' ? sketch.stools : 0,
              other_props: typeof sketch.other_props === 'string' ? sketch.other_props : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            try {
              await db.upsertSketchTechDetails(techDataToUpsert);
            } catch (upsertError) {
              console.error(`Error upserting tech details for sketch '${sketch.title}':`, upsertError);
            }
          }

          results.push({ success: true, sketch: newSketch });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('Failed to insert sketch:', err);
          results.push({ success: false, error: errorMsg, sketch });
        }
      }
    } else {
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
          const stageDressing = techItem['stage dressing'] || techItem.stage_dressing || null;
          const { chairs, stools, other_props } = parseStageDressing(stageDressing);

          const techDataToUpsert: NewSketchTechDetails = {
            id: crypto.randomUUID(),
            sketch_id: matchedSketch.id,
            cues: techItem.cues || null,
            props: techItem.props || null,
            costume: techItem.costume || null,
            stage_dressing: stageDressing,
            chairs,
            stools,
            other_props,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
