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

const inferSeasonFromReleaseDate = (releaseDate) => {
  const month = new Date(releaseDate).getUTCMonth() + 1;
  if (month === 12 || month <= 2) return 'Invierno';
  if (month >= 3 && month <= 5) return 'Primavera';
  if (month >= 6 && month <= 8) return 'Verano';
  return 'Otoño';
};

const animeSeedFactory = (studioMap) => [
  {
    title: 'Fullmetal Alchemist Brotherhood',
    description: 'Two brothers seek the philosopher stone after a failed alchemy experiment.',
    posterUrl: 'https://i0.wp.com/www.tomosygrapas.com/wp-content/uploads/2016/11/full-metal-alchemist-portada.jpg',
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
    posterUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4b/Mob_Psycho_100_manga_vol_1.jpg',
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
    posterUrl: 'https://i0.wp.com/codigoespagueti.com/wp-content/uploads/2023/07/jujutsu-kaisen-ranking-personajes-populares.jpg?fit=1280%2C720&amp;ssl=1',
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
    posterUrl: 'https://i.blogs.es/e68563/chainsaw-man-the-1920x1200-23852-1-/1200_900.jpeg',
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
    posterUrl: 'https://a.storyblok.com/f/178900/960x540/6e6bcda041/demon-slayer.jpg/m/filters:quality(95)format(webp)',
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
    posterUrl: 'https://yukharyan.com/wp-content/uploads/2025/09/fate-zero-arte-portada.jpg',
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
    posterUrl: 'https://images.immediate.co.uk/production/volatile/sites/3/2023/11/attack-on-titan-watch-order-664c3eb.jpg',
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
    posterUrl: 'https://i.blogs.es/98a48a/vinland-saga/840_560.jpeg',
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
    posterUrl: 'https://i.blogs.es/6eb146/violet-evergarden/840_560.jpeg',
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
    posterUrl: 'https://preview.redd.it/anyone-else-still-waiting-for-k-on-s3-v0-01gkxp45amsa1.jpg?width=1080&crop=smart&auto=webp&s=09931f196eb4d84509f8af8e3732e78ca088a5ca',
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
    posterUrl: 'https://m.media-amazon.com/images/S/pv-target-images/2fac05d582494e996087fbc93b4137e8413f81c8891f5d38a58e46d36cd84966.jpg',
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
    posterUrl: 'https://personalanimesreview.wordpress.com/wp-content/uploads/2015/08/tumblr_ncdzo25rea1ql69jzo1_1280.jpg?w=940',
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
    posterUrl: 'https://www.ifema.es/img/xl/hero-academia-personajes/my-hero-academia-characters.jpg',
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
    posterUrl: 'https://m.media-amazon.com/images/S/pv-target-images/4da5194952dc299db21257bdf05cd02654e64a97f797e7a7e57ac7f26402aee7.jpg',
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
    posterUrl: 'https://hanamidangos.blog/wp-content/uploads/2020/05/Dororo-Hanami-Dango-Portada-scaled.jpg',
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
    posterUrl: 'https://i0.wp.com/rincondeanimes.wordpress.com/wp-content/uploads/2014/12/zankyou-no-terror-extended-06.jpg?fit=1200%2C675&ssl=1',
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
    posterUrl: 'https://cdn.somoskudasai.com/image/5c41630681a280f088467dee3e072b89/1200x800/kv_pc.png',
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
    posterUrl: 'https://takanodan.net/assets/images/posts/14-knk/cover.jpg',
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
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BZTViNGQzZWUtMzM4NS00ZTE0LWE0MDMtNjQ0YjNjNWQzZTA2XkEyXkFqcGc@._V1_.jpg',
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
    posterUrl: 'https://poggers.com/cdn/shop/articles/c4dfc400bdcab72cab8bc0f22fe2c174_1278x719_crop_center.webp?v=1708120925',
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
    posterUrl: 'https://miro.medium.com/v2/resize:fit:800/0*b4_r3s8QG_s-AKSd.jpg',
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

    const animes = animeSeedFactory(studioMap).map((anime) => ({
      ...anime,
      season: anime.season || inferSeasonFromReleaseDate(anime.releaseDate),
    }));
    await Anime.insertMany(animes);

    console.log(`Seed successful: ${studios.length} studios, ${animes.length} animes`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();