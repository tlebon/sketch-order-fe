import { createClient } from '$lib/server/db';

export async function load() {
  const db = createClient();
  const sketches = await db.getSketches();
  return { sketches };
} 