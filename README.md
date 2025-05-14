# Sketch Running Order

A web application for managing and organizing sketch comedy running orders. Built with SvelteKit and SQLite.

## Features

- Create and manage sketches with performer assignments
- Drag and drop interface for reordering sketches
- Lock sketches in place to prevent accidental reordering
- Multiple view modes (list and grid)
- Print-friendly views for different contexts (green room, hallway, tech booth)
- CSV import/export functionality
- Performer filtering
- Character-performer assignment tracking

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- SQLite

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd sketch-running-order
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run setup-db
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Creating Sketches
- Click "New Sketch" to create a new sketch
- Fill in the title, description, duration, and number of characters
- Assign performers to characters
- Save the sketch

### Managing Running Order
- Drag and drop sketches to reorder them
- Lock sketches in place using the lock icon
- Use the grid/list view toggle to switch between display modes
- Filter sketches by performer using the performer filter

### Printing
- Choose between Green Room, Hallway, or Tech Booth versions
- Click "Print Set List" to generate a print-friendly view
- Use the print dialog to save as PDF or print

### Importing Data
The application supports two types of CSV imports:

#### Sketch Import
Required columns:
- `title` - The name of the sketch
- `description` - Optional description of the sketch
- `time` or `duration` - Duration in MM:SS format (e.g., "5:00")
- `chars` - Number of characters in the sketch
- Additional columns after `casted` will be treated as performer names, with their values being the character names

Example:
```csv
title,description,time,chars,casted,Alice,Bob,Charlie
Opening Number,High energy opener,5:00,3,3,Host,Co-host,Announcer
Office Scene,Corporate comedy,4:30,2,2,Boss,Employee
```

#### Tech Details Import
Required columns:
- `title` - Must match an existing sketch title
- `costume` - Costume requirements
- `stage_dressing` - Stage setup details
- `cues` - Technical cues
- `props` - Required props

Example:
```csv
title,costume,stage_dressing,cues,props
Opening Number,Formal wear,Microphone stands,Spotlight on entrance,Confetti cannon
Office Scene,Business casual,Desk and chair,Blackout between scenes,Stapler
```

## Development

### Project Structure
- `src/routes/` - SvelteKit routes and pages
- `src/lib/` - Shared components and utilities
- `src/lib/server/` - Server-side code and database schema
- `static/` - Static assets

### Database
The application uses SQLite with Drizzle ORM. The schema includes:
- Sketches
- Character Performers
- Shows

### Building for Production
```bash
npm run build
```

The built application will be in the `build` directory.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).

This means you are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- NonCommercial — You may not use the material for commercial purposes
- ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license

For more information, see the [LICENSE](LICENSE) file or visit [creativecommons.org/licenses/by-nc-sa/4.0/](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## TODO
1. Print setlist
2. Sort setlist using external order
3. Lock sketches in place
4. Make sure database works and deploy to stardog
5. Import sketch scripts
6. delta value for changing props between sketches 2 chairs/1 chair/1 table
