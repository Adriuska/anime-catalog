const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Studio = require('../models/Studio');
const Anime = require('../models/Anime');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const studioSeed = [
  { name: 'Bones', country: 'Japan', foundedDate: '1998-10-01', isActive: true },
  { name: 'MAPPA', country: 'Japan', foundedDate: '2011-06-14', isActive: true },
  { name: 'Ufotable', country: 'Japan', foundedDate: '2000-10-01', isActive: true },
  { name: 'Wit Studio', country: 'Japan', foundedDate: '2012-06-01', isActive: true },
  { name: 'Kyoto Animation', country: 'Japan', foundedDate: '1981-07-12', isActive: true },
  { name: 'Madhouse', country: 'Japan', foundedDate: '1972-10-17', isActive: true },
];

const animeSeedFactory = (studioMap) => [
  {
    title: 'Fullmetal Alchemist Brotherhood',
    description: 'Two brothers seek the philosopher stone after a failed alchemy experiment.',
    posterUrl: 'https://via.placeholder.com/300x450?text=FMA+B',
    episodes: 64,
    releaseDate: '2009-04-05',
    isOngoing: false,
    rating: 9.2,
    genres: ['Action', 'Adventure', 'Fantasy'],
    studio: studioMap['bones'],
  },
  {
    title: 'Mob Psycho 100',
    description: 'A powerful esper teenager tries to live a normal life while controlling emotions.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Mob+Psycho+100',
    episodes: 37,
    releaseDate: '2016-07-12',
    isOngoing: false,
    rating: 8.7,
    genres: ['Action', 'Comedy', 'Supernatural'],
    studio: studioMap['bones'],
  },
  {
    title: 'Jujutsu Kaisen',
    description: 'A student consumes a cursed object and enters the world of sorcerers.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Jujutsu+Kaisen',
    episodes: 47,
    releaseDate: '2020-10-03',
    isOngoing: true,
    rating: 8.8,
    genres: ['Action', 'Dark Fantasy'],
    studio: studioMap['mappa'],
  },
  {
    title: 'Chainsaw Man',
    description: 'A debt-ridden boy merges with a devil dog and hunts devils for survival.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Chainsaw+Man',
    episodes: 12,
    releaseDate: '2022-10-12',
    isOngoing: true,
    rating: 8.4,
    genres: ['Action', 'Horror'],
    studio: studioMap['mappa'],
  },
  {
    title: 'Demon Slayer',
    description: 'A young swordsman joins a corps to cure his sister and fight demons.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Demon+Slayer',
    episodes: 55,
    releaseDate: '2019-04-06',
    isOngoing: true,
    rating: 8.6,
    genres: ['Action', 'Historical', 'Fantasy'],
    studio: studioMap['ufotable'],
  },
  {
    title: 'Fate Zero',
    description: 'Seven mages summon heroic spirits to fight in a deadly grail war.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Fate+Zero',
    episodes: 25,
    releaseDate: '2011-10-02',
    isOngoing: false,
    rating: 8.3,
    genres: ['Action', 'Supernatural'],
    studio: studioMap['ufotable'],
  },
  {
    title: 'Attack on Titan',
    description: 'Humanity fights giant creatures while uncovering dark truths about the world.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Attack+on+Titan',
    episodes: 89,
    releaseDate: '2013-04-07',
    isOngoing: false,
    rating: 9.0,
    genres: ['Action', 'Drama', 'Mystery'],
    studio: studioMap['wit studio'],
  },
  {
    title: 'Vinland Saga',
    description: 'A young warrior seeks revenge amid political turmoil and Viking warfare.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Vinland+Saga',
    episodes: 48,
    releaseDate: '2019-07-08',
    isOngoing: true,
    rating: 8.8,
    genres: ['Action', 'Historical', 'Drama'],
    studio: studioMap['wit studio'],
  },
  {
    title: 'Violet Evergarden',
    description: 'A former soldier learns to understand emotions by writing letters for others.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Violet+Evergarden',
    episodes: 13,
    releaseDate: '2018-01-11',
    isOngoing: false,
    rating: 8.7,
    genres: ['Drama', 'Slice of Life'],
    studio: studioMap['kyoto animation'],
  },
  {
    title: 'K On',
    description: 'High school girls form a light music club and grow through friendship.',
    posterUrl: 'https://via.placeholder.com/300x450?text=K+On',
    episodes: 39,
    releaseDate: '2009-04-03',
    isOngoing: false,
    rating: 7.9,
    genres: ['Comedy', 'Music', 'Slice of Life'],
    studio: studioMap['kyoto animation'],
  },
  {
    title: 'Death Note',
    description: 'A genius student gains a notebook that can kill anyone whose name is written.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Death+Note',
    episodes: 37,
    releaseDate: '2006-10-04',
    isOngoing: false,
    rating: 8.9,
    genres: ['Thriller', 'Mystery'],
    studio: studioMap['madhouse'],
  },
  {
    title: 'Hunter x Hunter 2011',
    description: 'A young boy takes the hunter exam to find his legendary father.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Hunter+x+Hunter',
    episodes: 148,
    releaseDate: '2011-10-02',
    isOngoing: false,
    rating: 9.1,
    genres: ['Adventure', 'Action', 'Fantasy'],
    studio: studioMap['madhouse'],
  },
  {
    title: 'My Hero Academia',
    description: 'A quirkless teen inherits heroic power and enters a top hero academy.',
    posterUrl: 'https://via.placeholder.com/300x450?text=My+Hero+Academia',
    episodes: 159,
    releaseDate: '2016-04-03',
    isOngoing: true,
    rating: 8.0,
    genres: ['Action', 'Superhero'],
    studio: studioMap['bones'],
  },
  {
    title: 'Noragami',
    description: 'A minor god takes odd jobs while trying to build his own shrine.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Noragami',
    episodes: 25,
    releaseDate: '2014-01-05',
    isOngoing: false,
    rating: 7.9,
    genres: ['Action', 'Comedy', 'Supernatural'],
    studio: studioMap['bones'],
  },
  {
    title: 'Dororo',
    description: 'A ronin and a child thief travel to reclaim stolen body parts from demons.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Dororo',
    episodes: 24,
    releaseDate: '2019-01-07',
    isOngoing: false,
    rating: 8.2,
    genres: ['Action', 'Adventure', 'Historical'],
    studio: studioMap['mappa'],
  },
  {
    title: 'Zankyou no Terror',
    description: 'Two enigmatic teens challenge Tokyo with cryptic terrorist attacks.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Zankyou+no+Terror',
    episodes: 11,
    releaseDate: '2014-07-11',
    isOngoing: false,
    rating: 7.8,
    genres: ['Psychological', 'Thriller'],
    studio: studioMap['mappa'],
  },
  {
    title: 'Hyouka',
    description: 'A quiet student solves everyday mysteries with classmates in a literature club.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Hyouka',
    episodes: 22,
    releaseDate: '2012-04-23',
    isOngoing: false,
    rating: 8.0,
    genres: ['Mystery', 'Slice of Life'],
    studio: studioMap['kyoto animation'],
  },
  {
    title: 'A Silent Voice',
    description: 'A former bully seeks redemption by reconnecting with a deaf classmate.',
    posterUrl: 'https://via.placeholder.com/300x450?text=A+Silent+Voice',
    episodes: 1,
    releaseDate: '2016-09-17',
    isOngoing: false,
    rating: 8.9,
    genres: ['Drama', 'Romance'],
    studio: studioMap['kyoto animation'],
  },
  {
    title: 'One Punch Man Season 1',
    description: 'A hero who defeats any enemy with one punch searches for a worthy fight.',
    posterUrl: 'https://via.placeholder.com/300x450?text=One+Punch+Man',
    episodes: 12,
    releaseDate: '2015-10-05',
    isOngoing: false,
    rating: 8.7,
    genres: ['Action', 'Comedy', 'Superhero'],
    studio: studioMap['madhouse'],
  },
  {
    title: 'Parasyte The Maxim',
    description: 'A teenager shares his body with an alien parasite and fights other invaders.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Parasyte',
    episodes: 24,
    releaseDate: '2014-10-09',
    isOngoing: false,
    rating: 8.3,
    genres: ['Sci-Fi', 'Horror', 'Action'],
    studio: studioMap['madhouse'],
  },
  {
    title: 'Kabaneri of the Iron Fortress',
    description: 'Survivors travel by armored train while battling undead monsters.',
    posterUrl: 'https://via.placeholder.com/300x450?text=Kabaneri',
    episodes: 12,
    releaseDate: '2016-04-08',
    isOngoing: false,
    rating: 7.2,
    genres: ['Action', 'Horror', 'Steampunk'],
    studio: studioMap['wit studio'],
  },
];

const seedData = async () => {
  try {
    await connectDB();

    await Anime.deleteMany({});
    await Studio.deleteMany({});

    const studios = await Studio.insertMany(studioSeed);
    const studioMap = studios.reduce((acc, item) => {
      acc[item.name.toLowerCase()] = item._id;
      return acc;
    }, {});

    const animes = animeSeedFactory(studioMap);
    await Anime.insertMany(animes);

    console.log(`Seed successful: ${studios.length} studios, ${animes.length} animes`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
