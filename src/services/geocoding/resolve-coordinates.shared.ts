import type { ResolveCoordinatesInput, ResolveCoordinatesResult } from './resolve-coordinates.types';

export type { ResolveCoordinatesInput, ResolveCoordinatesResult };

/**
 * Legacy query-based resolver — use `geocodeAddress` with structured place fields.
 */
export async function resolveCoordinates(
  input: ResolveCoordinatesInput,
): Promise<ResolveCoordinatesResult> {
  const query = input.query.trim();

  if (!query) {
    return { ok: false, errorMessage: 'Ange en adress att söka efter.' };
  }

  return {
    ok: false,
    errorMessage: 'Kunde inte hämta koordinater just nu. Försök igen.',
  };
}