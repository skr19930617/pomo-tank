# Data Model: Legacy Code Cleanup

**Date**: 2026-03-26 | **Branch**: `010-legacy-code-cleanup`

## Overview

This feature does not introduce new entities. It removes deprecated types and migration code, leaving only the canonical data model. This document records what remains as the sole source of truth after cleanup.

## Canonical Types (retained)

### Species Hierarchy

- **GenusConfig**: Top-level fish family (id, displayName, swimLayer, personality, schooling, baseSpeed, hasFeedingAnim, capacityCost, minTankSize, species[])
- **SpeciesConfig**: Specific variant within a genus (id, displayName, sprites, size/lifespan ranges, pomoCost)
- **GenusId**: `'neon_tetra' | 'corydoras' | 'gourami' | 'otocinclus' | 'shrimp'`

### Game State

- **GameState**: Root state object (player, tank, fish[], lightOn, lightOffTimestamp)
- **Fish**: Individual fish (id, genusId, speciesId, healthState, sicknessTick, bodyLengthMm, ageWeeks, lifespanWeeks, maintenanceQuality, purchasedAt)
- **Tank**: Aquarium state (sizeTier, hungerLevel, waterDirtiness, algaeLevel, filterId)
- **PlayerProfile**: Player progression (pomoBalance, totalPomoEarned, currentStreak, lastMaintenanceDate, dailyContinuityDays, unlockedItems, lastTickTimestamp, sessionStartTime)

## Removed Types

| Type | Was | Replacement |
|------|-----|-------------|
| `FishSpeciesId` | Deprecated alias for `GenusId` | Use `GenusId` directly |
| `VariantConfig` | Old flat variant shape | `SpeciesConfig` |
| `FishSpeciesConfig` | Old flat species shape | `GenusConfig` + `SpeciesConfig` |

## Removed Constants

| Constant | Reason |
|----------|--------|
| `ACTION_BAR_HEIGHT` | Exported but never imported |

## Removed Functions

| Function | Location | Reason |
|----------|----------|--------|
| `getGenusOrThrow()` | `species/index.ts` | Never called; `getGenus()` is used instead |
| `migrateState()` | `state.ts` | Legacy species migration no longer needed |
| `GameEngine.migrateState()` | `engine.ts` | Legacy hunger + species migration no longer needed |
