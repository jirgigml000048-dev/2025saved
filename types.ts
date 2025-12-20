export interface EnvelopeData {
  id: number;
  title: string;
  message: string; // The letter content
  imageUrl: string; // The illustration inside the letter
  iconUrl?: string; // Optional custom icon for the closed envelope
  scale: number; // Scale factor for size variation (e.g., 0.8 to 1.2)
}

export interface TreeCoordinate {
  id: number;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export enum GameState {
  COVER = 'COVER',
  COLLECTING = 'COLLECTING',
  READY_TO_ASSEMBLE = 'READY_TO_ASSEMBLE',
  ASSEMBLING = 'ASSEMBLING',
  PLACING_STAR = 'PLACING_STAR', // New state for manual star interaction
  COMPLETED = 'COMPLETED'
}