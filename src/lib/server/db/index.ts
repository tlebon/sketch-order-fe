import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sketches, sketchShows, characterPerformers, sketchTechDetails, type NewSketchTechDetails } from './schema';
import { sql, eq } from 'drizzle-orm';
import { join } from 'path';

// Use DATABASE_URL from .env if available, otherwise default to sketches.db
const dbPath = process.env.DATABASE_URL || join(process.cwd(), 'sketches.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Export the db instance
export { db };

// Create tables if they don't exist
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sketch_shows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      position INTEGER NOT NULL DEFAULT 0,
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

type NewSketch = {
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
};

export function createClient() {
  return {
    // Sketch Show operations
    async getSketchShows() {
      return await db.select().from(sketchShows).orderBy(sketchShows.position);
    },

    async getSketchShow(id: string) {
      const shows = await db
        .select()
        .from(sketchShows)
        .where(sql`id = ${id}`);
      return shows[0] || null;
    },

    async createSketchShow(data: { id: string; title: string; description?: string }) {
      const now = new Date().toISOString();
      await db.insert(sketchShows).values({
        ...data,
        created_at: now,
        updated_at: now
      });
    },

    deleteSketchShow(id: string) {
      db.transaction((tx) => {
        const sketchIdsToDelete = tx
          .select({ id: sketches.id })
          .from(sketches)
          .where(eq(sketches.show_id, id))
          .all();

        if (sketchIdsToDelete.length > 0) {
          const ids = sketchIdsToDelete.map(s => s.id);

          tx.delete(characterPerformers)
            .where(sql`sketch_id IN (${sql.join(ids, sql`, `)})`)
            .run();

          tx.delete(sketchTechDetails)
            .where(sql`sketch_id IN (${sql.join(ids, sql`, `)})`)
            .run();

          tx.delete(sketches)
            .where(sql`show_id = ${id}`)
            .run();
        }

        tx.delete(sketchShows)
          .where(sql`id = ${id}`)
          .run();
      });
    },

    // Sketch operations
    async getSketches(showId: string | undefined) {
      const query = db
        .select({
          // select all columns from sketches
          id: sketches.id,
          show_id: sketches.show_id,
          title: sketches.title,
          description: sketches.description,
          duration: sketches.duration,
          chars: sketches.chars,
          casted: sketches.casted,
          locked: sketches.locked,
          position: sketches.position,
          raw_data: sketches.raw_data,
          created_at: sketches.created_at,
          updated_at: sketches.updated_at,
          // select tech details
          tech_id: sketchTechDetails.id,
          tech_cues: sketchTechDetails.cues,
          tech_props: sketchTechDetails.props,
          tech_costume: sketchTechDetails.costume,
          tech_stage_dressing: sketchTechDetails.stage_dressing,
          tech_chairs: sketchTechDetails.chairs,
          tech_stools: sketchTechDetails.stools,
          tech_other_props: sketchTechDetails.other_props,
          tech_created_at: sketchTechDetails.created_at,
          tech_updated_at: sketchTechDetails.updated_at
        })
        .from(sketches)
        .leftJoin(sketchTechDetails, eq(sketches.id, sketchTechDetails.sketch_id))
        .orderBy(sketches.position);

      if (showId) {
        query.where(eq(sketches.show_id, showId));
      } else {
        query.where(sql`1=1`); // Keep this if no showId to fetch all, or adjust as needed
      }

      const rows = await query;

      if (rows.length === 0) {
        return [];
      }

      const sketchIds = rows.map(r => r.id);
      const characterPerformerRows = await db
        .select()
        .from(characterPerformers)
        .where(sql`sketch_id IN (${sql.join(sketchIds, sql`, `)})`);

      return rows.map(row => {
        const sketchPart = {
          id: row.id,
          show_id: row.show_id,
          title: row.title,
          description: row.description,
          duration: row.duration,
          chars: row.chars,
          casted: row.casted,
          locked: Boolean(row.locked),
          position: row.position,
          raw_data: row.raw_data,
          created_at: row.created_at,
          updated_at: row.updated_at,
          character_performers: characterPerformerRows
            .filter(cp => cp.sketch_id === row.id)
            .map(cp => ({
              id: cp.id,
              sketch_id: cp.sketch_id,
              character_name: cp.character_name,
              performer_name: cp.performer_name,
              created_at: cp.created_at,
              updated_at: cp.updated_at
            }))
        };

        const techDetailsPart = row.tech_id ? {
          id: row.tech_id,
          sketch_id: row.id,
          cues: row.tech_cues,
          props: row.tech_props,
          costume: row.tech_costume,
          stage_dressing: row.tech_stage_dressing,
          chairs: row.tech_chairs || 0,
          stools: row.tech_stools || 0,
          other_props: row.tech_other_props,
          created_at: row.tech_created_at,
          updated_at: row.tech_updated_at
        } : null;

        return {
          ...sketchPart,
          techDetails: techDetailsPart
        };
      });
    },

    async createSketch(sketch: NewSketch) {
      const { character_performers, ...sketchData } = sketch;
      const now = new Date().toISOString();
      const sketchWithTimestamps = { ...sketchData, created_at: now, updated_at: now };

      const result = await db.insert(sketches).values(sketchWithTimestamps).returning();
      const newSketch = result[0];

      if (character_performers && character_performers.length > 0) {
        const characterPerformerValues = character_performers.map((cp: { character_name: string; performer_name: string }) => ({
          id: crypto.randomUUID(),
          sketch_id: newSketch.id,
          character_name: cp.character_name,
          performer_name: cp.performer_name,
          created_at: now,
          updated_at: now
        }));
        await db.insert(characterPerformers).values(characterPerformerValues);
      }

      return newSketch;
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
    },

    async deleteSketch(id: string) {
      // Use a transaction to ensure atomicity
      await db.transaction(async (tx) => {
        await tx.delete(characterPerformers).where(sql`sketch_id = ${id}`);
        await tx.delete(sketchTechDetails).where(sql`sketch_id = ${id}`);
        await tx.delete(sketches).where(sql`id = ${id}`);
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
    },

    // New function to upsert sketch tech details
    async upsertSketchTechDetails(data: NewSketchTechDetails) {
      const now = new Date().toISOString();
      const finalData = {
        ...data,
        id: data.id || crypto.randomUUID(), // Ensure ID exists for insert
        created_at: now, // Set created_at for new entries
        updated_at: now  // Always update updated_at
      };

      // Drizzle ORM's way to do an "upsert" for SQLite:
      // Insert the new row. If a conflict occurs on the sketch_id (because it's unique),
      // then update the existing row.
      return await db.insert(sketchTechDetails)
        .values(finalData)
        .onConflictDoUpdate({
          target: sketchTechDetails.sketch_id, // Conflict target
          set: { // Fields to update on conflict
            cues: finalData.cues,
            props: finalData.props,
            costume: finalData.costume,
            stage_dressing: finalData.stage_dressing,
            chairs: finalData.chairs,
            stools: finalData.stools,
            other_props: finalData.other_props,
            updated_at: now // Ensure updated_at is set on update
          }
        })
        .returning();
    }
  };
}
