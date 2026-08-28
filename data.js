// Mintdle dataset — 72 collections.
// Market data: CoinGecko's free NFT API, snapshot 2026-08-28
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

var CHAINS = ["Ethereum","Solana","Bitcoin","Polygon","HyperEVM","Robinhood"];
var EVM_FAMILY = { "Ethereum": 1, "Polygon": 1, "HyperEVM": 1, "Robinhood": 1 };

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
  { n: "Bored Ape Chemistry Club", k: "bored-ape-chemistry-club", c: "Ethereum", y: 2021, s: 448, f: 5978, fn: 2.39, cs: "ETH", p: 60.69, g: "Derivative", w: 2.5, l: "The serum itself, minted as an object. A collection whose entire purpose was to be destroyed to create another one." },
  { n: "Azuki", k: "azuki", c: "Ethereum", y: 2022, s: 10000, f: 2201, fn: 0.8795, cs: "ETH", p: 31.8, g: "PFP", w: 4, l: "Anime skaters from a studio that understood art direction better than any PFP project before it. Then the founder's abandoned past projects surfaced." },
  { n: "BEANZ Official", k: "beanz-official", c: "Ethereum", y: 2022, s: 19950, f: 130, fn: 0.052, cs: "ETH", p: 6.9, g: "Derivative", w: 2.5, l: "The companion airdrop to Azuki, and briefly worth more than most standalone collections." },
  { n: "Azuki Elementals", k: "azuki-elementals", c: "Ethereum", y: 2023, s: 17765, f: 195, fn: 0.0779, cs: "ETH", p: 1.98, g: "Derivative", w: 2.5, l: "The sequel mint that took $38M in minutes and shipped art so close to the original that holders revolted within the hour." },
  { n: "Milady Maker", k: "milady-maker", c: "Ethereum", y: 2021, s: 9978, f: 2703, fn: 1.08, cs: "ETH", p: 7.35, g: "Meme", w: 4, l: "Neochibi girls in a deliberately ugly 2000s internet style, run by an anonymous poster with a difficult history. Elon Musk tweeted one and the floor tripled." },
  { n: "Redacted Remilio Babies", k: "redacted-remilio-babies", c: "Ethereum", y: 2022, s: 9998, f: 447, fn: 0.179, cs: "ETH", p: 2.12, g: "Derivative", w: 2.5, l: "The Milady spinoff by the same scene, sold as the boy version. It outlived most of the collections that laughed at it." },
  { n: "Doodles", k: "doodles-official", c: "Ethereum", y: 2021, s: 9998, f: 939, fn: 0.3752, cs: "ETH", p: 23.95, g: "PFP", w: 4, l: "Pastel line-art by Burnt Toast, one of the few 2021 collections whose art was legible at thumbnail size. It later spent its treasury on a record label." },
  { n: "Space Doodles", k: "space-doodles", c: "Ethereum", y: 2022, s: 7550, f: 1220, fn: 0.488, cs: "ETH", p: 200, g: "Derivative", w: 2.5, l: "Doodles put in rocket ships. The original was locked inside and could be extracted at any time." },
  { n: "Moonbirds", k: "moonbirds", c: "Ethereum", y: 2022, s: 10000, f: 1594, fn: 0.637, cs: "ETH", p: 38.5, g: "PFP", w: 4, l: "Ten thousand owls from a founder with a large newsletter, minted to instant billions and then a long unwinding. Nesting locked them up; a CC0 pivot split the holders." },
  { n: "Clone X", k: "clonex", c: "Ethereum", y: 2021, s: 19764, f: 650, fn: 0.2599, cs: "ETH", p: 19.5, g: "PFP", w: 4, l: "RTFKT and Murakami built 3D avatars intended for a metaverse that never opened. Nike bought the studio, then quietly wound it down." },
  { n: "DeGods", k: "degods", c: "Ethereum", y: 2021, s: 8990, f: 491, fn: 0.1965, cs: "ETH", p: 13.33, g: "PFP", w: 2.5, l: "Started on Solana, bridged to Ethereum, deleted its own art twice, and burned its royalties. The most restless blue chip in the market." },
  { n: "mfers", k: "mfers", c: "Ethereum", y: 2021, s: 10019, f: 394, fn: 0.1577, cs: "ETH", p: 3.3, g: "Meme", w: 2.5, l: "Sartoshi drew a stick figure at a computer, released it CC0, then quit and dissolved his own control of the project. Everyone copied it, which was the point." },
  { n: "Nouns", k: "nouns", c: "Ethereum", y: 2021, s: 1979, f: 3746, fn: 1.5, cs: "ETH", p: 142.69, g: "Onchain", w: 2.5, l: "One noun auctioned every single day, forever, with the proceeds going to a treasury the holders vote on. The art lives entirely on Ethereum." },
  { n: "Lil Nouns", k: "lil-nouns", c: "Ethereum", y: 2022, s: 7685, f: 50, fn: 0.02, cs: "ETH", p: 0.4, g: "Derivative", w: 2.5, l: "Nouns, but every fifteen minutes instead of every day, and cheaper. Governance as a firehose." },
  { n: "Meebits", k: "meebits", c: "Ethereum", y: 2021, s: 19999, f: 1076, fn: 0.4295, cs: "ETH", p: 7.2, g: "PFP", w: 4, l: "Larva Labs followed CryptoPunks with 20,000 voxel characters. The 3D models shipped with them, years before anything could use them." },
  { n: "Autoglyphs", k: "autoglyphs", c: "Ethereum", y: 2019, s: 512, f: 217790, fn: 87, cs: "ETH", p: 567, g: "Onchain", w: 4, l: "The first generative art written entirely into an Ethereum contract. 512 of them, minted in 2019, and the code draws each one on demand." },
  { n: "Cool Cats", k: "cool-cats", c: "Ethereum", y: 2021, s: 9999, f: 426, fn: 0.17, cs: "ETH", p: 15.1, g: "PFP", w: 2.5, l: "Blue cats with a friendly line, one of the few 2021 mints that broke out on charm alone rather than a roadmap." },
  { n: "World of Women", k: "world-of-women", c: "Ethereum", y: 2021, s: 10000, f: 238, fn: 0.095, cs: "ETH", p: 13.37, g: "PFP", w: 2.5, l: "A collection of women, by a woman, at a moment when the market was almost entirely apes and dogs. Reese Witherspoon bought one and the floor moved." },
  { n: "VeeFriends", k: "veefriends", c: "Ethereum", y: 2021, s: 10255, f: 3745, fn: 1.5, cs: "ETH", p: 69, g: "Utility", w: 4, l: "Gary Vaynerchuk's hand-drawn characters, where the token is a multi-year ticket to his conference. An NFT that is legally a door." },
  { n: "Gutter Cat Gang", k: "gutter-cat-gang", c: "Ethereum", y: 2021, s: 3000, f: 300, fn: 0.12, cs: "ETH", p: 6.59, g: "PFP", w: 2.5, l: "Street cats with a hard edge, and one of the earliest collections to give holders land and spinoff species." },
  { n: "Sappy Seals", k: "sappy-seals", c: "Ethereum", y: 2021, s: 9997, f: 171, fn: 0.0684, cs: "ETH", p: 1.99, g: "PFP", w: 1.5, l: "Sad pixel seals with an unusually stubborn community that kept the project alive through two full bear markets." },
  { n: "Pudgy Penguins", k: "pudgy-penguins", c: "Ethereum", y: 2021, s: 8888, f: 10871, fn: 4.34, cs: "ETH", p: 36.33, g: "PFP", w: 4, l: "Founded by college students, taken from them by the community, and rebuilt into toys sold in Walmart. The only NFT project that became a real consumer brand." },
  { n: "Lil Pudgys", k: "lilpudgys", c: "Ethereum", y: 2022, s: 21931, f: 1097, fn: 0.4379, cs: "ETH", p: 4.53, g: "Derivative", w: 4, l: "The little ones, 22,222 of them. The overflow collection that let a sold-out community keep growing." },
  { n: "Opepen Edition", k: "opepen-edition", c: "Ethereum", y: 2023, s: 16000, f: 175, fn: 0.0698, cs: "ETH", p: 1.025, g: "Onchain", w: 2.5, l: "Jack Butcher's 16,000 sets of four shapes, revealed slowly through opt-in art drops. A collection that was a years-long performance." },
  { n: "Checks - VV Edition", k: "vv-checks", c: "Ethereum", y: 2023, s: 5380, f: 497, fn: 0.199, cs: "ETH", p: 2.8, g: "Onchain", w: 2.5, l: "Eighty checkmarks in a grid, sold at $8, satirising Twitter's paid verification. Burning four gives you one with half as many, all the way down to a single check." },
  { n: "Terraforms by Mathcastles", k: "terraforms-by-mathcastles", c: "Ethereum", y: 2021, s: 9911, f: 653, fn: 0.261, cs: "ETH", p: 4, g: "Onchain", w: 2.5, l: "A 20-storey tower of ASCII landscapes rendered entirely by the contract, with music encoded in it. Onchain art at its most ambitious." },
  { n: "Fidenza by Tyler Hobbs", k: "fidenza-by-tyler-hobbs", c: "Ethereum", y: 2021, s: 999, f: 43674, fn: 17.49, cs: "ETH", p: 92.5, g: "Art", w: 4, l: "999 flow-field paintings from Art Blocks, and the piece that convinced the traditional art world that generative code was a medium." },
  { n: "Chromie Squiggle by Snowfro", k: "chromie-squiggle-by-snowfro", c: "Ethereum", y: 2020, s: 10000, f: 6039, fn: 2.41, cs: "ETH", p: 14, g: "Art", w: 4, l: "The first Art Blocks project, by the man who built Art Blocks. A single wave of colour, and the signature of the entire generative movement." },
  { n: "Ringers by Dmitri Cherniak", k: "ringers-by-dmitri-cherniak", c: "Ethereum", y: 2021, s: 1000, f: 20163, fn: 8.06, cs: "ETH", p: 44, g: "Art", w: 2.5, l: "String wound around pegs, 1,000 ways. Ringers #879 sold at Sotheby's out of the FTX estate for $6.2M." },
  { n: "Hashmasks", k: "hashmasks", c: "Ethereum", y: 2021, s: 16372, f: 188, fn: 0.075, cs: "ETH", p: 1.9, g: "Art", w: 2.5, l: "16,384 painted portraits by 70 artists, sold on a curve, where holders vote on each mask's name with a token that drips daily." },
  { n: "Otherdeed for Otherside", k: "otherdeed-for-otherside", c: "Ethereum", y: 2022, s: 47221, f: 198, fn: 0.079, cs: "ETH", p: 5, g: "Land", w: 4, l: "Yuga's land sale broke Ethereum for a night and burned over $150M in gas. The metaverse it deeded has never fully opened." },
  { n: "Captainz", k: "the-captainz", c: "Ethereum", y: 2022, s: 9999, f: 173, fn: 0.069, cs: "ETH", p: 9.73, g: "PFP", w: 1.5, l: "Memeland's pirate crew, from the team behind 9GAG. One of the last 2022 mints to hold a serious floor." },
  { n: "Chimpers", k: "chimpers", c: "Ethereum", y: 2022, s: 5555, f: 1550, fn: 0.6194, cs: "ETH", p: 2.97, g: "PFP", w: 4, l: "Pixel chimps with animated idle loops, drawn with more care than the format usually gets." },
  { n: "rektguy", k: "rektguy", c: "Ethereum", y: 2022, s: 8814, f: 423, fn: 0.1688, cs: "ETH", p: 1.9, g: "Meme", w: 2.5, l: "OSF drew a slumped figure in a hoodie after getting wrecked, and 10,000 people recognised themselves in it." },
  { n: "Sproto Gremlins", k: "sproto-gremlins", c: "Ethereum", y: 2023, s: 3330, f: 673, fn: 0.2688, cs: "ETH", p: 4.19, g: "Meme", w: 2.5, l: "Green gremlins from the Milady extended universe, and one of the few 2023 mints that ran without a roadmap or a promise." },
  { n: "goblintown.wtf", k: "goblintown-wtf", c: "Ethereum", y: 2022, s: 9999, f: 235, fn: 0.0938, cs: "ETH", p: 7.35, g: "Meme", w: 2.5, l: "A free mint of hideous goblins with no roadmap, no Discord and a Twitter Space of people screaming. It hit a 7 ETH floor on pure nihilism." },
  { n: "Loot", k: "loot", c: "Ethereum", y: 2021, s: 7779, f: 150, fn: 0.06, cs: "ETH", p: 13.5, g: "Onchain", w: 2.5, l: "Eight lines of text listing adventurer gear, released free by Dom Hofmann. No art at all — the images were left for other people to build." },
  { n: "Pixelmon", k: "pixelmon", c: "Ethereum", y: 2022, s: 13004, f: 22, fn: 0.0088, cs: "ETH", p: 3, g: "Gaming", w: 2.5, l: "Raised $70M, then revealed art so bad it became a meme in its own right. It hired real artists and salvaged a fraction of it." },
  { n: "OnChainMonkey", k: "onchainmonkey", c: "Ethereum", y: 2021, s: 10000, f: 693, fn: 0.2772, cs: "ETH", p: 2.98, g: "Onchain", w: 2.5, l: "10,000 monkeys generated and stored in a single Ethereum transaction, then later inscribed onto Bitcoin. A collection built to survive its own marketplace." },
  { n: "CyberKongz", k: "cyberkongz", c: "Ethereum", y: 2021, s: 1000, f: 4007, fn: 1.6, cs: "ETH", p: 26.9, g: "PFP", w: 2.5, l: "Genesis gorillas that paid holders a daily token years before staking was normal, and were among the first to grant clear commercial rights." },
  { n: "Nakamigos", k: "nakamigos", c: "Ethereum", y: 2023, s: 19929, f: 250, fn: 0.1, cs: "ETH", p: 0.85, g: "PFP", w: 2.5, l: "A punk-shaped collection released cheap and CC0 in a dead market, which caught a wave nobody expected and briefly did enormous volume." },
  { n: "Invisible Friends", k: "invisible-friends", c: "Ethereum", y: 2022, s: 5000, f: 354, fn: 0.1414, cs: "ETH", p: 7.8, g: "PFP", w: 2.5, l: "Markus Magnusson's walking animated figures. The mint sold out instantly on the strength of a single looping GIF." },
  { n: "DeadFellaz", k: "deadfellaz", c: "Ethereum", y: 2021, s: 10000, f: 215, fn: 0.0859, cs: "ETH", p: 1.88, g: "PFP", w: 2.5, l: "Zombies with a founder who ran the project publicly under her own name, which in 2021 was rare enough to matter." },
  { n: "Mocaverse", k: "mocaverse", c: "Ethereum", y: 2023, s: 8888, f: 330, fn: 0.132, cs: "ETH", p: 5.48, g: "Utility", w: 2.5, l: "Animoca's own membership NFT, sitting at the centre of a portfolio of several hundred gaming companies." },
  { n: "RENGA", k: "renga", c: "Ethereum", y: 2022, s: 9123, f: 106, fn: 0.0425, cs: "ETH", p: 2.95, g: "Art", w: 2.5, l: "Dan RENGA drew every one of the 10,000 by hand in black and white, refusing traits. Then he kept adding chapters to the story for years." },
  { n: "CrypToadz", k: "cryptoadz", c: "Ethereum", y: 2021, s: 7022, f: 953, fn: 0.38, cs: "ETH", p: 13.95, g: "Meme", w: 2.5, l: "Gremplin's CC0 toads, released with no promises and immediately forked by everyone. The public-domain experiment that actually worked." },
  { n: "CryptoDickbutts", k: "cryptodickbutts", c: "Ethereum", y: 2021, s: 5198, f: 1598, fn: 0.639, cs: "ETH", p: 3.69, g: "Meme", w: 2.5, l: "A 2021 collection of exactly what the name says, drawn from a decade-old comic, and somehow still trading years later." },
  { n: "0N1 Force", k: "0n1force", c: "Ethereum", y: 2021, s: 7775, f: 133, fn: 0.053, cs: "ETH", p: 8.9, g: "PFP", w: 2.5, l: "7,777 anime spirits with a fully written mythology, from the last quarter of 2021 when a lore document was mandatory." },
  { n: "Kanpai Pandas", k: "kanpai-pandas", c: "Ethereum", y: 2022, s: 8826, f: 81, fn: 0.0324, cs: "ETH", p: 3.85, g: "PFP", w: 2.5, l: "Pandas with an unusually loyal holder base and a founder who kept shipping long after the market stopped watching." },
  { n: "Creepz by OVERLORD", k: "creepz-genesis", c: "Ethereum", y: 2021, s: 11111, f: 501, fn: 0.2, cs: "ETH", p: 5.78, g: "PFP", w: 2.5, l: "Reptilian invaders running a yield game that paid holders to raid each other. One of the first NFT collections with genuine game theory in it." },
  { n: "Chain Runners", k: "chain-runners", c: "Ethereum", y: 2021, s: 9999, f: 50, fn: 0.02, cs: "ETH", p: 1.78, g: "Onchain", w: 2.5, l: "Cyberpunk runners rendered entirely by the contract from onchain trait data, with the art generated at read time." },
  { n: "Mad Lads", k: "mad-lads", c: "Solana", y: 2023, s: 9968, f: 940, fn: 9.02, cs: "SOL", p: 229.42, g: "PFP", w: 4, l: "Backpack's xNFT collection, minted in a scramble that took Solana's RPCs down. The strongest thing to launch on Solana since the crash." },
  { n: "Okay Bears", k: "okay-bears", c: "Solana", y: 2022, s: 9858, f: 142, fn: 1.35, cs: "SOL", p: 79, g: "PFP", w: 1.5, l: "The bear that carried Solana through the worst month of its history and made the whole chain feel viable again." },
  { n: "Solana Monkey Business", k: "solana-monkey-business", c: "Solana", y: 2021, s: 4993, f: 1532, fn: 14.67, cs: "SOL", p: 337.69, g: "PFP", w: 2.5, l: "SMB: the original Solana blue chip, minted in 2021 when the chain had almost nothing else worth owning." },
  { n: "Claynosaurz", k: "claynosaurz", c: "Solana", y: 2022, s: 10232, f: 1214, fn: 11.67, cs: "SOL", p: 97, g: "PFP", w: 4, l: "Claymation dinosaurs with real 3D animation, from a studio that had actually worked in film." },
  { n: "Famous Fox Federation", k: "famous-fox-federation", c: "Solana", y: 2021, s: 10000, f: 365, fn: 3.5, cs: "SOL", p: 83.98, g: "Utility", w: 2.5, l: "The foxes that quietly became Solana's utility layer — raffles, missions and tools everyone else used." },
  { n: "Bitcoin Puppets", k: "bitcoin-puppets", c: "Bitcoin", y: 2023, s: 10001, f: 662, fn: 0.0102, cs: "BTC", p: 9190000, g: "Meme", w: 2.5, l: "Deliberately crude puppet drawings inscribed on Bitcoin, run as an anti-project with no roadmap and open contempt for roadmaps." },
  { n: "NodeMonkes", k: "nodemonkes", c: "Bitcoin", y: 2023, s: 10000, f: 1498, fn: 0.0232, cs: "BTC", p: 13846000, g: "PFP", w: 4, l: "One of the first 10,000-piece collections inscribed on Bitcoin, and the one that proved Ordinals could hold a serious floor." },
  { n: "Runestone", k: "runestone", c: "Bitcoin", y: 2024, s: 112400, f: 90, fn: 0.0014, cs: "BTC", p: 676000, g: "Collectible", w: 2.5, l: "The largest airdrop in Bitcoin's history, dropped free to over 112,000 wallets and worth hundreds of dollars each within weeks." },
  { n: "Ordinal Maxi Biz (OMB)", k: "ordinal-maxi-biz-omb", c: "Bitcoin", y: 2023, s: 5243, f: 1131, fn: 0.0175, cs: "BTC", p: 15750000, g: "PFP", w: 2.5, l: "OMB: Bitcoin-native PFPs from the earliest days of Ordinals, and a founding piece of that culture." },
  { n: "Quantum Cats", k: "quantum-cats", c: "Bitcoin", y: 2024, s: 3333, f: 675, fn: 0.0104, cs: "BTC", p: 26400000, g: "Art", w: 2.5, l: "Taproot Wizards' cat collection, inscribed to advertise a Bitcoin opcode upgrade. Art as a lobbying campaign." },
  { n: "Bitcoin Frogs", k: "bitcoin-frogs", c: "Bitcoin", y: 2023, s: 10000, f: 259, fn: 0.004, cs: "BTC", p: 3365900, g: "Meme", w: 2.5, l: "Ten thousand frogs inscribed in 2023 that briefly made Bitcoin the highest-volume NFT chain in the world." },
  { n: "Bitcoin Punks", k: "bitcoin-punks", c: "Bitcoin", y: 2023, s: 10000, f: 203, fn: 0.0031, cs: "BTC", p: 1190900, g: "Derivative", w: 2.5, l: "The full 10,000 punks, re-inscribed onto Bitcoin by someone who simply decided they should be there." },
  { n: "Taproot Wizards", k: "taproot-wizards", c: "Bitcoin", y: 2023, s: 2106, f: 3038, fn: 0.047, cs: "BTC", p: 0.2378, g: "Art", w: 2.5, l: "Udi Wertheimer inscribed a 4MB hand-drawn wizard, filling an entire Bitcoin block, to make a point about what the chain was for." },
  { n: "Aavegotchi", k: "aavegotchi-official-polygon", c: "Polygon", y: 2020, s: 23040, f: 49, fn: 0.0198, cs: "ETH", p: 1, g: "Gaming", w: 2.5, l: "Ghosts backed by interest-bearing Aave deposits, so every one has a redeemable value underneath the art. DeFi and NFTs, actually fused." },
  { n: "y00ts", k: "y00ts", c: "Polygon", y: 2022, s: 12369, f: 750, fn: 0.3, cs: "ETH", p: 33.33, g: "PFP", w: 2.5, l: "The Polygon chapter: a collection that took a grant to move chains, then left again and returned the money." },
  { n: "Hypurr", k: "hypurr-hyperevm", c: "HyperEVM", y: 2025, s: 4600, f: 20163, fn: 245, cs: "HYPE", p: 1550, g: "PFP", w: 4, l: "HyperEVM's native cat, from the chain that grew out of the fastest-moving perps exchange in crypto." },
  { n: "StonkBrokers", k: "stonkbrokers-434284142", c: "Robinhood", y: 2026, s: 4444, f: 12408, fn: 4.95, cs: "ETH", p: 13.43, g: "PFP", w: 4, l: "The r/wallstreetbets aesthetic, finally issued on a chain built by the brokerage that hosted it." }
];
