import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const OPTIMIZER_URL = 'http://optimizer:8000/optimize';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const body = await request.json();

        const response = await fetch(OPTIMIZER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Optimizer service returned ${response.status}`);
        }

        const result = await response.json();
        return json(result);
    } catch (error) {
        console.error('Error calling optimizer service:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                order: [],
                metrics: { cast_overlaps: 0 }
            },
            { status: 500 }
        );
    }
};
