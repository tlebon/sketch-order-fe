import { error } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;
  if (!id) {
    throw error(400, 'Missing show ID');
  }

  const db = createClient();
  const show = await db.getSketchShow(id);
  if (!show) {
    throw error(404, 'Show not found');
  }

  const sketches = await db.getSketches(id);

  // TEMPORARY LOGGING: REMOVED
  // console.log(`Sketches for show ${id} from +page.server.ts:`, JSON.stringify(sketches, null, 2));

  return {
    show,
    sketches
  };
}; 