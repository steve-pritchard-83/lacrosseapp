export interface Player {
  id: string;
  name: string;
  number: number;
  goals: number;
  totalFieldTime: number;
  fieldEntryTime: number | null;
  isGoalie?: boolean;
  fieldTime?: number;
} 