export interface CharacterPerformer {
  id: string;
  sketch_id: string;
  character_name: string;
  performer_name: string;
  created_at: string | null;
  updated_at: string | null;
}

// Define an interface for the tech details structure
export interface SketchTechDetails {
  id: string;
  sketch_id: string;
  cues: string | null;
  props: string | null;
  costume: string | null;
  stage_dressing: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Sketch {
  id: string;
  show_id: string;
  title: string;
  description: string | null;
  duration: number;
  chars: number;
  casted: number;
  locked: boolean;
  position: number;
  created_at: string | null;
  updated_at: string | null;
  character_performers?: CharacterPerformer[];
  raw_data: string | null;
  techDetails?: SketchTechDetails | null;
}

export interface SketchShow {
  id: string;
  title: string;
  description?: string;
  created_at?: string | null;
  updated_at?: string | null;
} 