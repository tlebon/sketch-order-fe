import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET() {
  try {
    const db = createClient();
    const shows = await db.getSketchShows();
    return json(shows);
  } catch (error) {
    console.error('Failed to fetch shows:', error);
    return new Response('Failed to fetch shows', { status: 500 });
  }
}

export async function POST({ request }: RequestEvent) {
  try {
    const show = await request.json();
    const db = createClient();
    await db.createSketchShow(show);
    return new Response(null, { status: 201 });
  } catch (error) {
    console.error('Failed to create show:', error);
    return new Response('Failed to create show', { status: 500 });
  }
}

export async function PUT({ request }: RequestEvent) {
  try {
    const { updates } = await request.json();
    const db = createClient();
    await db.updateSketchOrder(updates);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to update show order:', error);
    return new Response('Failed to update show order', { status: 500 });
  }
} 