import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sketches, sketchShows, characterPerformers } from './schema';
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
      raw_data TEXT,
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

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS character_performers (
      id TEXT PRIMARY KEY,
      sketch_id TEXT NOT NULL,
      character_name TEXT NOT NULL,
      performer_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
    async getSketches(showId: string | undefined) {
      const sketchRows = await db
        .select()
        .from(sketches)
        .where(showId ? sql`show_id = ${showId}` : sql`1=1`)
        .orderBy(sketches.position);
      
      if (sketchRows.length === 0) {
        return [];
      }

      const characterPerformerRows = await db
        .select()
        .from(characterPerformers)
        .where(sql`sketch_id IN (${sql.join(sketchRows.map(s => s.id), sql`, `)})`);
      
      return sketchRows.map(sketch => ({
        ...sketch,
        character_performers: characterPerformerRows
          .filter(cp => cp.sketch_id === sketch.id)
          .map(cp => ({
            id: cp.id,
            sketch_id: cp.sketch_id,
            character_name: cp.character_name,
            performer_name: cp.performer_name,
            created_at: cp.created_at,
            updated_at: cp.updated_at
          }))
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
      raw_data?: string;
      character_performers?: { character_name: string; performer_name: string }[];
    }) {
      const { character_performers, ...sketchData } = data;
      const now = new Date().toISOString();

      try {
        // Use Drizzle's transaction API
        const createdSketchResult = await db.transaction(async (tx) => {
          // Create the sketch
          const [sketch] = await tx.insert(sketches).values({
            ...sketchData,
            raw_data: sketchData.raw_data ? JSON.stringify(sketchData.raw_data) : null, // Stringify raw_data
            locked: data.locked ? 1 : 0,
            created_at: now,
            updated_at: now
          }).returning();
          
          // Create character performers if they exist, one by one within the transaction
          if (character_performers?.length) {
            for (const cp of character_performers) {
              const performerId = crypto.randomUUID(); // Ensure unique ID for each performer
              
              const performerData = {
                id: performerId,
                sketch_id: sketch.id, 
                character_name: cp.character_name,
                performer_name: cp.performer_name,
                created_at: now,
                updated_at: now
              };
              await tx.insert(characterPerformers).values(performerData);
            }
          }
          
          // Return the created sketch ID to fetch the full object later
          return sketch;
        });

        // Get the complete sketch with its character performers outside the transaction
        const finalSketches = await this.getSketches(createdSketchResult.show_id);
        return finalSketches.find(s => s.id === createdSketchResult.id) || createdSketchResult;
        
      } catch (error) {
        console.error('Error in createSketch transaction:', error); // Keep this generic error log
        // No need to explicitly rollback, db.transaction handles it on error
        throw error;
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
      // Use a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // First, delete associated character performers
        await tx
          .delete(characterPerformers)
          .where(sql`sketch_id = ${id}`);
        
        // Then, delete the sketch itself
        await tx
          .delete(sketches)
          .where(sql`id = ${id}`);
      });
    },

    async updateSketch(id: string, data: {
      title?: string;
      description?: string;
      duration?: number;
      chars?: number;
      casted?: number;
      locked?: boolean;
      position?: number;
      raw_data?: string;
      character_performers?: { character_name: string; performer_name: string }[];
    }) {
      const { character_performers, ...sketchData } = data;
      
      if (Object.keys(sketchData).length > 0) {
        await db
          .update(sketches)
          .set({
            ...sketchData,
            locked: data.locked ? 1 : 0,
            updated_at: new Date().toISOString()
          })
          .where(sql`id = ${id}`);
      }

      if (character_performers) {
        // Delete existing character performers
        await db
          .delete(characterPerformers)
          .where(sql`sketch_id = ${id}`);

        // Insert new character performers
        if (character_performers.length > 0) {
          await db.insert(characterPerformers).values(
            character_performers.map(cp => ({
              id: crypto.randomUUID(),
              sketch_id: id,
              character_name: cp.character_name,
              performer_name: cp.performer_name,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          );
        }
      }

      return this.getSketches(id);
    }
  };
}
