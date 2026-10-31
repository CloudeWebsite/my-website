/**
 * Seed: 1 admin + 1 editor, 7 projects with rendered imagery, 5 services,
 * 4 team members, 4 testimonials (3 approved), 3 journal posts, site settings.
 * Safe to re-run: content tables are cleared first (users are upserted).
 */
import { PrismaClient, type ImageKind, type Prisma, type ProjectType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../lib/settings";

const db = new PrismaClient();

type Doc = Prisma.InputJsonObject;
const doc = (...blocks: Array<string | { h: string }>): Doc => ({
  type: "doc",
  content: blocks.map((b) =>
    typeof b === "string" ? { type: "paragraph", content: [{ type: "text", text: b }] } : { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: b.h }] },
  ),
});

type Img = { file: string; alt: string; caption?: string; kind?: ImageKind; w?: number; h?: number };
type SeedProject = {
  slug: string;
  title: string;
  location: string;
  year: number;
  type: ProjectType;
  featured?: boolean;
  lead: string;
  body: Doc;
  siteArea: string;
  floorArea: string;
  client: string;
  builder: string;
  photographer: string;
  cover: string;
  images: Img[];
};

const R = (f: string) => `/renders/${f}.jpg`;

const PROJECTS: SeedProject[] = [
  {
    slug: "lake-house",
    title: "Lake House",
    location: "Attabad, Hunza — Gilgit-Baltistan",
    year: 2024,
    type: "RESIDENTIAL",
    featured: true,
    lead: "A bespoke retreat designed to anchor into the rugged alpine topography above the lake.",
    body: doc(
      "The site is a shelf of glacial moraine above Attabad Lake, open to the south and sheltered by a stand of old pines to the north. The brief was simple to state and hard to answer: a house for three generations that would feel as at home in a January whiteout as on a July evening.",
      { h: "Two volumes, one gesture" },
      "The plan is an L. A long, low living wing runs east–west along the contour, its north wall almost blind against the wind; a narrower sleeping wing turns south towards the water and ends in a fully glazed, timber-lined gable that glows like a lantern at dusk.",
      "Between them, a sheltered timber terrace catches the low winter sun. Every principal room opens onto it.",
      { h: "Stone, timber, metal" },
      "Walls are dry-laid local stone over an insulated timber frame. The roof is standing-seam zinc, chosen to shed snow and to weather to the same grey as the scree above. Inside, oak floors and ceilings warm a palette that is otherwise quiet: lime plaster, blackened steel, wool.",
    ),
    siteArea: "2,400 m²",
    floorArea: "248 m²",
    client: "Private",
    builder: "Karakoram Build Co.",
    photographer: "Studio renders",
    cover: "lake-house-aerial",
    images: [
      { file: "lake-house-dusk", alt: "The Lake House at dusk, its glazed gable glowing warm against the pines", caption: "South elevation at dusk — the timber-lined gable of the sleeping wing." },
      { file: "lake-house-wing", alt: "Close view of the fully glazed sleeping-wing gable at dusk", caption: "Gable end, full-height glazing with blackened steel mullions." },
      { file: "lake-house-rear", alt: "North-east view showing the long stone wall and metal roof", caption: "The almost blind north wall, turned to the prevailing wind." },
      { file: "lake-house-interior", alt: "Living room with oak ceiling and terrace beyond", caption: "Living room — oak lining follows the pitch of the roof." },
      { file: "lake-house-blueprint", alt: "Blueprint ground floor plan of the Lake House", caption: "A-101 — ground floor plan.", kind: "BEFORE" },
      { file: "lake-house-layout", alt: "Coloured furnished plan of the Lake House", caption: "A-102 — furnished layout.", kind: "AFTER" },
      { file: "lake-house-blueprint", alt: "Ground floor plan drawing", caption: "Ground floor plan, 1:100.", kind: "PLAN" },
    ],
  },
  {
    slug: "margalla-residence",
    title: "Margalla Residence",
    location: "E-7, Islamabad",
    year: 2023,
    type: "RESIDENTIAL",
    lead: "A white lime-rendered house that steps back from the street to give the hills their due.",
    body: doc(
      "Set on a sloping plot at the foot of the Margalla Hills, the house withdraws from the road behind a garden of native planting. Its pitched roofs echo the ridgeline beyond; its white walls take the colour of the sky through the day.",
      "Deep eaves and recessed glazing keep the summer sun off the living rooms while letting the low winter light reach the back of the plan.",
    ),
    siteArea: "1,000 m²",
    floorArea: "310 m²",
    client: "The Qureshi family",
    builder: "Potohar Construction",
    photographer: "Studio renders",
    cover: "margalla-day",
    images: [
      { file: "margalla-aerial", alt: "Aerial view of the Margalla Residence among trees", caption: "Aerial — the house within its garden." },
      { file: "margalla-dusk", alt: "Rear of the residence at dusk", caption: "Garden elevation at dusk." },
      { file: "margalla-kitchen", alt: "Kitchen and dining room interior", caption: "Kitchen and dining, looking east." },
    ],
  },
  {
    slug: "courtyard-house",
    title: "Courtyard House",
    location: "DHA Phase VIII, Karachi",
    year: 2023,
    type: "RESIDENTIAL",
    lead: "A flat-roofed house of deep shade, cross-breezes and a long reflecting pool for the coastal heat.",
    body: doc(
      "Karachi's climate asks for shade before glass. A single, deeply overhanging roof plane shelters the whole plan; beneath it, rooms are arranged to catch the sea breeze from the south-west and to look over a long pool that cools the air as it passes.",
      "Materials are few and robust — lime render, terrazzo, teak — chosen to stand up to salt air with little maintenance.",
    ),
    siteArea: "1,000 sq yd",
    floorArea: "420 m²",
    client: "Private",
    builder: "Indus Builders",
    photographer: "Studio renders",
    cover: "courtyard-day",
    images: [
      { file: "courtyard-aerial", alt: "Aerial view of the flat-roofed courtyard house and pool", caption: "Aerial — a single roof plane over the whole plan." },
      { file: "courtyard-dusk", alt: "Courtyard house at dusk with lit interiors", caption: "Evening — the house opened to the breeze." },
      { file: "courtyard-side", alt: "Side elevation of the courtyard house", caption: "West elevation, the roof's 1.2 m overhang." },
    ],
  },
  {
    slug: "haveli-renovation",
    title: "Gulberg Haveli",
    location: "Gulberg III, Lahore",
    year: 2022,
    type: "RENOVATION",
    lead: "A 1960s brick house carefully opened up, its craft restored and its plan made fit for another sixty years.",
    body: doc(
      "We found a sound brick house hidden under decades of additions. The work was largely subtraction: removing partitions, reopening the original verandah, and repairing the brickwork with lime mortar matched to the original.",
      "A new garden room in timber and glass replaces a failing 1980s extension, and the house is now insulated, naturally ventilated and comfortable year-round.",
    ),
    siteArea: "2 kanal",
    floorArea: "380 m²",
    client: "Private",
    builder: "Ravi Restoration Works",
    photographer: "Studio renders",
    cover: "haveli-day",
    images: [
      { file: "haveli-aerial", alt: "Cutaway aerial of the renovated haveli", caption: "Cutaway — the reopened plan." },
      { file: "haveli-dusk", alt: "Garden elevation of the haveli at dusk", caption: "Garden elevation at dusk." },
      { file: "haveli-blueprint", alt: "Survey plan before renovation", caption: "Survey drawing, as found.", kind: "BEFORE" },
      { file: "haveli-layout", alt: "Plan after renovation", caption: "As built.", kind: "AFTER" },
      { file: "haveli-blueprint", alt: "Ground floor plan", caption: "Ground floor plan, 1:100.", kind: "PLAN" },
    ],
  },
  {
    slug: "timber-retreat",
    title: "Timber Retreat",
    location: "Nathia Gali, Galyat",
    year: 2021,
    type: "RESIDENTIAL",
    lead: "A cedar-clad mountain house for long winters, built almost entirely from the valley's own timber.",
    body: doc(
      "Snow sits on this site for four months of the year. The house is a simple, steeply pitched form clad in locally milled deodar that will silver with age, its roof shedding snow away from the entrances.",
      "Inside, a single stone hearth heats the main room; the studio at the end of the sleeping wing looks straight down the valley.",
    ),
    siteArea: "4 kanal",
    floorArea: "210 m²",
    client: "Private",
    builder: "Galyat Joinery",
    photographer: "Studio renders",
    cover: "timber-dusk",
    images: [
      { file: "timber-aerial", alt: "Aerial dusk view of the timber retreat in snow", caption: "Aerial at dusk, first snow." },
      { file: "timber-side", alt: "West elevation of the timber retreat", caption: "West elevation." },
      { file: "timber-studio", alt: "Studio room with glazed gable at dusk", caption: "The studio — the valley framed by the glazed gable." },
    ],
  },
  {
    slug: "orchard-garden",
    title: "Orchard Garden",
    location: "Mingora, Swat",
    year: 2022,
    type: "LANDSCAPE",
    lead: "A walled garden, pool and orchard that knit a family house back into its valley.",
    body: doc(
      "The landscape came first. We replanted the old apple orchard, brought water across the site in a stone rill to a swimming pond, and set new terraces into the slope so that every room in the house steps straight onto a garden.",
      "Planting is native and drought-tolerant; the garden is irrigated entirely from rainwater harvested off the roofs.",
    ),
    siteArea: "6,000 m²",
    floorArea: "—",
    client: "Private",
    builder: "Swat Landscapes",
    photographer: "Studio renders",
    cover: "orchard-aerial",
    images: [
      { file: "orchard-day", alt: "Brick house and pool in a planted garden", caption: "Pool terrace and the house beyond." },
      { file: "orchard-rear", alt: "Rear garden of the orchard house", caption: "Orchard side." },
    ],
  },
  {
    slug: "gulberg-interiors",
    title: "Pine Hill Interiors",
    location: "Bhurban, Murree",
    year: 2024,
    type: "INTERIORS",
    lead: "Interior architecture for a weekend house: oak, linen and a single long view.",
    body: doc(
      "Our brief was the interior only: joinery, lighting and a material palette for a house whose shell was already complete. We lined the vaulted ceiling in oak, built a continuous wall of joinery to hide storage, and designed the lighting so that the room changes character from afternoon to evening.",
    ),
    siteArea: "—",
    floorArea: "190 m²",
    client: "Private",
    builder: "Atelier Joinery",
    photographer: "Studio renders",
    cover: "interiors-living",
    images: [
      { file: "interiors-dusk", alt: "Living room in the evening with warm light", caption: "Living room, evening." },
      { file: "interiors-kitchen", alt: "Kitchen with oak island and white joinery", caption: "Kitchen — oak island, white lacquer." },
      { file: "interiors-layout", alt: "Furnished interior plan", caption: "Furniture layout, 1:50.", kind: "PLAN" },
    ],
  },
];

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@studio.local").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({ where: { email: adminEmail }, create: { email: adminEmail, name: "Studio Admin", passwordHash, role: "ADMIN" }, update: { passwordHash, role: "ADMIN" } });
  await db.user.upsert({
    where: { email: "editor@studio.local" },
    create: { email: "editor@studio.local", name: "Studio Editor", passwordHash: await bcrypt.hash("Editor-2026!", 12), role: "EDITOR" },
    update: {},
  });

  await db.testimonial.deleteMany();
  await db.project.updateMany({ data: { coverImageId: null } });
  await db.projectImage.deleteMany();
  await db.project.deleteMany();
  await db.service.deleteMany();
  await db.teamMember.deleteMany();
  await db.post.deleteMany();

  const ids: Record<string, string> = {};
  for (const [order, p] of PROJECTS.entries()) {
    const project = await db.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        location: p.location,
        year: p.year,
        type: p.type,
        status: "PUBLISHED",
        featured: p.featured ?? false,
        lead: p.lead,
        body: p.body,
        siteArea: p.siteArea,
        floorArea: p.floorArea,
        client: p.client,
        builder: p.builder,
        photographer: p.photographer,
        order,
      },
    });
    ids[p.slug] = project.id;
    const cover = await db.projectImage.create({
      data: { projectId: project.id, url: R(p.cover), alt: `${p.title} — ${p.location}`, width: 1600, height: 1000, order: 0, kind: "GALLERY" },
    });
    await db.project.update({ where: { id: project.id }, data: { coverImageId: cover.id } });
    for (const [i, img] of p.images.entries()) {
      await db.projectImage.create({
        data: { projectId: project.id, url: R(img.file), alt: img.alt, caption: img.caption ?? null, width: img.w ?? 1600, height: img.h ?? 1000, order: i + 1, kind: img.kind ?? "GALLERY" },
      });
    }
  }

  await db.service.createMany({
    data: [
      { order: 0, title: "New Residential", subtitle: "Bespoke homes · Site analysis · Consents", description: "Houses designed from first principles for a particular family on a particular site — from the first sun study to the last door handle.", deliverables: ["Site & climate analysis", "Concept to construction drawings", "Approvals & contract administration"], imageUrl: R("lake-house-dusk") },
      { order: 1, title: "Renovations & Additions", subtitle: "Heritage · Extensions · Adaptive reuse", description: "Careful work to existing houses: repairing what is good, removing what isn't, and adding only what the house needs.", deliverables: ["Measured survey & condition report", "Heritage-sensitive design", "Phased construction planning"], imageUrl: R("haveli-day") },
      { order: 2, title: "Interior Architecture", subtitle: "Joinery · Lighting · Material palettes", description: "Interiors conceived with the architecture, not applied after it — built-in joinery, lighting design and a coherent palette of materials.", deliverables: ["Joinery design & shop-drawing review", "Lighting layouts & scenes", "Material & finish schedules"], imageUrl: R("interiors-living") },
      { order: 3, title: "Masterplanning", subtitle: "Multi-lot · Subdivision · Staging", description: "Frameworks for family compounds and small developments that protect views, light and landscape as each phase is built.", deliverables: ["Site capacity studies", "Design codes for later phases", "Infrastructure & staging plans"], imageUrl: R("lake-house-blueprint") },
      { order: 4, title: "Landscape Integration", subtitle: "Planting · Hardscape · Water", description: "Gardens, terraces and water designed as rooms of the house — and the house designed to sit quietly within them.", deliverables: ["Planting plans with native species", "Terraces, paths & boundary walls", "Rainwater harvesting & irrigation"], imageUrl: R("orchard-aerial") },
    ],
  });

  await db.teamMember.createMany({
    data: [
      { order: 0, name: "Ayesha Rahman", role: "Founding Director, RIBA", bio: "Founded the studio in 2008 after a decade in London. Leads every project from first site visit to handover." },
      { order: 1, name: "Omar Siddiqui", role: "Director, Technical", bio: "Responsible for construction detailing and site quality. Has never met a junction he couldn't simplify." },
      { order: 2, name: "Hira Baig", role: "Associate, Interiors", bio: "Leads interior architecture and joinery. Trained as a furniture maker before studying architecture." },
      { order: 3, name: "Daniyal Khan", role: "Architect, Models & Visualisation", bio: "Builds the studio's physical models and the drawings you see on this site." },
    ],
  });

  await db.testimonial.createMany({
    data: [
      { order: 0, approved: true, quote: "They listened for longer than anyone else, and then drew a house we hadn't known how to ask for.", clientName: "Sana & Bilal M.", projectId: ids["lake-house"] },
      { order: 1, approved: true, quote: "Two summers in, the house is cooler than any we have lived in, and we have not once turned on the air-conditioning in the evening.", clientName: "The Hussain family", projectId: ids["courtyard-house"] },
      { order: 2, approved: true, quote: "Calm, exact and completely honest about cost. Our builder said they were the clearest drawings he had ever priced.", clientName: "Farah Q.", projectId: ids["margalla-residence"] },
      { order: 3, approved: false, quote: "Awaiting approval — an example of a testimonial that will not appear on the site until approved.", clientName: "Pending client" },
    ],
  });

  const now = Date.now();
  await db.post.createMany({
    data: [
      {
        slug: "drawing-with-the-sun",
        title: "Drawing with the sun: notes from a winter site visit",
        excerpt: "Why we spend a full day on site, in the worst month of the year, before we draw a single line.",
        category: "Process",
        status: "PUBLISHED",
        publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 12),
        coverUrl: R("timber-aerial"),
        body: doc(
          "Every house we design starts with a day on site in winter. The light is lowest then, the wind is strongest, and the site is at its least flattering — which makes it the most honest day to see it.",
          { h: "What we record" },
          "We note where the sun clears the ridge at nine, at noon and at three; where snow lies longest; which way the smoke from the neighbours' chimneys bends. By evening we usually know which way the house will face.",
        ),
      },
      {
        slug: "why-we-still-build-models",
        title: "Why we still build models",
        excerpt: "Renderings persuade. Models tell the truth. On the oldest tool in the studio.",
        category: "Studio",
        status: "PUBLISHED",
        publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 40),
        coverUrl: R("studio-model"),
        body: doc(
          "A model can be turned in the hand, lit with a torch, photographed at eye level and argued over by five people at once. It is the fastest way we know to find out whether an idea is any good.",
          "We build at 1:200 for massing, 1:50 for rooms and 1:20 for the junctions that matter.",
        ),
      },
      {
        slug: "lime-render-in-a-coastal-climate",
        title: "Lime render in a coastal climate",
        excerpt: "Notes from five years of watching lime weather on houses near the sea.",
        category: "Materials",
        status: "PUBLISHED",
        publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 75),
        coverUrl: R("courtyard-dusk"),
        body: doc(
          "Cement render cracks, traps moisture and stains. Lime breathes, heals small cracks itself, and takes on a soft patina in salt air. It is slower to apply and needs a skilled hand — and it is worth it.",
        ),
      },
    ],
  });

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }

  console.log(`Seeded. Admin login: ${adminEmail} / ${adminPassword}  ·  Editor: editor@studio.local / Editor-2026!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
