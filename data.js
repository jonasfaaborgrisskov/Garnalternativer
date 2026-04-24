// ─── Tier Definitions ─────────────────────────────────────────────
const TIERS = {
  mid: {
    id: 'mid',
    emoji: '💰',
    label: 'Godt alternativ',
    sublabel: 'Lignende kvalitet, anden pris eller fiber',
    color: '#4a5e3a',
  },
  budget: {
    id: 'budget',
    emoji: '✂️',
    label: 'Billigere alternativ',
    sublabel: 'Markant billigere — gode resultater',
    color: '#3a4e6e',
  },
  premium: {
    id: 'premium',
    emoji: '🏆',
    label: 'Opgradering',
    sublabel: 'Mere eksklusivt end originalen',
    color: '#7a5c2e',
  },
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

  // ── Isager (Mid) ──────────────────────────────────────────────────
  {
    id: 'isager-soft',
    name: 'Isager Soft',
    brand: 'Isager',
    origin: 'Danmark (design + spinding)',
    tier: 'mid',
    weight: 'DK',
    gauge: { stitches: 22, needle_mm: 5.5 },
    fiber: [{ name: 'Alpaka', pct: 56 }, { name: 'Økologisk Pima Bomuld', pct: 44 }],
    meters_per_50g: 125,
    price_dkk_50g: 64,
    care: 'Håndvask 30°C',
    eco: true, vegan: false, mulesing_free: true,
    properties: { softness: 5, warmth: 3, elasticity: 3, drape: 4 },
    buyUrl: 'https://isagerstrik.dk/en/product/isager-soft/',
    description: 'Blødt og luksusrigtDK-garn af alpaka og økologisk bomuld. Perfekt til sommertrøjer og toppe. Dansk design og spinding.',
  },

  // ── Knitting for Olive (Premium) ───────────────────────────────────
  {
    id: 'kfo-compatible-cashmere',
    name: 'Compatible Cashmere',
    brand: 'Knitting for Olive',
    origin: 'Mongoliet',
    tier: 'premium',
    weight: 'lace',
    gauge: { stitches: 32, needle_mm: 2.0 },
    fiber: [{ name: 'Cashmere', pct: 100 }],
    meters_per_50g: 300,  // 150m per 25g skein
    price_dkk_50g: 450,
    care: 'Håndvask 20°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://www.knittingforolive.com/products/compatible-cashmere',
    description: '100% cashmere i lace-vægt. Eksklusivt og udsøgt. Bruges ofte holdt dobbelt eller tredobbelt for en fyldig effekt.',
  },

  // ── Isager Trio (Mid) ──────────────────────────────────────────────
  {
    id: 'isager-trio2',
    name: 'Isager Trio 2',
    brand: 'Isager',
    origin: 'Italien (spundet)',
    tier: 'mid',
    weight: 'sport',
    gauge: { stitches: 26, needle_mm: 3.5 },
    fiber: [{ name: 'Hør', pct: 50 }, { name: 'Bomuld', pct: 30 }, { name: 'Lyocell', pct: 20 }],
    meters_per_50g: 175,
    price_dkk_50g: 75,
    care: 'Maskivask 40°C',
    eco: true, vegan: false, mulesing_free: false,
    properties: { softness: 4, warmth: 2, elasticity: 2, drape: 5 },
    buyUrl: 'https://isagerstrik.dk/product-category/isager-yarn/',
    description: 'Sport-vægt blanding af linen, bomuldoch lyocell. Perfekt til sommerbeklædning. Åtbar og elegant med fin struktur.',
  },

  // ── Sandnes Garn Alpakka Ull (Mid) ────────────────────────────────
  {
    id: 'sandnes-alpakka-ull',
    name: 'Alpakka Ull',
    brand: 'Sandnes Garn',
    origin: 'Norge',
    tier: 'mid',
    weight: 'worsted',
    gauge: { stitches: 19, needle_mm: 5.0 },
    fiber: [{ name: 'Alpaka', pct: 65 }, { name: 'Uld', pct: 35 }],
    meters_per_50g: 100,
    price_dkk_50g: 78,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 3, drape: 4 },
    buyUrl: 'https://www.sandnes-garn.com/alpakka-ull',
    description: 'Klassisk norsk alpaka-uld i worsted vægt. Ekstremt blødt og varmt. Idéalt til sjals og accessories.',
  },

  // ── De Rerum Natura Gilliatt (Mid) ─────────────────────────────────
  {
    id: 'drn-gilliatt',
    name: 'De Rerum Natura Gilliatt',
    brand: 'De Rerum Natura',
    origin: 'Frankrig (100% spundet)',
    tier: 'mid',
    weight: 'worsted',
    gauge: { stitches: 18, needle_mm: 4.5 },
    fiber: [{ name: 'Merino Uld', pct: 100 }],
    meters_per_50g: 125,
    price_dkk_50g: 95,
    care: 'Håndvask 30°C',
    eco: true, vegan: false, mulesing_free: false,
    properties: { softness: 4, warmth: 4, elasticity: 3, drape: 4 },
    buyUrl: 'https://www.dererumnatura.fr/en/yarns/14-gilliatt.html',
    description: 'Økologisk merino-uld fra Frankrig. Woolen spun for luftig struktur. Perfekt til klassiske sweatre og jackets.',
  },

  // ── Casual Fashion Queen Sturdy Sock (Budget) ──────────────────────
  {
    id: 'cfq-sturdy-sock',
    name: 'Casual Fashion Queen Sturdy Sock',
    brand: 'Casual Fashion Queen',
    origin: 'USA (håndfarvet)',
    tier: 'budget',
    weight: 'fingering',
    gauge: { stitches: 32, needle_mm: 2.5 },
    fiber: [{ name: 'Merino Uld', pct: 75 }, { name: 'Nylon', pct: 25 }],
    meters_per_50g: 211.5,
    price_dkk_50g: 85,
    care: 'Maskivask 30°C (Superwash)',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 4, warmth: 4, elasticity: 5, drape: 2 },
    buyUrl: 'https://www.casualfashionqueen.com/',
    description: 'Håndfarvet merino-nylon sokkegarnt. Ekstra slidstærkt med Superwash behandling. Perfekt til hverdagssokker.',
  },

  // ── Cardiff Cashmere (Premium) ─────────────────────────────────────
  {
    id: 'cardiff-cashmere-classic',
    name: 'Cardiff Cashmere Classic',
    brand: 'Cardiff',
    origin: 'Italien (spundet)',
    tier: 'premium',
    weight: 'DK',
    gauge: { stitches: 22, needle_mm: 4.0 },
    fiber: [{ name: 'Cashmere', pct: 100 }],
    meters_per_50g: 224,  // 112m per 25g
    price_dkk_50g: 280,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://cardiffcashmere.it/en/products/classic',
    description: '100% cashmere i DK vægt. Italiensk luksus med udsøgt håndføle. Klassisk elegant til finstkvalitets projekter.',
  },

  // ── Euro Baby Kaleidoscope (Budget) ────────────────────────────────
  {
    id: 'euro-baby-kaleidoscope',
    name: 'Euro Baby Kaleidoscope',
    brand: 'Euro Baby',
    origin: 'USA',
    tier: 'budget',
    weight: 'bulky',
    gauge: { stitches: 12, needle_mm: 6.5 },
    fiber: [{ name: 'Acryl', pct: 100 }],
    meters_per_50g: 46,  // 185m per 200g bulky
    price_dkk_50g: 25,
    care: 'Maskivask kulde, tørretumbler lav',
    eco: false, vegan: true, mulesing_free: true,
    properties: { softness: 2, warmth: 4, elasticity: 4, drape: 2 },
    buyUrl: 'https://hobbii.com/',
    description: 'Budget-acryl i klare, lysende farver. Let at vedligeholde og maskinvaskbar. Perfekt til børneprojekter og tæppe.',
  },

  // ── Krea Deluxe Silk Mohair (Premium) ──────────────────────────────
  {
    id: 'krea-deluxe-silk-mohair',
    name: 'Krea Deluxe Silk Mohair',
    brand: 'Krea Deluxe',
    origin: 'Danmark (design)',
    tier: 'premium',
    weight: 'lace',
    gauge: { stitches: 20, needle_mm: 4.0 },
    fiber: [{ name: 'Silke', pct: 45 }, { name: 'Mohair', pct: 33 }, { name: 'Alpaka', pct: 22 }],
    meters_per_50g: 600,  // 240m per 20g
    price_dkk_50g: 625,
    care: 'Håndvask 30°C uden bløder',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 5, warmth: 5, elasticity: 2, drape: 5 },
    buyUrl: 'https://www.krea.dk/',
    description: 'Eksklusiv lace-vægt blanding af silke, mohair og alpaka. BørstetWorsted spun med elegant halo-effekt. Luksus til fine projekter.',
  },

  // ── Hobbii Highland Wool (Mid) ────────────────────────────────────
  {
    id: 'hobbii-highland-wool',
    name: 'Hobbii Highland Wool',
    brand: 'Hobbii',
    origin: 'Peru (fiber) → Danmark (handel)',
    tier: 'mid',
    weight: 'DK',
    gauge: { stitches: 23, needle_mm: 3.75 },
    fiber: [{ name: 'Peruvian Highland Uld', pct: 100 }],
    meters_per_50g: 175,
    price_dkk_50g: 50,
    care: 'Håndvask 30°C',
    eco: false, vegan: false, mulesing_free: false,
    properties: { softness: 4, warmth: 5, elasticity: 3, drape: 3 },
    buyUrl: 'https://hobbii.com/products/hp-1002348-highland-wool',
    description: 'Peruviansk highland-uld i DK vægt. Blød, varm og udsøgt. Let vedligeholdelse og prisvenlig luksus.',
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

  {
    id: 'scarlet-sweater',
    name: 'Scarlet Sweater',
    emoji: '🔴',
    designer: 'PetiteKnit',
    type: 'Sweater',
    difficulty: 'Intermediat',
    description: 'En elegant, klassisk sweater strikket oppefra og ned i glat strik med fine detaljer. Double Sunday fra Sandnes Garn skaber en blød, elastisk drape og en fantastisk håndføling.',
    originalYarn_id: 'sandnes-double-sunday',
    secondaryYarn_id: null,
    totalMeters_M: 1674,       // 750-800g × (108m/50g) = 1620-1728m
    tags: ['sweater', 'top-down', 'DK', 'merino', 'petiteknit', 'klassisk'],
    tiers: {
      mid:     [],             // TBD — afventer brugergodkendelse
      budget:  [],             // TBD — afventer brugergodkendelse
      premium: [],             // TBD — afventer brugergodkendelse
    },
  },

  {
    id: 'scarlet-cardigan',
    name: 'Scarlet Cardigan',
    emoji: '🔴',
    designer: 'PetiteKnit',
    type: 'Cardigan',
    difficulty: 'Intermediat',
    description: 'En smuk, klassisk cardigan strikket oppefra og ned. Designet giver elegant silhuet med øget længde på ærmerne.',
    originalYarn_id: 'sandnes-double-sunday',
    secondaryYarn_id: null,
    totalMeters_M: 1512,       // 700g × (108m/50g) = 1512m
    tags: ['cardigan', 'top-down', 'DK', 'merino', 'petiteknit', 'klassisk'],
    tiers: {
      mid:     [],             // TBD — afventer brugergodkendelse
      budget:  [],             // TBD — afventer brugergodkendelse
      premium: [],             // TBD — afventer brugergodkendelse
    },
  },

  {
    id: 'ivy-sweater',
    name: 'Ivy Sweater',
    emoji: '🌿',
    designer: 'PetiteKnit',
    type: 'Sweater',
    difficulty: 'Intermediat',
    description: 'En luftig, komfortabel sweater strikket oppefra og ned i glat strik. Isager Soft er et karakteristisk blow-yarn der skaber en elegant, luftig struktur.',
    originalYarn_id: 'isager-soft',
    secondaryYarn_id: null,
    totalMeters_M: 875,        // 350g × (125m/50g) = 875m
    tags: ['sweater', 'top-down', 'worsted', 'isager', 'blow-yarn', 'petiteknit'],
    tiers: {
      mid:     [],             // Snefnug by CaMaRose (PetiteKnit suggests, men ikke i db)
      budget:  [],             // Poppy by Sandnes Garn (PetiteKnit suggests, men ikke i db)
      premium: [],             // TBD — afventer brugergodkendelse
    },
  },

  {
    id: 'ivy-cardigan',
    name: 'Ivy Cardigan',
    emoji: '🌿',
    designer: 'PetiteKnit',
    type: 'Cardigan',
    difficulty: 'Intermediat',
    description: 'En elegant cardigan strikket fladt oppefra og ned med korte ærmer. Strikket med to tråde silk mohair holdt sammen.',
    originalYarn_id: 'krea-deluxe-silk-mohair',
    secondaryYarn_id: null,
    totalMeters_M: 432,        // 180g × (125m/50g når holdt dobbelt) = ~450m for double strands
    tags: ['cardigan', 'top-down', 'silk-mohair', 'lace', 'holdt-dobbelt', 'petiteknit'],
    tiers: {
      mid:     ['sandnes-tynn-silk-mohair'],    // Godt alternativ — samme gaugeweight, lidt billigere
      budget:  [],                              // Kunne være budget-alternative, men samme karakteristika ønskes
      premium: ['isager-silk-mohair'],          // Opgradering — Isagers ikoniske silk mohair
    },
  },
];

// Note: The 49 yarn objects from privat.xlsx (Eco & Allergisk) were added to the YARNS array.
// PATTERNS should contain only curated pattern objects with originalYarn_id and tier references.
// Once more patterns are designed for these specific yarns, they can be added here.
