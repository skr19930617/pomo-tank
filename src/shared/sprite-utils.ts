// ── Shared Sprite Utilities ──
// Centralised type definition and builder for sprite URI maps.
// Used by both tank-panel and companion-view providers.

import type * as vscode from 'vscode';
import type { AnimState, GenusConfig } from './types';

/**
 * Nested map: genusId → speciesId → animState → URI string
 */
export type SpriteUriMap = Record<string, Record<string, Record<string, string>>>;

/**
 * Builds a SpriteUriMap by iterating all genera/species and resolving
 * each sprite filename into a webview-safe URI.
 */
export function buildSpriteUriMap(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  getAllGenera: () => GenusConfig[],
  joinPath: (...args: [vscode.Uri, ...string[]]) => vscode.Uri,
): SpriteUriMap {
  const map: SpriteUriMap = {};
  const states: AnimState[] = ['swim', 'weak', 'feeding'];

  for (const genus of getAllGenera()) {
    map[genus.id] = {};
    for (const species of genus.species) {
      map[genus.id][species.id] = {};
      for (const state of states) {
        const filename = species.sprites[state];
        if (filename) {
          const uri = webview.asWebviewUri(
            joinPath(extensionUri, 'media', 'sprites', 'fish', genus.id, species.id, filename),
          );
          map[genus.id][species.id][state] = uri.toString();
        }
      }
    }
  }
  return map;
}
