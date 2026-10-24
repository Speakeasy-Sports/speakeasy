// Raw Sanity documents for local runs and smoke tests. scripts/mock-sanity.mjs evaluates the site's real GROQ
// against these with groq-js, so filters, ordering, and joins behave as they will against the Content Lake.
// Headlines and people are sample content, not real reporting.

const ref = (_ref) => ({ _type: "reference", _ref });
const key = (() => {
  let n = 0;
  return () => `k${(n++).toString(36)}`;
})();

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 3600_000).toISOString();

function asset(id, w = 1600, h = 900) {
  return {
    _id: `image-${id}-${w}x${h}-jpg`,
    _type: "sanity.imageAsset",
    url: `https://cdn.sanity.io/images/mock1234/production/${id}-${w}x${h}.jpg`,
    metadata: { dimensions: { width: w, height: h, aspectRatio: w / h }, lqip: null },
  };
}

function image(assetDoc, alt, caption, credit) {
  return { _type: "image", asset: ref(assetDoc._id), alt, caption, credit };
}

const span = (text, marks = []) => ({ _type: "span", _key: key(), text, marks });
const para = (...children) => ({ _type: "block", _key: key(), style: "normal", markDefs: [], children });
const h2 = (text) => ({ _type: "block", _key: key(), style: "h2", markDefs: [], children: [span(text)] });

const schools = [
  {
    _id: "school-georgia",
    _type: "school",
    _updatedAt: hoursAgo(200),
    name: "Georgia Bulldogs",
    shortName: "Georgia",
    slug: { current: "georgia" },
    mascot: "Bulldogs",
    accentColor: "#BA0C2F",
    accentColorDark: "#E44A64",
    communityName: "Dawg Social Club",
    circleJoinUrl: "https://club.speakeasysports.com/c/dawg-social-club",
    description: "Georgia football, basketball, and recruiting, from the people who never miss a snap.",
    order: 1,
    navTags: [ref("tag-recruiting"), ref("tag-quarterbacks"), ref("tag-defense"), ref("tag-film-room"), ref("tag-portal"), ref("tag-basketball")],
  },
  {
    _id: "school-alabama",
    _type: "school",
    _updatedAt: hoursAgo(200),
    name: "Alabama Crimson Tide",
    shortName: "Alabama",
    slug: { current: "alabama" },
    accentColor: "#9E1B32",
    communityName: "Speakeasy Club",
    order: 9,
  },
];

const tags = [
  ["recruiting", "Recruiting", "Commitments, visits, and the board for the next two classes."],
  ["quarterbacks", "Quarterbacks", "The most-watched room in Athens."],
  ["defense", "Defense", null],
  ["film-room", "Film room", "Plays, broken down."],
  ["portal", "Transfer portal", null],
  ["basketball", "Basketball", null],
].map(([slug, name, description]) => ({
  _id: `tag-${slug}`,
  _type: "tag",
  _updatedAt: hoursAgo(300),
  name,
  slug: { current: slug },
  description,
}));

const assets = {
  jon: asset("a1f0c3d2e1", 800, 800),
  avery: asset("b2e1d4c3f2", 800, 800),
  marcus: asset("c3d2e5f4a3", 800, 800),
};

const authors = [
  {
    _id: "author-jon",
    _type: "author",
    _updatedAt: hoursAgo(300),
    name: "Jon Smith",
    slug: { current: "jon-smith" },
    role: "Founder",
    bio: "Jon runs Speakeasy Sports and has watched more Georgia third downs than is healthy.",
    photo: { _type: "image", asset: ref(assets.jon._id), alt: "Jon Smith" },
    socialLinks: [
      { _key: key(), platform: "x", url: "https://x.com/speakeasysports" },
      { _key: key(), platform: "instagram", url: "https://instagram.com/speakeasysports" },
    ],
    schools: [ref("school-georgia")],
  },
  {
    _id: "author-avery",
    _type: "author",
    _updatedAt: hoursAgo(300),
    name: "Avery Collins",
    slug: { current: "avery-collins" },
    role: "Recruiting",
    bio: "Avery covers recruiting and the transfer portal.",
    photo: { _type: "image", asset: ref(assets.avery._id), alt: "Avery Collins" },
  },
  {
    _id: "author-marcus",
    _type: "author",
    _updatedAt: hoursAgo(300),
    name: "Marcus Hill",
    slug: { current: "marcus-hill" },
    role: "Film",
    bio: "Marcus breaks down the tape every Tuesday.",
    photo: { _type: "image", asset: ref(assets.marcus._id), alt: "Marcus Hill" },
  },
];

