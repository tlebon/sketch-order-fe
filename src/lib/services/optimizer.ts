import type { Sketch } from '$lib/types';

interface OptimizationResult {
    success: boolean;
    order: Array<{
        position: number;
        sketch_id: string;
        title: string;
    }>;
    metrics: {
        cast_overlaps: number;
    };
    error?: string;
}

interface OptimizationConstraints {
    anchored?: Array<{
        sketch_id: string;
        position: number;
    }>;
    precedence?: Array<{
        before: string;
        after: string;
    }>;
}

export async function optimizeRunningOrder(
    sketches: Sketch[],
    constraints: OptimizationConstraints
): Promise<OptimizationResult> {
    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sketches: sketches.map(sketch => ({
                    id: sketch.id,
                    title: sketch.title,
                    cast: sketch.character_performers?.map(cp => cp.performer_name) || []
                })),
                constraints
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Failed to optimize running order:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            order: [],
            metrics: { cast_overlaps: 0 }
        };
    }
}
