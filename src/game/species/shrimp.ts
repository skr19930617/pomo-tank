import { type GenusConfig, TankSizeTier, SwimLayer, Personality } from '../../shared/types';

export const shrimp: GenusConfig = {
  id: 'shrimp',
  displayName: 'Amano Shrimp',
  swimLayer: SwimLayer.lower,
  personality: Personality.social,
  schooling: true,
  baseSpeed: 0.6,
  hasFeedingAnim: true,
  capacityCost: 1,
  minTankSize: TankSizeTier.Nano,
  species: [
    {
      id: 'amano',
      displayName: 'Amano Shrimp',
      sprites: {
        swim: 'swim_64x64_6x2_12f.png',
        weak: 'weak_64x64_6x2_12f.png',
        feeding: 'feeding_64x64_6x2_12f.png',
      },
      minSizeMm: 15,
      maxSizeMm: 50,
      minLifespanYears: 2,
      maxLifespanYears: 3,
      pomoCost: 10,
    },
  ],
};
