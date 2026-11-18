export type ResolveCoordinatesInput = {
  query: string;
};

export type ResolveCoordinatesResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; errorMessage: string };