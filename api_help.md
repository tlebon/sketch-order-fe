I'll create a new file called `api-guide.md`:

# Sketch Running Order API Guide

This API helps optimize the running order of sketches to minimize cast conflicts (the same person being in back-to-back sketches).

## Endpoint

POST `/optimize`

## Request Format

Send a JSON object with this structure:
```json
{
    "sketches": [
        {
            "id": "sketch1",
            "title": "The Opening Number",
            "cast": ["Alice", "Bob", "Charlie"]
        },
        {
            "id": "sketch2",
            "title": "The Office Scene",
            "cast": ["Bob", "Diana"]
        }
    ],
    "constraints": {
        "anchored": [
            {
                "sketch_id": "sketch1",
                "position": 0
            }
        ],
        "precedence": [
            {
                "before": "sketch2",
                "after": "sketch1"
            }
        ]
    }
}
```

### Notes:
- `id` must be unique for each sketch
- `cast` is an array of performer names
- Both types of constraints are optional
- `position` in anchored constraints is zero-based

## Response Format

The API will respond with:
```json
{
    "success": true,
    "order": [
        {
            "position": 0,
            "sketch_id": "sketch1",
            "title": "The Opening Number"
        },
        {
            "position": 1,
            "sketch_id": "sketch2",
            "title": "The Office Scene"
        }
    ],
    "metrics": {
        "cast_overlaps": 1
    }
}
```

If there's an error, you'll get:
```json
{
    "success": false,
    "error": "Description of what went wrong",
    "order": [],
    "metrics": {
        "cast_overlaps": 0
    }
}
```

## Example Usage (JavaScript)

```javascript
async function optimizeRunningOrder(sketches, constraints) {
    try {
        const response = await fetch('/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sketches, constraints })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // result.order contains the optimized running order
            return result.order;
        } else {
            console.error('Optimization failed:', result.error);
            return null;
        }
    } catch (error) {
        console.error('API call failed:', error);
        return null;
    }
}

// Example usage:
const sketches = [
    {
        id: "sketch1",
        title: "The Opening Number",
        cast: ["Alice", "Bob", "Charlie"]
    },
    {
        id: "sketch2",
        title: "The Office Scene",
        cast: ["Bob", "Diana"]
    }
];

const constraints = {
    anchored: [
        { sketch_id: "sketch1", position: 0 }
    ]
};

const order = await optimizeRunningOrder(sketches, constraints);
if (order) {
    // Display the optimized order
    order.forEach(sketch => {
        console.log(`${sketch.position + 1}. ${sketch.title}`);
    });
}
```

## Common Issues

1. Each sketch must have a unique ID
2. Cast names should be consistent (case-sensitive)
3. Anchored positions must be valid (0 to number of sketches - 1)
4. Precedence constraints can't create impossible situations (circular dependencies)

## Tips

1. Always check the `success` field in the response
2. The `cast_overlaps` metric helps you evaluate the quality of the solution
3. If optimization fails, you'll get back the sketches in their original order
4. Consider caching the result if you're going to show multiple views of the same running order