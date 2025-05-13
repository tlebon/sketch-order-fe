import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	base: process.env.NODE_ENV === 'production' ? '/sketch-order-fe/' : '/',
	build: {
		rollupOptions: {
			external: ['svelte-dnd-action']
		}
	}
});
