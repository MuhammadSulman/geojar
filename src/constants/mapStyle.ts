// CARTO raster tile basemaps - free, no API key required.
// Voyager = light, Dark Matter = dark.

function buildStyle(name: string, slug: string) {
  return {
    version: 8,
    sources: {
      [name]: {
        type: 'raster',
        tiles: [
          `https://a.basemaps.cartocdn.com/rastertiles/${slug}/{z}/{x}/{y}@2x.png`,
          `https://b.basemaps.cartocdn.com/rastertiles/${slug}/{z}/{x}/{y}@2x.png`,
          `https://c.basemaps.cartocdn.com/rastertiles/${slug}/{z}/{x}/{y}@2x.png`,
          `https://d.basemaps.cartocdn.com/rastertiles/${slug}/{z}/{x}/{y}@2x.png`,
        ],
        tileSize: 256,
        maxzoom: 20,
      },
    },
    layers: [
      {
        id: name,
        type: 'raster',
        source: name,
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  };
}

export const MAP_STYLE_LIGHT = buildStyle('carto-voyager', 'voyager');
export const MAP_STYLE_DARK = buildStyle('carto-dark', 'dark_all');

// Backwards-compat default (used to be dark in original code, but Voyager
// remains a sensible neutral default).
export const MAP_STYLE = MAP_STYLE_LIGHT;

export function getMapStyle(isDark: boolean) {
  return isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
}
