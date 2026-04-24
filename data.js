// ─── Tier Definitions ─────────────────────────────────────────────
const TIERS = {
  budget:  { id: 'budget',  emoji: '✂️', label: 'Billigere alternativ', sublabel: 'Markant billigere — gode resultater',         color: '#3a4e6e' },
  mid:     { id: 'mid',     emoji: '💰', label: 'Godt alternativ',      sublabel: 'Lignende kvalitet, anden pris eller fiber',    color: '#4a5e3a' },
  premium: { id: 'premium', emoji: '🏆', label: 'Opgradering',         sublabel: 'Mere eksklusivt end originalen',               color: '#7a5c2e' },
};

// ─── Yarn Weight Categories ────────────────────────────────────────
// Standard gauge ranges (masker/10 cm) per CYC:
// lace: 33-40 | fingering: 27-32 | sport: 23-26 | DK: 21-24
// worsted: 16-20 | bulky: 12-15 | superbulky: 7-11
const WEIGHTS = {
  lace:      { label: 'Lace / 0-ply',         gaugeRange: [33, 40], needle: '1.5–2.25 mm' },
  fingering: { label: 'Fingering / 2-ply',     gaugeRange: [27, 32], needle: '2.25–3.25 mm' },
  sport:     { label: 'Sport / 4-ply',         gaugeRange: [23, 26], needle: '3.25–3.75 mm' },
  DK:        { label: 'DK / Double Knit',      gaugeRange: [21, 24], needle: '3.5–4.5 mm' },
  worsted:   { label: 'Worsted / Aran',        gaugeRange: [16, 20], needle: '4.5–5.5 mm' },
  bulky:     { label: 'Bulky / Chunky',        gaugeRange: [12, 15], needle: '5.5–8 mm' },
  superbulky:{ label: 'Super Bulky',           gaugeRange: [7,  11], needle: '8–12 mm' },
};

// ─── Yarn Database ─────────────────────────────────────────────────
// price_dkk_50g = price per 50g skein (market standard unit)
// meters_per_50g = yardage per 50g
// gauge.stitches = masker per 10 cm (svejsning/strikkefasthed)
// gauge.needle_mm = anbefalet pind i mm
// fiber = [{name, pct}] — must sum to 100

