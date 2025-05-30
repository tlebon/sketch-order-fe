import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function DELETE({ params }: RequestEvent) {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing show ID', { status: 400 });
    }
    const db = createClient();
    db.deleteSketchShow(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete show:', error);
    return new Response('Failed to delete show', { status: 500 });
  }
}
