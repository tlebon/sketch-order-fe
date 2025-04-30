import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sketches, castMembers } from './schema';
import { sql } from 'drizzle-orm';

// Initialize SQLite database for local development
const sqlite = new Database('sketches.db');
const db = drizzle(sqlite);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sketches (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration INTEGER NOT NULL,
    chars INTEGER NOT NULL,
    casted INTEGER NOT NULL,
    locked INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS cast_members (
    id TEXT PRIMARY KEY,
    sketch_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sketch_id) REFERENCES sketches(id)
  )
`);

export function createClient() {
  return {
    async getSketches() {
      const sketchRows = await db.select().from(sketches).orderBy(sketches.position);
      const castRows = await db.select().from(castMembers);
      
      return sketchRows.map(sketch => ({
        ...sketch,
        cast: castRows
          .filter(cast => cast.sketchId === sketch.id)
          .map(cast => cast.name)
      }));
    },

    async createSketch(data: {
      id: string;
      title: string;
      description: string;
      duration: number;
      chars: number;
      casted: number;
      locked: boolean;
      position: number;
      cast: string[];
    }) {
      const { cast, ...sketchData } = data;
      
      await db.insert(sketches).values(sketchData);
      
      if (cast.length > 0) {
        await db.insert(castMembers).values(
          cast.map(name => ({
            id: crypto.randomUUID(),
            sketchId: data.id,
            name
          }))
        );
      }
    },

    async updateSketchOrder(sketchUpdates: { id: string; position: number }[]) {
      for (const update of sketchUpdates) {
        await db
          .update(sketches)
          .set({ position: update.position })
          .where(sql`id = ${update.id}`);
      }
    },

    async toggleSketchLock(id: string, locked: boolean) {
      await db
        .update(sketches)
        .set({ locked })
        .where(sql`id = ${id}`);
    }
  };
}