// [slug, title, dek, type, hoursAgo, author, tags, extra]
const rows = [
  ["fourth-quarter-collapse-defensive-rotation", "What the fourth-quarter collapse says about the defensive rotation", "Georgia played 19 defenders in the first half and 11 after the break. That is not a coincidence.", "analysis", 2, "jon", ["defense"], { featured: true, featuredRank: 1, schools: ["georgia", "alabama"] }],
  ["bye-week-mailbag", "Pod: The bye week mailbag", "Your questions on the quarterback room, the schedule, and whether the offensive line is fixed.", "podcast", 5, "jon", ["quarterbacks"], { featured: true, featuredRank: 2, podcast: true }],
  ["five-plays-georgia-texas", "Five plays that decided Georgia and Texas", "The scoreboard said one thing. The down-and-distance chart said it earlier.", "recap", 9, "marcus", ["film-room", "defense"], { featured: true, featuredRank: 3 }],
  ["tight-end-screen-film-room", "Film room: the tight end screen that keeps working", "Six snaps, one concept, and why defenses still bite on it.", "video", 14, "marcus", ["film-room"], { featured: true, featuredRank: 4, video: true }],
  ["healthy-line-ole-miss", "What a healthy offensive line changes against Ole Miss", "Three starters return. The run game was built for exactly this.", "preview", 3, "jon", ["quarterbacks"], {}],
  ["recruiting-board-florida-weekend", "Recruiting board: who visits Athens on Florida weekend", "Eleven official visitors, four of them uncommitted, and one name that changes the class.", "news", 7, "avery", ["recruiting"], {}],
  ["stop-grading-style-points", "Stop grading this offense on style points", "Wins in October are not judged by how they look in a highlight package.", "opinion", 20, "jon", [], {}],
  ["forty-seasons-section-110", "Forty seasons in Section 110", "The same four seats, the same thermos, and every coach since 1986.", "feature", 26, "avery", [], {}],
  ["third-down-slow-starts", "The third-down numbers behind the slow starts", "First-quarter conversion rate is down 14 points from last season. Here is where it went.", "analysis", 31, "marcus", ["quarterbacks", "film-room"], {}],
  ["texas-recap-other-sideline", "Pod: Texas recap with a guest from the other sideline", "An Austin beat writer joins to explain what Texas saw, and what it missed.", "podcast", 40, "jon", [], { podcast: true }],
  ["portal-window-preview", "The portal window opens in six weeks. Here is the shopping list.", "Edge rusher, slot receiver, and maybe a kicker.", "analysis", 48, "avery", ["portal"], {}],
  ["basketball-media-day", "Basketball media day: five things we learned", "A deeper rotation, a faster pace, and a freshman who already looks ready.", "news", 55, "avery", ["basketball"], {}],
  ["secondary-communication", "The secondary has a communication problem, not a talent problem", "Busted coverages, not beaten coverages, account for most of the explosive plays.", "analysis", 62, "marcus", ["defense", "film-room"], {}],
  ["commit-watch-five-star-edge", "Commit watch: the five-star edge rusher down to three", "A decision date is set. Georgia is in the final group.", "news", 70, "avery", ["recruiting"], {}],
  ["film-room-pressure-packages", "Film room: the pressure packages that worked against Auburn", "Simulated pressure, real results.", "video", 80, "marcus", ["film-room", "defense"], { video: true }],
  ["kickoff-time-announced", "Kickoff time set for the Florida game", "The usual afternoon slot in Jacksonville.", "news", 90, "jon", [], {}],
  ["running-back-committee", "Why the running back committee is the right call", "Fresh legs in November are worth more than one 1,200-yard season.", "opinion", 100, "jon", [], {}],
  ["pod-recruiting-roundup", "Pod: Recruiting roundup before the visit weekend", "Who is coming, who is wavering, and who is a lock.", "podcast", 110, "avery", ["recruiting"], { podcast: true }],
  ["special-teams-audit", "A special teams audit at the halfway mark", "Coverage units are elite. The return game is not.", "analysis", 120, "marcus", [], {}],
  ["qb-depth-chart-explained", "The quarterback depth chart, explained", "Why the backup gets series in the first half of blowouts.", "analysis", 130, "jon", ["quarterbacks"], {}],
  ["homecoming-traditions", "Homecoming traditions worth keeping", "The parade, the arch, and the one we should bring back.", "feature", 140, "avery", [], {}],
  ["video-postgame-press", "Postgame: the three answers that mattered", "Clips from the press conference with context.", "video", 150, "jon", [], { video: true }],
  ["midseason-grades", "Midseason grades for every position group", "Two As, one D, and a lot of incompletes.", "analysis", 160, "marcus", ["defense", "quarterbacks"], {}],
  ["walk-on-story", "From walk-on to captain", "A five-year story that started with a tryout email.", "feature", 170, "avery", [], {}],
  ["early-signing-period", "What the early signing period means this year", "Fewer surprises, more flips.", "news", 180, "avery", ["recruiting", "portal"], {}],
  ["pod-basketball-preview", "Pod: Basketball season preview", "Rotation, schedule, and expectations.", "podcast", 190, "jon", ["basketball"], { podcast: true }],
  ["bama-only-story", "An Alabama story for the redirect test", "Listed only under Alabama.", "news", 195, "jon", [], { schools: ["alabama"] }],
  // National coverage (docs/specs/phase-1-ux-update.md, 3): no primary school, canonical at /national/{slug}.
  ["tailgate-rulebook", "Every tailgate has a rulebook. Nobody ever writes it down.", "Where to park, who brings the grill, and the etiquette of the tent next door.", "feature", 1, "jon", [], { national: true, noHero: true }],
  ["road-trip-best-part", "Why the road trip is the best part of college football", "The stadium is the destination. The drive is where the stories come from.", "analysis", 12, "jon", [], { national: true, schools: ["georgia"] }],
];

