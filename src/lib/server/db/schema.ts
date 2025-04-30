import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

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
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const sketches = sqliteTable('sketches', {
	id: text('id').primaryKey(),
	show_id: text('show_id').notNull().references(() => sketchShows.id),
	title: text('title').notNull(),
	description: text('description'),
	duration: integer('duration').notNull(),
	chars: integer('chars').notNull(),
	casted: integer('casted').notNull(),
	locked: integer('locked').notNull().default(0),
	position: integer('position').notNull(),
	raw_data: text('raw_data'),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const castMembers = sqliteTable('cast_members', {
	id: text('id').primaryKey(),
	sketch_id: text('sketch_id').notNull().references(() => sketches.id),
	name: text('name').notNull(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const characterPerformers = sqliteTable('character_performers', {
	id: text('id').primaryKey(),
	sketch_id: text('sketch_id').notNull().references(() => sketches.id),
	character_name: text('character_name').notNull(),
	performer_name: text('performer_name').notNull(),
	created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
