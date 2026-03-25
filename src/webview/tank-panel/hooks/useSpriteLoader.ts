import { useEffect, useRef, useState } from 'react';

export type SpriteUriMap = Record<string, Record<string, Record<string, string>>>;
export type SpriteImageMap = Record<
  string,
  Record<string, Record<string, HTMLImageElement | null>>
>;

/**
 * Preload all sprite sheet images from the URI map.
 * Returns a nested map of loaded HTMLImageElement objects.
 */
export function useSpriteLoader(uriMap: SpriteUriMap | null): {
  images: SpriteImageMap;
  loaded: boolean;
} {
  const [images, setImages] = useState<SpriteImageMap>({});
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!uriMap || loadedRef.current) return;

    let cancelled = false;
    const result: SpriteImageMap = {};
    const promises: Promise<void>[] = [];

    for (const [speciesId, variants] of Object.entries(uriMap)) {
      result[speciesId] = {};
      for (const [variantId, states] of Object.entries(variants)) {
        result[speciesId][variantId] = {};
        for (const [state, uri] of Object.entries(states)) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (!cancelled) {
                result[speciesId][variantId][state] = img;
              }
              resolve();
            };
            img.onerror = () => {
              result[speciesId][variantId][state] = null;
              resolve();
            };
            img.src = uri;
          });
          promises.push(promise);
        }
      }
    }

    Promise.all(promises).then(() => {
      if (!cancelled) {
        loadedRef.current = true;
        setImages(result);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uriMap]);

  return { images, loaded };
}
