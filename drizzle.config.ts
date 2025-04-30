import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CF_ACCOUNT_ID || '',
		databaseId: process.env.CF_DB_ID || '',
		token: process.env.CF_API_TOKEN || ''
	}
} satisfies Config;
