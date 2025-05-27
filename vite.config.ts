import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	base: process.env.NODE_ENV === 'production' ? '/sketch-order-fe/' : '/',
	server: {
		host: true,
		port: 5173
	},
	build: {
		rollupOptions: {
			external: ['svelte-dnd-action']
		},
		target: 'esnext'
	}
});
