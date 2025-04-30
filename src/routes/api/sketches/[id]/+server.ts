import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function DELETE({ params }: RequestEvent) {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing sketch ID', { status: 400 });
    }
    const db = createClient();
    await db.deleteSketch(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete sketch:', error);
    return new Response('Failed to delete sketch', { status: 500 });
  }
} 