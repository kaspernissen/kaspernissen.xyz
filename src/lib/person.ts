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
 * The long-form bio on /about, taken from his Dash0 author page
 * (dash0.com/authors/kasper-borg-nissen) so the two say the same thing.
 * Update both together.
 */
export const about = [
  'Kasper Borg Nissen is Director of Developer Relations at Dash0, where he leads the Developer Relations team focused on helping developers adopt OpenTelemetry, observability, AI, and platform engineering through technical content, open source contributions, conference talks, training, and community engagement. His team works closely with developer communities around the world to build trust through education, technical leadership, and meaningful contributions.',
  'Kasper is a CNCF Ambassador, MergeForward Ambassador, and AAIF Ambassador, with a strong focus on the emerging Agentic Software Development Lifecycle (SDLC) and how OpenTelemetry provides the telemetry foundation for AI-powered engineering and autonomous software systems. He is a former KubeCon + CloudNativeCon Co-Chair for Europe and North America (2024–2025), a Golden Kubestronaut, organizer of Cloud Native Denmark (formerly KCD Denmark), CNCG organizer, and co-founder of Cloud Native Nordics, an initiative that connects cloud native communities across the Nordic region.',
  "Before joining Dash0, Kasper spent eight years as a Staff Platform Engineer at Lunar, one of the Nordic region's leading digital challenger banks. As one of the company's early engineering hires, he helped build the foundation of Lunar's Kubernetes platform and drove the adoption of cloud native practices such as Kubernetes, GitOps, and platform engineering, while introducing AI capabilities as part of the internal platform. His experience as a practitioner continues to shape his work today, where he advocates for observability as a platform product that empowers developers, platform teams, and AI systems with the insights they need to build, operate, and continuously improve modern software.",
  'An active contributor to the OpenTelemetry project and the broader CNCF ecosystem, Kasper is the co-author of OpenTelemetry for Dummies and co-author and instructor of the Observability for Platform Engineering course on PlatformEngineering.org. He also co-hosts the Code RED Podcast with Dash0 founder and CEO Mirko Novakovic and writes the bi-weekly Code RED Newsletter, where he explores the intersection of observability, platform engineering, AI, and cloud native technologies. Through his writing, speaking, open source work, and community leadership, he is passionate about helping organizations build the foundation for the next generation of intelligent, autonomous software delivery.',
];

/**
 * Honours, for the Person's `award`. Each one has a badge on /badges.
 * Certifications are left out: they are exams passed, not recognition given.
 */
export const awards = [
  'Golden Kubestronaut (CNCF, 2025)',
  'CNCF Ambassador (2023–2028)',
  'Agentic AI Foundation Ambassador (2026)',
  'Linkerd Ambassador (2022)',
  'Co-Chair, KubeCon + CloudNativeCon Europe 2024 and 2025',
  'Co-Chair, KubeCon + CloudNativeCon North America 2024',
  'Keynote speaker, KubeCon + CloudNativeCon Europe 2023, 2024 and 2025',
  'Keynote speaker, KubeCon + CloudNativeCon North America 2024',
];

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
  award: awards,
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
