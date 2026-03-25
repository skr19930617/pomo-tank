import { type GenusConfig, TankSizeTier, SwimLayer, Personality } from '../../shared/types';

export const gourami: GenusConfig = {
  id: 'gourami',
  displayName: 'Gourami',
  swimLayer: SwimLayer.upper,
  personality: Personality.calm,
  schooling: false,
  baseSpeed: 0.7,
  hasFeedingAnim: false,
  capacityCost: 3,
  minTankSize: TankSizeTier.Small,
  species: [
    {
      id: 'dwarf',
      displayName: 'Dwarf Gourami',
      sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      minSizeMm: 35,
      maxSizeMm: 60,
      minLifespanYears: 3,
      maxLifespanYears: 5,
      pomoCost: 40,
    },
    {
      id: 'cobalt_blue_dwarf',
      displayName: 'Cobalt Blue Dwarf Gourami',
      sprites: { swim: 'swim_64x64_6x2_12f.png', weak: 'weak_64x64_6x2_12f.png' },
      minSizeMm: 35,
      maxSizeMm: 55,
      minLifespanYears: 3,
      maxLifespanYears: 5,
      pomoCost: 45,
    },
  ],
};
