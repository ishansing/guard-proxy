export type Variables = {
  cleanBody: string | undefined;
};

// Presidio API response shape
export interface PresidioEntity {
  entity_type: string;
  start: number;
  end: number;
  score: number;
}
