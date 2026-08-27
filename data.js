// Mintdle dataset — 39 collections.
// Market data: CoinGecko's free NFT API, snapshot 2026-08-27
//   (tools/fetch-collections.js). Year, class and provenance are authored
//   (tools/roster.json, tools/lore.json). Rebuild with tools/build-data.js.
//
// n  = display name (unique)      k  = collection key, also img/<k>.webp
// c  = chain                      y  = mint year
// s  = total supply               g  = class
// f  = floor price in USD         fn = floor in its native currency
// cs = that currency's symbol     p  = all-time-high floor, native
// w  = rotation weight (fame)     l  = one-line provenance
//
// The game grades supply and floor by order-of-magnitude tier, never by exact
// value, which is what makes approximate market data safe to ship.

var CHAINS = ["Ethereum"];
var EVM_FAMILY = { "Ethereum": 1 };

var CATS = ["PFP", "Meme", "Derivative", "Art", "Onchain", "Gaming", "Land", "Utility", "Collectible"];
// Yellow on the class axis: the same kind of thing, differently executed.
var CAT_FAMILY = {
  "PFP": "avatar", "Meme": "avatar", "Derivative": "avatar",
  "Art": "art", "Onchain": "art",
  "Gaming": "world", "Land": "world",
  "Utility": "access", "Collectible": "access"
};

// Supply tiers. 10,000 is the format's default, so the top tier is the crowded
// one and the interesting information is below it.
// 1: <=100 · 2: 101-999 · 3: 1K-4,999 · 4: 5K-9,999 · 5: 10K+
function supplyTier(s) { if (s <= 100) return 1; if (s < 1000) return 2; if (s < 5000) return 3; if (s < 10000) return 4; return 5; }
var SUPPLY_LABELS = ["", "\u2264100", "100+", "1K+", "5K+", "10K+"];

// Floor tiers, in USD. The dataset spans three native currencies, so a ladder
// denominated in ETH would grade 9 SOL and 9 ETH as the same rung.
// 1: <$100 · 2: $100-$999 · 3: $1K-$9,999 · 4: $10K-$99,999 · 5: $100K+
function floorTier(f) { if (f < 100) return 1; if (f < 1000) return 2; if (f < 10000) return 3; if (f < 100000) return 4; return 5; }
var FLOOR_LABELS = ["", "<$100", "$100+", "$1K+", "$10K+", "$100K+"];

