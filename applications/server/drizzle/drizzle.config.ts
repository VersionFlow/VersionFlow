import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	out: './drizzle',
	schema: './schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		// TODO; use env after checking
		url: process.env.DATABASE_URL as string,
	},
})