const heroAssets = [];
const articles = rows.map(([slug, title, dek, contentType, ago, author, tagSlugs, extra], i) => {
  const schoolsList = extra.schools ?? (extra.national ? [] : ["georgia"]);
  const doc = {
    _id: `article-${slug}`,
    _type: "article",
    _createdAt: hoursAgo(ago + 1),
    _updatedAt: hoursAgo(ago),
    title,
    slug: { current: slug },
    dek,
    contentType,
    status: "published",
    publishedAt: hoursAgo(ago),
    // School stories written before coverageScope existed have no value; keep it that way here to test the default.
    ...(extra.national ? { coverageScope: "national" } : {}),
    schools: schoolsList.map((s) => ref(`school-${s}`)),
    ...(extra.national ? {} : { primarySchool: ref(`school-${schoolsList[0]}`) }),
    authors: [ref(`author-${author}`)],
    tags: tagSlugs.map((t) => ({ ...ref(`tag-${t}`), _key: key() })),
    featured: Boolean(extra.featured),
    featuredRank: extra.featuredRank,
    noIndex: false,
  };
  if (extra.podcast) {
    doc.heroType = "podcast";
    doc.heroEmbed = { provider: "spotify", url: "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk", title };
    doc.episodeSummary = "We open the mailbag and go through the questions you sent this week.";
    doc.episodeTimestamps = [
      { _key: key(), time: "0:00", label: "Intro" },
      { _key: key(), time: "4:30", label: "The quarterback room" },
      { _key: key(), time: "22:15", label: "Is the line fixed?" },
    ];
  } else if (extra.video) {
    doc.heroType = "video";
    doc.heroEmbed = { provider: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title };
  } else if (extra.noHero) {
    doc.heroType = "none";
  } else {
    const a = asset(`hero${i.toString(16).padStart(4, "0")}abcd`);
    heroAssets.push(a);
    doc.heroType = "image";
    doc.heroImage = image(a, `Photo for: ${title}`, i % 3 === 0 ? "Sanford Stadium, late in the fourth." : undefined, "Photo: Speakeasy Sports");
  }
  doc.body = [
    para(span("The "), { ...span("box score", ["l1"]) }, span(" tells one story. The participation chart tells a "), span("different", ["em"]), span(" one.")),
    h2("What changed"),
    para(span("Through two quarters the staff rolled the line every other series. Then the substitutions stopped, and the tackling went with them.")),
    { _type: "pullQuote", _key: key(), text: "Nineteen defenders before halftime. Eleven after.", attribution: "Participation chart" },
    para(span("The fix is not complicated, but it requires trusting the second unit in a one-score game.")),
  ];
  doc.body[0].markDefs = [{ _type: "link", _key: "l1", href: "https://example.com/box-score" }];
  if (slug === "fourth-quarter-collapse-defensive-rotation") {
    doc.updatedAt = hoursAgo(1);
    doc.correction = "An earlier version of this story said 12 defenders played after halftime. The number is 11.";
    doc.circlePostUrl = "https://club.speakeasysports.com/c/dawg-social-club/fourth-quarter-collapse";
    doc.circleCommentCount = 14;
    doc.body.push({ _type: "videoEmbed", _key: key(), url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Fourth quarter highlights" });
    doc.body.push({ _type: "callout", _key: key(), title: "Context", body: "Georgia has a bye next week.", variant: "note" });
  }
  return doc;
});

const sponsor = {
  _id: "sponsor-1",
  _type: "sponsorSlot",
  _updatedAt: hoursAgo(10),
  name: "Fall gameday partner",
  placement: "articleBelowHero",
  active: true,
  sponsorName: "Example Outfitters",
  headline: "Gameday gear, delivered before kickoff.",
  url: "https://example.com",
  label: "Presented by",
};

const settings = {
  _id: "siteSettings",
  _type: "siteSettings",
  siteName: "Speakeasy Sports",
  tagline: "College sports, for the people who actually care.",
  joinUrl: "https://club.speakeasysports.com",
  newsletterHeadline: "The Speakeasy newsletter",
  newsletterBlurb: "The week in Georgia sports, the stories worth your time, and what the Club is arguing about.",
  newsletterSampleUrl: "https://club.speakeasysports.com/newsletter/sample",
  footerText: "Speakeasy Sports is an independent publication and is not affiliated with any university.",
  socialLinks: [
    { _key: key(), platform: "x", url: "https://x.com/speakeasysports" },
    { _key: key(), platform: "instagram", url: "https://instagram.com/speakeasysports" },
    { _key: key(), platform: "youtube", url: "https://youtube.com/@speakeasysports" },
  ],
  navSchools: [ref("school-georgia")],
};

const infoPages = [
  ["about", "About Speakeasy Sports", "An independent college sports publication and the community around it."],
  ["contact", "Contact", "Tips, corrections, partnerships, and everything else."],
  ["terms", "Terms of use", "[Terms to come from counsel before launch.]"],
  ["privacy", "Privacy", "[Privacy policy to come from counsel before launch.]"],
  ["write-for-us", "Write for us", "We are looking for fans who know the game and can explain it."],
].map(([slug, title, intro]) => ({
  _id: `infoPage-${slug}`,
  _type: "infoPage",
  _updatedAt: hoursAgo(400),
  title,
  slug: { current: slug },
  intro,
  body: [para(span("Placeholder body for local runs. The real copy lives in the Studio."))],
}));

export const dataset = [
  ...schools,
  ...tags,
  ...authors,
  ...Object.values(assets),
  ...heroAssets,
  ...articles,
  sponsor,
  settings,
  ...infoPages,
];
