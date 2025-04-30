import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET() {
  try {
    const db = createClient();
    const sketches = await db.getSketches();
    return json(sketches);
  } catch (error) {
    console.error('Failed to fetch sketches:', error);
    return new Response('Failed to fetch sketches', { status: 500 });
  }
}

export async function POST({ request }: RequestEvent) {
  try {
    const sketch = await request.json();
    const db = createClient();
    await db.createSketch(sketch);
    return new Response(null, { status: 201 });
  } catch (error) {
    console.error('Failed to create sketch:', error);
    return new Response('Failed to create sketch', { status: 500 });
  }
}

export async function PUT({ request }: RequestEvent) {
  try {
    const { updates } = await request.json();
    const db = createClient();
    await db.updateSketchOrder(updates);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to update sketch order:', error);
    return new Response('Failed to update sketch order', { status: 500 });
  }
}

export async function PATCH({ request }: RequestEvent) {
  try {
    const { id, locked } = await request.json();
    const db = createClient();
    await db.toggleSketchLock(id, locked);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to toggle sketch lock:', error);
    return new Response('Failed to toggle sketch lock', { status: 500 });
  }
}

export async function DELETE({ params }: RequestEvent) {
  try {
    const { id } = params;
    const db = createClient();
    await db.deleteSketch(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete sketch:', error);
    return new Response('Failed to delete sketch', { status: 500 });
  }
} 