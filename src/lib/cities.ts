/**
 * Where an engagement happened, as a point on the map.
 *
 * A static table rather than a build-time geocode: the set is small, it changes
 * a few times a year, and geocoding would add a network dependency (and an API
 * key) to something that never needs to be dynamic.
 *
 * The event name is consulted as well as the location, because most engagements
 * have no location at all. A YouTube entry never does, and the GitHub README
 * parser splits "ServiceMeshCon North America 2022, Detroit, USA" at the wrong
 * comma — the city ends up inside the event name and "USA" is left as the
 * location. Both of those put a pin back on the map that was silently missing.
 */

export type City = { match: string; label: string; lat: number; lon: number };

export const CITIES: City[] = [
  { match: 'london', label: 'London', lat: 51.5072, lon: -0.1276 },
  { match: 'copenhagen', label: 'Copenhagen', lat: 55.6761, lon: 12.5683 },
  { match: 'prague', label: 'Prague', lat: 50.0755, lon: 14.4378 },
  { match: 'edinburgh', label: 'Edinburgh', lat: 55.9533, lon: -3.1883 },
  { match: 'warsaw', label: 'Warsaw', lat: 52.2297, lon: 21.0122 },
  { match: 'malmö', label: 'Malmö', lat: 55.605, lon: 13.0038 },
  { match: 'salt lake city', label: 'Salt Lake City', lat: 40.7608, lon: -111.891 },
  { match: 'melbourne', label: 'Melbourne', lat: -37.8136, lon: 144.9631 },
  { match: 'brisbane', label: 'Brisbane', lat: -27.4698, lon: 153.0251 },
  { match: 'aix-en-provence', label: 'Aix-en-Provence', lat: 43.5297, lon: 5.4474 },
  { match: 'dublin', label: 'Dublin', lat: 53.3498, lon: -6.2603 },
  { match: 'hamburg', label: 'Hamburg', lat: 53.5511, lon: 9.9937 },
  { match: 'amsterdam', label: 'Amsterdam', lat: 52.3676, lon: 4.9041 },
  { match: 'aarhus', label: 'Aarhus', lat: 56.1629, lon: 10.2039 },
  { match: 'århus', label: 'Aarhus', lat: 56.1629, lon: 10.2039 },
  { match: 'atlanta', label: 'Atlanta', lat: 33.749, lon: -84.388 },
  { match: 'bucharest', label: 'Bucharest', lat: 44.4268, lon: 26.1025 },
  { match: 'budapest', label: 'Budapest', lat: 47.4979, lon: 19.0402 },
  { match: 'genève', label: 'Geneva', lat: 46.2044, lon: 6.1432 },
  { match: 'geneva', label: 'Geneva', lat: 46.2044, lon: 6.1432 },
  { match: 'helsinki', label: 'Helsinki', lat: 60.1699, lon: 24.9384 },
  { match: 'munich', label: 'Munich', lat: 48.1351, lon: 11.582 },
  { match: 'tokyo', label: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { match: 'paris', label: 'Paris', lat: 48.8566, lon: 2.3522 },
  { match: 'bergen', label: 'Bergen', lat: 60.3913, lon: 5.3221 },
  { match: 'barcelona', label: 'Barcelona', lat: 41.3874, lon: 2.1686 },
  { match: 'detroit', label: 'Detroit', lat: 42.3314, lon: -83.0458 },
  { match: 'valencia', label: 'Valencia', lat: 39.4699, lon: -0.3763 },
  { match: 'chicago', label: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { match: 'lisbon', label: 'Lisbon', lat: 38.7223, lon: -9.1393 },
  { match: 'stockholm', label: 'Stockholm', lat: 59.3293, lon: 18.0686 },
  { match: 'oslo', label: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { match: 'berlin', label: 'Berlin', lat: 52.52, lon: 13.405 },
  { match: 'san diego', label: 'San Diego', lat: 32.7157, lon: -117.161 },
  { match: 'köln', label: 'Cologne', lat: 50.9375, lon: 6.9603 },
  { match: 'cologne', label: 'Cologne', lat: 50.9375, lon: 6.9603 },
  // Cloud Native Computing Rheinland meets in Köln. The group is named for the
  // region, and the engagement carries no location of its own.
  { match: 'rheinland', label: 'Cologne', lat: 50.9375, lon: 6.9603 },
];

/**
 * The city for one engagement, or null when neither field names one.
 *
 * The location is tried first and the event name second: a location is a
 * deliberate statement of where the event was, an event name only happens to
 * contain a city.
 */
export function cityFor(location?: string | null, event?: string | null): City | null {
  const loc = (location ?? '').toLowerCase();
  const ev = (event ?? '').toLowerCase();
  return (
    CITIES.find((c) => loc.includes(c.match)) ??
    CITIES.find((c) => ev.includes(c.match)) ??
    null
  );
}

/** True when an engagement can be drawn — the test /conferences filters on. */
export const isMappable = (location?: string | null, event?: string | null) =>
  cityFor(location, event) !== null;