const YARNS = [

  // ── DROPS / Garnstudio (Budget) ──────────────────────────────────
  {
    id: 'drops-alpaca',
    name: 'DROPS Alpaca',
    brand: 'Garnstudio DROPS',
    origin: 'Sydamerika',
    tier: 'budget',
    weight: 'fingering',
    gauge: { stitches: 27, needle_mm: 2.5 },
    fiber: [{ name: 'Alpaka', pct: 100 }],
    meters_per_50g: 167,
    price_dkk_50g: 22,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: true,
    properties: { softness: 5, warmth: 4, elasticity: 2, drape: 4 },
    buyUrl: 'https://www.garnstudio.com/yarn.php?show=drops-alpaca&cid=17',
    description: 'Klassisk budget-alpakagarn. Utroligt blødt, men lav elasticitet gør det uegnet til tætte ribber eller farvespil.',
  },
  {
    id: 'drops-lima',
    name: 'DROPS Lima',
    brand: 'Garnstudio DROPS',
    origin: 'Peru',
    tier: 'budget',
    weight: 'DK',
    gauge: { stitches: 21, needle_mm: 4.0 },
    fiber: [{ name: 'Alpaka', pct: 65 }, { name: 'Uld', pct: 35 }],
    meters_per_50g: 100,
    price_dkk_50g: 24,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 4, warmth: 4, elasticity: 3, drape: 4 },
    buyUrl: 'https://www.garnstudio.com/yarn.php?show=drops-lima&cid=17',
    description: 'DROPS Lima er en af de mest populære DK-garner i Skandinavien. Alpaka/uld-blandingen giver blødhed og varme til en meget lav pris.',
  },
  {
    id: 'drops-karisma',
    name: 'DROPS Karisma',
    brand: 'Garnstudio DROPS',
    origin: 'Uruguay',
    tier: 'budget',
    weight: 'DK',
    gauge: { stitches: 21, needle_mm: 4.0 },
    fiber: [{ name: 'Superwash Uld', pct: 100 }],
    meters_per_50g: 100,
    price_dkk_50g: 22,
    care: 'Maskinvask 40°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 3, warmth: 4, elasticity: 5, drape: 2 },
    buyUrl: 'https://www.garnstudio.com/yarn.php?show=drops-karisma&cid=17',
    description: 'Superwash-behandlet uld der kan tåle maskinen. Meget elastisk — ideel til ribmønster og farvespil. Mere rustik følelse end merino.',
  },
  {
    id: 'drops-snow',
    name: 'DROPS Snow',
    brand: 'Garnstudio DROPS',
    origin: 'Sydamerika',
    tier: 'budget',
    weight: 'bulky',
    gauge: { stitches: 14, needle_mm: 6.0 },
    fiber: [{ name: 'Uld', pct: 100 }],
    meters_per_50g: 50,
    price_dkk_50g: 22,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 3, warmth: 5, elasticity: 4, drape: 2 },
    buyUrl: 'https://www.garnstudio.com/yarn.php?show=drops-snow&cid=17',
    description: 'Tidligere kaldet Eskimo. Robust chunky-uld der strikker hurtigt. Rustik og varm — perfekt til vintertrøjer og tilbehør.',
  },
  {
    id: 'drops-kid-silk',
    name: 'DROPS Kid-Silk',
    brand: 'Garnstudio DROPS',
    origin: 'Sydafrika / Kina',
    tier: 'budget',
    weight: 'lace',
    gauge: { stitches: 25, needle_mm: 3.5 },  // bruges typisk holdt dobbelt eller med andet garn
    fiber: [{ name: 'Mohair', pct: 75 }, { name: 'Silke', pct: 25 }],
    meters_per_50g: 500,    // 25g nøgle = 250m → 50g equiv = 500m
    price_dkk_50g: 50,      // ~25 DKK / 25g nøgle
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://www.garnstudio.com/yarn.php?show=drops-kid-silk&cid=17',
    description: 'Budget-mohair med silkeglans. Sælges i 25g nøgler. Holdes typisk dobbelt med et tyndere garn for en halo-effekt.',
  },

  // ── Sandnes Garn (Mid → Premium) ──────────────────────────────────
  {
    id: 'sandnes-tynn-merinoull',
    name: 'Tynn Merinoull',
    brand: 'Sandnes Garn',
    origin: 'Norge (spundet)',
    tier: 'mid',
    weight: 'fingering',
    gauge: { stitches: 27, needle_mm: 3.0 },
    fiber: [{ name: 'Merino', pct: 100 }],
    meters_per_50g: 175,
    price_dkk_50g: 65,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 4, elasticity: 4, drape: 3 },
    buyUrl: 'https://www.sandnes-garn.com/tynn-merinoull',
    description: 'Norsk klassiker i 100% merino. Blødere og mere elastisk end DROPS Alpaca. God til detaljerede mønstre og farvespil.',
  },
  {
    id: 'sandnes-sunday',
    name: 'Sunday (PetiteKnit)',
    brand: 'Sandnes Garn',
    origin: 'Norge',
    tier: 'premium',
    weight: 'fingering',
    gauge: { stitches: 28, needle_mm: 3.0 },
    fiber: [{ name: 'Merino', pct: 100 }],
    meters_per_50g: 235,
    price_dkk_50g: 85,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 4, elasticity: 5, drape: 3 },
    buyUrl: 'https://www.sandnes-garn.com/petite-knit-sunday',
    description: 'PetiteKnits signaturegarn. Ekstremt blødt non-superwash merino med flot fald og glans. Bruges i mange af de mest populære Skandinaviske opskrifter.',
  },
  {
    id: 'sandnes-double-sunday',
    name: 'Double Sunday (PetiteKnit)',
    brand: 'Sandnes Garn',
    origin: 'Norge',
    tier: 'premium',
    weight: 'DK',
    gauge: { stitches: 21, needle_mm: 3.5 },
    fiber: [{ name: 'Merino', pct: 100 }],
    meters_per_50g: 108,
    price_dkk_50g: 95,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 4, elasticity: 5, drape: 3 },
    buyUrl: 'https://www.sandnes-garn.com/petite-knit-double-sunday',
    description: 'DK-versionen af Sunday. Strikker til 21 masker/10 cm på 3,5 mm. Tyk nok til at gå hurtigt, fin nok til detaljerede mønstre.',
  },
  {
    id: 'sandnes-fritidsgarn',
    name: 'Fritidsgarn',
    brand: 'Sandnes Garn',
    origin: 'Norge',
    tier: 'mid',
    weight: 'bulky',
    gauge: { stitches: 14, needle_mm: 6.0 },
    fiber: [{ name: 'Norsk Uld', pct: 100 }],
    meters_per_50g: 75,
    price_dkk_50g: 70,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 3, warmth: 5, elasticity: 4, drape: 2 },
    buyUrl: 'https://www.sandnes-garn.com/fritidsgarn',
    description: 'Norsk chunky-uld med karakter. Langt bedre kvalitet end DROPS Snow, med en rustik, autentisk følelse. God til Skandinaviske mønstervanter og trøjer.',
  },
  {
    id: 'sandnes-tynn-silk-mohair',
    name: 'Tynn Silk Mohair',
    brand: 'Sandnes Garn',
    origin: 'Sydafrika / Kina',
    tier: 'premium',
    weight: 'lace',
    gauge: { stitches: 22, needle_mm: 4.5 },  // bruges holdt dobbelt
    fiber: [{ name: 'Mohair', pct: 57 }, { name: 'Silke', pct: 28 }, { name: 'Uld', pct: 15 }],
    meters_per_50g: 424,   // 25g = 212m
    price_dkk_50g: 90,     // ~45 DKK / 25g
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://www.sandnes-garn.com/tynn-silk-mohair',
    description: 'Luksus mohair-silke i en tynd kvalitet. Bruges typisk holdt dobbelt med et tyndt garn for den karakteristiske "halo". OEKO-TEX certificeret.',
  },

  // ── Isager (Premium → Luxury) ─────────────────────────────────────
  {
    id: 'isager-alpaca2',
    name: 'Alpaca 2',
    brand: 'Isager',
    origin: 'Peru (fiber + spinding)',
    tier: 'premium',
    weight: 'fingering',
    gauge: { stitches: 26, needle_mm: 3.0 },
    fiber: [{ name: 'Alpaka', pct: 50 }, { name: 'Uld', pct: 50 }],
    meters_per_50g: 250,
    price_dkk_50g: 65,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: true,
    properties: { softness: 5, warmth: 4, elasticity: 3, drape: 4 },
    buyUrl: 'https://isagerstrik.dk/en/product/alpaca-2/',
    description: 'Isagers klassiske 2-ply i alpaka og uld. Utroligt blødt med et naturligt skær. Bruges i utallige Isager-opskrifter og er et benchmark for dansk luksus-garn.',
  },
  {
    id: 'isager-silk-mohair',
    name: 'Silk Mohair',
    brand: 'Isager',
    origin: 'Sydafrika / Kina',
    tier: 'premium',
    weight: 'lace',
    gauge: { stitches: 22, needle_mm: 4.0 },  // typisk holdt dobbelt
    fiber: [{ name: 'Silk Mohair', pct: 75 }, { name: 'Silke', pct: 25 }],
    meters_per_50g: 420,   // 25g = 210m
    price_dkk_50g: 130,    // ~65 DKK / 25g nøgle
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 1, drape: 5 },
    buyUrl: 'https://isagerstrik.dk/en/product/silk-mohair/',
    description: 'Isagers ikoniske mohair-silke. Et næsten usynligt garn der holdt dobbelt med Alpaca 2 skaber Isagers karakteristiske luftige, varme look.',
  },

  // ── BC Garn (Mid → Premium) ───────────────────────────────────────
  {
    id: 'bc-garn-semilla',
    name: 'Semilla GOTS',
    brand: 'BC Garn',
    origin: 'Argentina → Italien (spundet og farvet)',
    tier: 'mid',
    weight: 'sport',
    gauge: { stitches: 22, needle_mm: 3.5 },
    fiber: [{ name: 'Øko Uld', pct: 100 }],
    meters_per_50g: 161,
    price_dkk_50g: 85,
    care: 'Håndvask 30°C',
    eco: true, vegan: false, mulesing_free: true,
    properties: { softness: 4, warmth: 4, elasticity: 4, drape: 3 },
    buyUrl: 'https://www.bcgarn.com/semilla/',
    description: 'GOTS-certificeret økologisk uld uden mulesing. Håndfarvet i Italien. For dem der sætter pris på ægte bæredygtighed og et råt, naturligt look.',
  },
  {
    id: 'bc-garn-tarta',
    name: 'Tarta',
    brand: 'BC Garn',
    origin: 'Sydafrika / Kina',
    tier: 'premium',
    weight: 'lace',
    gauge: { stitches: 24, needle_mm: 3.0 },
    fiber: [{ name: 'Mohair', pct: 78 }, { name: 'Silke', pct: 13 }, { name: 'Uld', pct: 9 }],
    meters_per_50g: 400,
    price_dkk_50g: 95,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://www.bcgarn.com/tarta/',
    description: 'BC Garns version af klassisk silke-mohair. Lidt tungere end Isager Silk Mohair, med mere fylde og en tydelig halo-effekt.',
  },

  // ── Holst Garn (Mid) ──────────────────────────────────────────────
  {
    id: 'holst-coast',
    name: 'Coast',
    brand: 'Holst Garn',
    origin: 'Danmark',
    tier: 'mid',
    weight: 'sport',
    gauge: { stitches: 24, needle_mm: 3.5 },
    fiber: [{ name: 'Uld', pct: 75 }, { name: 'Bomuld', pct: 25 }],
    meters_per_50g: 106,
    price_dkk_50g: 60,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 3, warmth: 3, elasticity: 4, drape: 3 },
    buyUrl: 'https://holstgarn.com/coast/',
    description: 'Danskproduceret sport-garn i uld/bomuld. Stærkt og holdbart med en let, sommer-agtig følelse. Ideel til lette jakker og sommertrøjer.',
  },

  // ── Onion (Mid, Eco) ──────────────────────────────────────────────
  {
    id: 'onion-organic-cotton',
    name: 'Organic Cotton',
    brand: 'Onion',
    origin: 'Indien (øko)',
    tier: 'mid',
    weight: 'DK',
    gauge: { stitches: 21, needle_mm: 4.0 },
    fiber: [{ name: 'Øko Bomuld', pct: 100 }],
    meters_per_50g: 110,
    price_dkk_50g: 75,
    care: 'Maskinvask 40°C',
    eco: true, vegan: true, mulesing_free: true,
    properties: { softness: 3, warmth: 1, elasticity: 1, drape: 4 },
    buyUrl: 'https://onion.dk/',
    description: 'Dansk designet øko-bomuld. GOTS-certificeret og vegansk. Frisk og åndbart — perfekt til sommerstrik. Bemærk: ingen elasticitet, så ikke egnet til stramt ribmønster.',
  },

  // ── CaMaRose (Luxury) ─────────────────────────────────────────────
  {
    id: 'camarose-yak',
    name: 'Økologisk Yak',
    brand: 'CaMaRose',
    origin: 'Mongoliet / Danmark (design)',
    tier: 'premium',
    weight: 'DK',
    gauge: { stitches: 22, needle_mm: 4.0 },
    fiber: [{ name: 'Øko Uld', pct: 55 }, { name: 'Bambus', pct: 25 }, { name: 'Yak', pct: 20 }],
    meters_per_50g: 115,
    price_dkk_50g: 185,
    care: 'Håndvask 30°C',
    eco: true, vegan: false, mulesing_free: true,
    properties: { softness: 5, warmth: 5, elasticity: 3, drape: 4 },
    buyUrl: 'https://camarose.dk/',
    description: 'Det ultimative luksus-DK garn. Yak-fibre er ekstremt bløde og varme, bambus giver glans og drape. GOTS-certificeret og mulesing-fri.',
  },
];

