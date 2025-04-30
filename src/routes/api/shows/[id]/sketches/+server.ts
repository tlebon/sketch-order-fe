import { json } from '@sveltejs/kit';
import { createClient } from '$lib/server/db';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ params }: RequestEvent) {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing show ID', { status: 400 });
    }
    const db = createClient();
    const sketches = await db.getSketches(id);
    return json(sketches);
  } catch (error) {
    console.error('Failed to fetch sketches:', error);
    return new Response('Failed to fetch sketches', { status: 500 });
  }
}

export async function POST({ params, request }: RequestEvent) {
  try {
    const { id } = params;
    if (!id) {
      return new Response('Missing show ID', { status: 400 });
    }
    const sketch = await request.json();
    const db = createClient();
    await db.createSketch({ ...sketch, show_id: id });
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