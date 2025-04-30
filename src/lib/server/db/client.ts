import { characterPerformers, sketches } from './schema';
import { sql } from 'drizzle-orm';

async createSketch(sketch: Omit<Sketch, 'id' | 'created_at' | 'updated_at'>) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stmt = this.db.prepare(`
    INSERT INTO sketches (
      id, show_id, title, description, duration, chars, casted, locked, position, raw_data, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    sketch.show_id,
    sketch.title,
    sketch.description,
    sketch.duration,
    sketch.chars,
    sketch.casted,
    sketch.locked ? 1 : 0,
    sketch.position,
    sketch.raw_data,
    now,
    now
  );
  return { ...sketch, id, created_at: now, updated_at: now };
}

async updateSketch(id: string, sketch: Partial<Sketch>) {
  const now = new Date().toISOString();
  const stmt = this.db.prepare(`
    UPDATE sketches
    SET title = ?,
        description = ?,
        duration = ?,
        chars = ?,
        casted = ?,
        locked = ?,
        position = ?,
        raw_data = ?,
        updated_at = ?
    WHERE id = ?
  `);
  stmt.run(
    sketch.title,
    sketch.description,
    sketch.duration,
    sketch.chars,
    sketch.casted,
    sketch.locked ? 1 : 0,
    sketch.position,
    sketch.raw_data,
    now,
    id
  );
  return this.getSketch(id);
}

async getCharacterPerformers(sketchId: string) {
  return await this.db
    .select()
    .from(characterPerformers)
    .where(sql`sketch_id = ${sketchId}`)
    .orderBy(characterPerformers.character_name);
}

async addCharacterPerformer(sketchId: string, characterName: string, performerName: string) {
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
  return { id, sketch_id: sketchId, character_name: characterName, performer_name: performerName, created_at: now, updated_at: now };
}

async updateCharacterPerformer(id: string, performerName: string) {
  const now = new Date().toISOString();
  await this.db
    .update(characterPerformers)
    .set({ performer_name: performerName, updated_at: now })
    .where(sql`id = ${id}`);
  return this.getCharacterPerformer(id);
}

async deleteCharacterPerformer(id: string) {
  await this.db
    .delete(characterPerformers)
    .where(sql`id = ${id}`);
}

async getCharacterPerformer(id: string) {
  const result = await this.db
    .select()
    .from(characterPerformers)
    .where(sql`id = ${id}`);
  return result[0] || null;
}

export class DatabaseClient {
} 