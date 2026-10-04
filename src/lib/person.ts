/**
 * Who this site is about, in one place.
 *
 * The bio is what organisers copy from /speaker-kit, and the same facts feed
 * the schema.org Person every page emits. Assistants and search engines decide
 * which "Kasper Nissen" a page is about from that Person (there is a
 * footballer and an actor by the same name), so the name, alternate name and
 * profile links have to agree everywhere.
 */

export const SITE = 'https://kaspernissen.xyz';

export const PERSON_ID = `${SITE}/#person`;
export const WEBSITE_ID = `${SITE}/#website`;

// Note "former" on the Co-Chair role: he co-chaired KubeCon + CloudNativeCon
// EU/NA, he does not currently.
export const bioTitle =
  'Director of Developer Relations at Dash0, former Co-Chair KubeCon+CloudNativeCon EU/NA, CNCF Ambassador, Golden Kubestronaut, KCD Organizer, Meet-up organizer';
export const bio =
  'Kasper is a CNCF, MergeForward, and AAIF Ambassador, former KubeCon+CloudNativeCon Co-Chair, Golden Kubestronaut, KCD Organizer and CNCG Group Organizer. He co-founded Cloud Native Nordics to unite meetups across the region. At Dash0, he helps make observability easy for developers by advocating for better tooling, best practices, and seamless integrations. Bridging observability, AI, and platform engineering, he ensures developers stay productive and gain actionable insights exactly when needed.';

/**
 * Every profile that is his, for `sameAs`. Wider than the icon row in
 * SocialLinks.astro, which only shows the ones worth a click from the hero.
 * Each of these was checked to resolve to his own page; add a Wikidata item
 * here once one exists.
 */
export const profiles = [
  'https://www.linkedin.com/in/kaspernissen/',
  'https://github.com/kaspernissen',
  'https://bsky.app/profile/kaspernissen.xyz',
  'https://x.com/phennex',
  'https://www.instagram.com/kasper.borg.nissen/',
  'https://www.youtube.com/@kaspernissen',
  'https://sessionize.com/kaspernissen/',
  'https://noti.st/kasperborgnissen',
  'https://www.dash0.com/authors/kasper-borg-nissen',
  'https://dev.to/kaspernissen',
  'https://gotopia.tech/experts/225/kasper-nissen',
  'https://www.credly.com/users/kasper-nissen',
];

export const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Kasper Borg Nissen',
  alternateName: 'Kasper Nissen',
  url: `${SITE}/`,
  image: 'https://kasper-nissen-presentations.s3.eu-west-1.amazonaws.com/photos/art/headshot-red.jpg',
  jobTitle: 'Director of Developer Relations',
  worksFor: { '@type': 'Organization', name: 'Dash0', url: 'https://www.dash0.com/' },
  description: bio,
  knowsAbout: [
    'Observability',
    'OpenTelemetry',
    'Platform engineering',
    'Kubernetes',
    'Cloud native',
    'Observability for AI agents',
  ],
  sameAs: profiles,
};

export const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'Kasper Nissen',
  inLanguage: 'en',
  publisher: { '@id': PERSON_ID },
  about: { '@id': PERSON_ID },
};

/**
 * An absolute URL with the trailing slash GitHub Pages redirects to. Schema
 * ids have to match the canonical exactly, and the slashless form is a 301.
 */
export const abs = (path: string) =>
  new URL(path.endsWith('/') || /\.[a-z0-9]+$/i.test(path) ? path : `${path}/`, SITE).href;

export const breadcrumbs = (items: [name: string, path: string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: abs(path),
  })),
});
