import type {
  Worksheet as ApiWorksheet,
  WorksheetCard as ApiWorksheetCard,
  WorksheetListResponse as ApiWorksheetListResponse,
} from "../../types/worksheets";

export type Stage = ApiWorksheetCard["stage"];
export type Difficulty = ApiWorksheetCard["difficulty"];
export type WorksheetFormat = ApiWorksheetCard["format"];

export interface WorksheetFiltersState {
  searchTerm: string;
  stages: string[];
  subjects: string[];
  skills: string[];
  worksheetTypes: string[];
  difficulties: string[];
  formats: string[];
  techIntegratedOnly: boolean;
  answersOnly: boolean;
}

export type Worksheet = ApiWorksheet;
export type WorksheetCard = ApiWorksheetCard;
export type WorksheetListResponse = ApiWorksheetListResponse;
