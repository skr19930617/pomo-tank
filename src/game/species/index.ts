import { StoreItemType, type GenusConfig, type SpeciesConfig } from '../../shared/types';
import { neonTetra } from './neon-tetra';
import { corydoras } from './corydoras';
import { gourami } from './gourami';
import { otocinclus } from './otocinclus';
import { shrimp } from './shrimp';

const ALL_GENERA: GenusConfig[] = [neonTetra, corydoras, gourami, otocinclus, shrimp];

export const GENUS_REGISTRY: Map<string, GenusConfig> = new Map(ALL_GENERA.map((g) => [g.id, g]));

export function getGenus(genusId: string): GenusConfig | undefined {
  return GENUS_REGISTRY.get(genusId);
}

export function getSpecies(genusId: string, speciesId: string): SpeciesConfig | undefined {
  const genus = GENUS_REGISTRY.get(genusId);
  return genus?.species.find((s) => s.id === speciesId);
}

export function getAllGenera(): GenusConfig[] {
  return ALL_GENERA;
}

export function getSpeciesWithGenus(
  genusId: string,
  speciesId: string,
): { genus: GenusConfig; species: SpeciesConfig } | undefined {
  const genus = GENUS_REGISTRY.get(genusId);
  if (!genus) return undefined;
  const species = genus.species.find((s) => s.id === speciesId);
  if (!species) return undefined;
  return { genus, species };
}

// ── Store integration ──

/** Composite store ID format: "genusId:speciesId" */
export function makeSpeciesStoreId(genusId: string, speciesId: string): string {
  return `${genusId}:${speciesId}`;
}

/** Parse a composite store ID back to genusId + speciesId. Returns undefined if not a fish ID. */
export function parseSpeciesStoreId(
  storeItemId: string,
): { genusId: string; speciesId: string } | undefined {
  const idx = storeItemId.indexOf(':');
  if (idx < 0) return undefined;
  const genusId = storeItemId.slice(0, idx);
  const speciesId = storeItemId.slice(idx + 1);
  if (!GENUS_REGISTRY.has(genusId)) return undefined;
  const genus = GENUS_REGISTRY.get(genusId)!;
  if (!genus.species.some((s) => s.id === speciesId)) return undefined;
  return { genusId, speciesId };
}

/**
 * Build store items for all fish species (one entry per species).
 * Returns a Record keyed by composite "genusId:speciesId" IDs.
 */
export function buildFishStoreItems(): Record<
  string,
  {
    id: string;
    name: string;
    type: StoreItemType;
    pomoCost: number;
    prerequisite: { requiredUnlocks?: string[] };
    description: string;
  }
> {
  const items: Record<
    string,
    {
      id: string;
      name: string;
      type: StoreItemType;
      pomoCost: number;
      prerequisite: { requiredUnlocks?: string[] };
      description: string;
    }
  > = {};

  for (const genus of ALL_GENERA) {
    for (const species of genus.species) {
      const id = makeSpeciesStoreId(genus.id, species.id);
      items[id] = {
        id,
        name: species.displayName,
        type: StoreItemType.FishSpecies,
        pomoCost: species.pomoCost,
        prerequisite: {},
        description: `${genus.displayName} family. Capacity cost: ${genus.capacityCost}.`,
      };
    }
  }

  return items;
}