// ─── Pattern Database ──────────────────────────────────────────────
// totalMeters_M = estimeret garnforbrug i meter, str. M (middelstørrelse)
// tiers = editorial curated alternativ-lister per tier

const PATTERNS = [
  {
    id: 'sophie-scarf',
    name: 'Sophie Scarf',
    emoji: '🧣',
    designer: 'PetiteKnit',
    type: 'Tørklæde',
    difficulty: 'Begynder',
    description: 'Let, luftigt tørklæde strikket i mohair holdt dobbelt. Giver en karakteristisk blød halo og et elegant fald. Et perfekt begynderprojekt — primært glatstrik med enkle kanter. Opskriften designes oprindeligt i Sandnes Garn Tynn Silk Mohair holdt dobbelt.',
    originalYarn_id: 'sandnes-tynn-silk-mohair',
    secondaryYarn_id: null,   // strikkes med samme garn holdt dobbelt — ikke to forskellige garn
    totalMeters_M: 600,        // ~3 × 25g nøgler Tynn Silk Mohair (samlet mohair-forbrug)
    tags: ['tørklæde', 'scarf', 'lace', 'mohair', 'holdt dobbelt', 'begynder', 'petiteknit'],
    tiers: {
      mid:     ['bc-garn-tarta'],           // Godt alternativ — lignende pris/kvalitet (95 DKK vs 90 original)
      budget:  ['drops-kid-silk'],          // Billigere alternativ — markant billigere (50 DKK, men gauge +3)
      premium: ['isager-silk-mohair'],      // Opgradering — luksus upgrade (130 DKK, eksakt gauge 22)
    },
  },
];

// Note: The 49 yarn objects from privat.xlsx (Eco & Allergisk) were added to the YARNS array.
// PATTERNS should contain only curated pattern objects with originalYarn_id and tier references.
// Once more patterns are designed for these specific yarns, they can be added here.
