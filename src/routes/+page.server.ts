import { createClient } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const db = createClient();
  const shows = await db.getSketchShows();

  return {
    shows
  };
}; 