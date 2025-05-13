import { text, integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const sketchShows = sqliteTable('sketch_shows', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	position: integer('position').notNull().default(0),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull()
});

export const sketches = sqliteTable('sketches', {
	id: text('id').primaryKey(),
	show_id: text('show_id').notNull().references(() => sketchShows.id),
	title: text('title').notNull(),
	description: text('description'),
	duration: integer('duration').notNull(),
	chars: integer('chars').notNull(),
	casted: integer('casted').notNull(),
	locked: integer('locked', { mode: 'boolean' }).notNull().default(false),
	position: integer('position').notNull(),
	raw_data: text('raw_data'),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull()
});

export const sketchTechDetails = sqliteTable('sketch_tech_details', {
	id: text('id').primaryKey(),
	sketch_id: text('sketch_id').notNull().references(() => sketches.id),
	cues: text('cues'),
	props: text('props'),
	costume: text('costume'),
	stage_dressing: text('stage_dressing'),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull()
}, (table) => ({
	sketchIdx: uniqueIndex('sketch_tech_details_sketch_id_idx').on(table.sketch_id),
}));

export const castMembers = sqliteTable('cast_members', {
	id: text('id').primaryKey(),
	sketch_id: text('sketch_id').notNull().references(() => sketches.id),
	name: text('name').notNull(),
	created_at: text('created_at').notNull()
});

export const characterPerformers = sqliteTable('character_performers', {
	id: text('id').primaryKey(),
	sketch_id: text('sketch_id').notNull().references(() => sketches.id),
	character_name: text('character_name').notNull(),
	performer_name: text('performer_name').notNull(),
	created_at: text('created_at').notNull(),
	updated_at: text('updated_at').notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Sketch = typeof sketches.$inferSelect;

export type CharacterPerformer = typeof characterPerformers.$inferSelect;

export type NewSketch = typeof sketches.$inferInsert;

export type NewCharacterPerformer = typeof characterPerformers.$inferInsert;

export type NewSketchTechDetails = typeof sketchTechDetails.$inferInsert;
