import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function PUT({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing sketch ID', { status: 400 });
    }
    const data = await request.json();
    const db = createClient();
    const updatedSketch = await db.updateSketch(id, data);
    return new Response(JSON.stringify(updatedSketch), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to update sketch:', error);
    return new Response('Failed to update sketch', { status: 500 });
  }
}

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