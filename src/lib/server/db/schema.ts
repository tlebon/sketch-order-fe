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

export const sketches = sqliteTable('sketches', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	duration: integer('duration').notNull(),
	chars: integer('chars').notNull(),
	casted: integer('casted').notNull(),
	locked: integer('locked', { mode: 'boolean' }).notNull().default(false),
	position: integer('position').notNull(),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const castMembers = sqliteTable('cast_members', {
	id: text('id').primaryKey(),
	sketchId: text('sketch_id').notNull().references(() => sketches.id),
	name: text('name').notNull(),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