var COLLECTIONS = [
  { n: "CryptoPunks", k: "cryptopunks", c: "Ethereum", y: 2017, s: 9994, f: 79522, fn: 31.8, cs: "ETH", p: 125, g: "PFP", w: 4, l: "Ten thousand 24x24 characters given away free in 2017 to anyone with an Ethereum wallet and the patience to claim one. They invented the profile picture." },
  { n: "Bored Ape Yacht Club", k: "bored-ape-yacht-club", c: "Ethereum", y: 2021, s: 9998, f: 19969, fn: 7.98, cs: "ETH", p: 153.7, g: "PFP", w: 4, l: "A swamp club for apes who got rich on crypto and are bored of it. For about eighteen months it was the most valuable membership card on earth." },
  { n: "Mutant Ape Yacht Club", k: "mutant-ape-yacht-club", c: "Ethereum", y: 2021, s: 19568, f: 2972, fn: 1.19, cs: "ETH", p: 40, g: "Derivative", w: 4, l: "Every ape holder got a vial of mutant serum. Drinking it produced a second, uglier ape and doubled the size of the club overnight." },
  { n: "Bored Ape Kennel Club", k: "bored-ape-kennel-club", c: "Ethereum", y: 2021, s: 9602, f: 478, fn: 0.191, cs: "ETH", p: 14.4, g: "Derivative", w: 2.5, l: "A free dog for every ape. The airdrop that taught the whole market what a companion collection was worth." },
  { n: "Bored Ape Chemistry Club", k: "bored-ape-chemistry-club", c: "Ethereum", y: 2021, s: 448, f: 5978, fn: 2.39, cs: "ETH", p: 60.69, g: "Derivative", w: 1, l: "The serum itself, minted as an object. A collection whose entire purpose was to be destroyed to create another one." },
  { n: "Azuki", k: "azuki", c: "Ethereum", y: 2022, s: 10000, f: 2201, fn: 0.8795, cs: "ETH", p: 31.8, g: "PFP", w: 4, l: "Anime skaters from a studio that understood art direction better than any PFP project before it. Then the founder's abandoned past projects surfaced." },
  { n: "BEANZ Official", k: "beanz-official", c: "Ethereum", y: 2022, s: 19950, f: 130, fn: 0.052, cs: "ETH", p: 6.9, g: "Derivative", w: 2.5, l: "The companion airdrop to Azuki, and briefly worth more than most standalone collections." },
  { n: "Azuki Elementals", k: "azuki-elementals", c: "Ethereum", y: 2023, s: 17765, f: 195, fn: 0.0779, cs: "ETH", p: 1.98, g: "Derivative", w: 2.5, l: "The sequel mint that took $38M in minutes and shipped art so close to the original that holders revolted within the hour." },
  { n: "Azuki Elemental Beans", k: "azuki-elemental-beans", c: "Ethereum", y: 2023, s: 5387, f: 901, fn: 0.36, cs: "ETH", p: 3, g: "Derivative", w: 1, l: "A companion to the sequel. The tree of Azuki derivatives had by now grown a third branch." },
  { n: "Milady Maker", k: "milady-maker", c: "Ethereum", y: 2021, s: 9978, f: 2703, fn: 1.08, cs: "ETH", p: 7.35, g: "Meme", w: 4, l: "Neochibi girls in a deliberately ugly 2000s internet style, run by an anonymous poster with a difficult history. Elon Musk tweeted one and the floor tripled." },
  { n: "Redacted Remilio Babies", k: "redacted-remilio-babies", c: "Ethereum", y: 2022, s: 9998, f: 447, fn: 0.179, cs: "ETH", p: 2.12, g: "Derivative", w: 2.5, l: "The Milady spinoff by the same scene, sold as the boy version. It outlived most of the collections that laughed at it." },
  { n: "Doodles", k: "doodles-official", c: "Ethereum", y: 2021, s: 9998, f: 939, fn: 0.3752, cs: "ETH", p: 23.95, g: "PFP", w: 4, l: "Pastel line-art by Burnt Toast, one of the few 2021 collections whose art was legible at thumbnail size. It later spent its treasury on a record label." },
  { n: "Space Doodles", k: "space-doodles", c: "Ethereum", y: 2022, s: 7550, f: 1220, fn: 0.488, cs: "ETH", p: 200, g: "Derivative", w: 1, l: "Doodles put in rocket ships. The original was locked inside and could be extracted at any time." },
  { n: "Moonbirds", k: "moonbirds", c: "Ethereum", y: 2022, s: 10000, f: 1594, fn: 0.637, cs: "ETH", p: 38.5, g: "PFP", w: 4, l: "Ten thousand owls from a founder with a large newsletter, minted to instant billions and then a long unwinding. Nesting locked them up; a CC0 pivot split the holders." },
  { n: "Moonbirds Oddities", k: "moonbirds-oddities", c: "Ethereum", y: 2022, s: 6048, f: 195, fn: 0.078, cs: "ETH", p: 3.95, g: "Derivative", w: 1, l: "The strange ones, airdropped to nesters. Deliberately worse art as a reward for patience." },
  { n: "Clone X", k: "clonex", c: "Ethereum", y: 2021, s: 19764, f: 650, fn: 0.2599, cs: "ETH", p: 19.5, g: "PFP", w: 4, l: "RTFKT and Murakami built 3D avatars intended for a metaverse that never opened. Nike bought the studio, then quietly wound it down." },
  { n: "DeGods", k: "degods", c: "Ethereum", y: 2021, s: 8990, f: 491, fn: 0.1965, cs: "ETH", p: 13.33, g: "PFP", w: 2.5, l: "Started on Solana, bridged to Ethereum, deleted its own art twice, and burned its royalties. The most restless blue chip in the market." },
  { n: "mfers", k: "mfers", c: "Ethereum", y: 2021, s: 10019, f: 394, fn: 0.1577, cs: "ETH", p: 3.3, g: "Meme", w: 2.5, l: "Sartoshi drew a stick figure at a computer, released it CC0, then quit and dissolved his own control of the project. Everyone copied it, which was the point." },
  { n: "Lil Nouns", k: "lil-nouns", c: "Ethereum", y: 2022, s: 7685, f: 50, fn: 0.02, cs: "ETH", p: 0.4, g: "Derivative", w: 1, l: "Nouns, but every fifteen minutes instead of every day, and cheaper. Governance as a firehose." },
  { n: "Autoglyphs", k: "autoglyphs", c: "Ethereum", y: 2019, s: 512, f: 217790, fn: 87, cs: "ETH", p: 567, g: "Onchain", w: 4, l: "The first generative art written entirely into an Ethereum contract. 512 of them, minted in 2019, and the code draws each one on demand." },
  { n: "Cool Cats", k: "cool-cats", c: "Ethereum", y: 2021, s: 9999, f: 426, fn: 0.17, cs: "ETH", p: 15.1, g: "PFP", w: 2.5, l: "Blue cats with a friendly line, one of the few 2021 mints that broke out on charm alone rather than a roadmap." },
  { n: "World of Women", k: "world-of-women", c: "Ethereum", y: 2021, s: 10000, f: 238, fn: 0.095, cs: "ETH", p: 13.37, g: "PFP", w: 1, l: "A collection of women, by a woman, at a moment when the market was almost entirely apes and dogs. Reese Witherspoon bought one and the floor moved." },
  { n: "World of Women Galaxy", k: "world-of-women-galaxy", c: "Ethereum", y: 2022, s: 21480, f: 20, fn: 0.0078, cs: "ETH", p: 1.53, g: "Derivative", w: 1, l: "The 22,222-piece expansion, airdropped and sold to widen a collection that had become a brand." },
  { n: "VeeFriends", k: "veefriends", c: "Ethereum", y: 2021, s: 10255, f: 3745, fn: 1.5, cs: "ETH", p: 69, g: "Utility", w: 4, l: "Gary Vaynerchuk's hand-drawn characters, where the token is a multi-year ticket to his conference. An NFT that is legally a door." },
  { n: "VeeFriends Series 2", k: "veefriends-series-2", c: "Ethereum", y: 2022, s: 55277, f: 210, fn: 0.0838, cs: "ETH", p: 0.4, g: "Utility", w: 4, l: "The second series, minted into a market that had stopped believing in the first." },
  { n: "Gutter Cat Gang", k: "gutter-cat-gang", c: "Ethereum", y: 2021, s: 3000, f: 300, fn: 0.12, cs: "ETH", p: 6.59, g: "PFP", w: 1, l: "Street cats with a hard edge, and one of the earliest collections to give holders land and spinoff species." },
  { n: "Hashmasks", k: "hashmasks", c: "Ethereum", y: 2021, s: 16372, f: 188, fn: 0.075, cs: "ETH", p: 1.9, g: "Art", w: 1, l: "16,384 painted portraits by 70 artists, sold on a curve, where holders vote on each mask's name with a token that drips daily." },
  { n: "Otherdeed for Otherside", k: "otherdeed-for-otherside", c: "Ethereum", y: 2022, s: 47221, f: 198, fn: 0.079, cs: "ETH", p: 5, g: "Land", w: 4, l: "Yuga's land sale broke Ethereum for a night and burned over $150M in gas. The metaverse it deeded has never fully opened." },
  { n: "Captainz", k: "the-captainz", c: "Ethereum", y: 2022, s: 9999, f: 173, fn: 0.069, cs: "ETH", p: 9.73, g: "PFP", w: 1.5, l: "Memeland's pirate crew, from the team behind 9GAG. One of the last 2022 mints to hold a serious floor." },
  { n: "The Potatoz", k: "the-potatoz", c: "Ethereum", y: 2022, s: 9999, f: 124, fn: 0.0494, cs: "ETH", p: 6.78, g: "Utility", w: 1, l: "The free Memeland potato that came first and quietly outperformed most of what it was promoting." },
  { n: "Chimpers", k: "chimpers", c: "Ethereum", y: 2022, s: 5555, f: 1550, fn: 0.6194, cs: "ETH", p: 2.97, g: "PFP", w: 4, l: "Pixel chimps with animated idle loops, drawn with more care than the format usually gets." },
  { n: "rektguy", k: "rektguy", c: "Ethereum", y: 2022, s: 8814, f: 423, fn: 0.1688, cs: "ETH", p: 1.9, g: "Meme", w: 2.5, l: "OSF drew a slumped figure in a hoodie after getting wrecked, and 10,000 people recognised themselves in it." },
  { n: "Sproto Gremlins", k: "sproto-gremlins", c: "Ethereum", y: 2023, s: 3330, f: 673, fn: 0.2688, cs: "ETH", p: 4.19, g: "Meme", w: 2.5, l: "Green gremlins from the Milady extended universe, and one of the few 2023 mints that ran without a roadmap or a promise." },
  { n: "goblintown.wtf", k: "goblintown-wtf", c: "Ethereum", y: 2022, s: 9999, f: 235, fn: 0.0938, cs: "ETH", p: 7.35, g: "Meme", w: 1, l: "A free mint of hideous goblins with no roadmap, no Discord and a Twitter Space of people screaming. It hit a 7 ETH floor on pure nihilism." },
  { n: "More Loot", k: "more-loot", c: "Ethereum", y: 2021, s: 136572, f: 1, fn: 0.0002, cs: "ETH", p: 1, g: "Derivative", w: 1, l: "The uncapped sequel anyone could mint, which proved how much of Loot's value was the scarcity rather than the words." },
  { n: "Pixelmon", k: "pixelmon", c: "Ethereum", y: 2022, s: 13004, f: 22, fn: 0.0088, cs: "ETH", p: 3, g: "Gaming", w: 1, l: "Raised $70M, then revealed art so bad it became a meme in its own right. It hired real artists and salvaged a fraction of it." },
  { n: "Wassies by Wassies", k: "loomlocknft", c: "Ethereum", y: 2021, s: 9644, f: 366, fn: 0.1465, cs: "ETH", p: 2.45, g: "Meme", w: 1, l: "Wassies: badly drawn blue creatures by an anonymous artist, sold as a joke about crypto traders, and adopted by exactly those traders." },
  { n: "OnChainMonkey", k: "onchainmonkey", c: "Ethereum", y: 2021, s: 10000, f: 693, fn: 0.2772, cs: "ETH", p: 2.98, g: "Onchain", w: 1, l: "10,000 monkeys generated and stored in a single Ethereum transaction, then later inscribed onto Bitcoin. A collection built to survive its own marketplace." },
  { n: "CyberKongz", k: "cyberkongz", c: "Ethereum", y: 2021, s: 1000, f: 4007, fn: 1.6, cs: "ETH", p: 26.9, g: "PFP", w: 2.5, l: "Genesis gorillas that paid holders a daily token years before staking was normal, and were among the first to grant clear commercial rights." }
];
