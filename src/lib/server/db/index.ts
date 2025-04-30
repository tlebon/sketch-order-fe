import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sketches, castMembers, sketchShows } from './schema';
import { sql } from 'drizzle-orm';
import { join } from 'path';

// Initialize SQLite database for local development
const dbPath = join(process.cwd(), 'sketches.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create tables if they don't exist
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sketch_shows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sketches (
      id TEXT PRIMARY KEY,
      show_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      chars INTEGER NOT NULL,
      casted INTEGER NOT NULL,
      locked INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (show_id) REFERENCES sketch_shows(id)
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
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export function createClient() {
  return {
    // Sketch Show operations
    async getSketchShows() {
      return await db.select().from(sketchShows).orderBy(sketchShows.created_at);
    },

    async getSketchShow(id: string) {
      const shows = await db
        .select()
        .from(sketchShows)
        .where(sql`id = ${id}`);
      return shows[0] || null;
    },

    async createSketchShow(data: { id: string; title: string; description?: string }) {
      await db.insert(sketchShows).values(data);
    },

    async deleteSketchShow(id: string) {
      await db.delete(sketchShows).where(sql`id = ${id}`);
    },

    // Sketch operations
    async getSketches(showId: string) {
      const sketchRows = await db
        .select()
        .from(sketches)
        .where(sql`show_id = ${showId}`)
        .orderBy(sketches.position);
      
      if (sketchRows.length === 0) {
        return [];
      }

      const castRows = await db
        .select()
        .from(castMembers)
        .where(sql`sketch_id IN (${sql.join(sketchRows.map(s => s.id), sql`, `)})`);
      
      return sketchRows.map(sketch => ({
        ...sketch,
        cast: castRows
          .filter(cast => cast.sketch_id === sketch.id)
          .map(cast => cast.name)
      }));
    },

    async createSketch(data: {
      id: string;
      show_id: string;
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
      
      await db.insert(sketches).values({
        ...sketchData,
        locked: data.locked ? 1 : 0
      });
      
      if (cast.length > 0) {
        await db.insert(castMembers).values(
          cast.map(name => ({
            id: crypto.randomUUID(),
            sketch_id: data.id,
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
        .set({ locked: locked ? 1 : 0 })
        .where(sql`id = ${id}`);
    },

    async deleteSketch(id: string) {
      await db
        .delete(sketches)
        .where(sql`id = ${id}`);
    }
  };
}
