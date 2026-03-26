import { type GenusConfig, SwimLayer, Personality } from '../../shared/types';

export const otocinclus: GenusConfig = {
  id: 'otocinclus',
  displayName: 'Otocinclus',
  swimLayer: SwimLayer.lower,
  personality: Personality.timid,
  schooling: true,
  baseSpeed: 0.9,
  hasFeedingAnim: true,
  capacityCost: 2,
  species: [
    {
      id: 'standard',
      displayName: 'Otocinclus',
      sprites: {
        swim: 'swim_64x64_6x2_12f.png',
        weak: 'weak_64x64_6x2_12f.png',
        feeding: 'feeding_64x64_6x2_12f.png',
      },
      minSizeMm: 20,
      maxSizeMm: 40,
      minLifespanYears: 3,
      maxLifespanYears: 5,
      pomoCost: 30,
    },
  ],
};
