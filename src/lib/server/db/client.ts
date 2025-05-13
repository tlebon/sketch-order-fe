import type { Database } from 'better-sqlite3';
import { characterPerformers, sketches } from './schema';
import type { CharacterPerformer, Sketch } from '$lib/server/db/types';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export class DbClient {
  private db: ReturnType<typeof drizzle>;

  constructor(db: Database) {
    this.db = drizzle(db);
  }

  async createSketch(sketch: Omit<Sketch, 'id' | 'created_at' | 'updated_at'>): Promise<Sketch> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(sketches).values({
      id,
      show_id: sketch.show_id,
      title: sketch.title,
      description: sketch.description,
      duration: sketch.duration,
      chars: sketch.chars,
      casted: sketch.casted,
      locked: sketch.locked,
      position: sketch.position,
      raw_data: sketch.raw_data,
      created_at: now,
      updated_at: now
    });

    const result = await this.getSketch(id);
    if (!result) {
      throw new Error(`Failed to create sketch with id ${id}`);
    }
    return result;
  }

  async updateSketch(id: string, sketch: Partial<Sketch>): Promise<Sketch> {
    const now = new Date().toISOString();

    await this.db
      .update(sketches)
      .set({
        ...sketch,
        updated_at: now
      })
      .where(sql`id = ${id}`);

    const result = await this.getSketch(id);
    if (!result) {
      throw new Error(`Failed to update sketch with id ${id}`);
    }
    return result;
  }

  async getCharacterPerformers(sketchId: string): Promise<CharacterPerformer[]> {
    return await this.db
      .select()
      .from(characterPerformers)
      .where(sql`sketch_id = ${sketchId}`);
  }

  async addCharacterPerformer(
    sketchId: string,
    characterName: string,
    performerName: string
  ): Promise<CharacterPerformer> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(characterPerformers).values({
      id,
      sketch_id: sketchId,
      character_name: characterName,
      performer_name: performerName,
      created_at: now,
      updated_at: now
    });

    const result = await this.getCharacterPerformer(id);
    if (!result) {
      throw new Error(`Failed to create character performer with id ${id}`);
    }
    return result;
  }

  async updateCharacterPerformer(id: string, performerName: string): Promise<CharacterPerformer> {
    const now = new Date().toISOString();

    await this.db
      .update(characterPerformers)
      .set({ performer_name: performerName, updated_at: now })
      .where(sql`id = ${id}`);

    const result = await this.getCharacterPerformer(id);
    if (!result) {
      throw new Error(`Failed to update character performer with id ${id}`);
    }
    return result;
  }

  async deleteCharacterPerformer(id: string): Promise<void> {
    await this.db
      .delete(characterPerformers)
      .where(sql`id = ${id}`);
  }

  async getCharacterPerformer(id: string): Promise<CharacterPerformer | null> {
    const result = await this.db
      .select()
      .from(characterPerformers)
      .where(sql`id = ${id}`);
    return result[0] || null;
  }

  async getSketch(id: string): Promise<Sketch | null> {
    const result = await this.db
      .select()
      .from(sketches)
      .where(sql`id = ${id}`);
    return result[0] || null;
  }
}
