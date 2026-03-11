// Sleeping Gods Companion App - Game Data

const CHARACTERS = ['Mac', 'Rafael', 'Marco', 'Laurent', 'Kannan', 'Kasumi', 'Gregory', 'Audrie'];

const STATUS_TOKENS = ['Venom', 'Frightened', 'Madness', 'Weakened', 'Low Morale'];

const SHIP_ACTIONS = ['Bridge', 'Deck', 'Sick Bay', 'Galley', 'Quarters'];

const RESOURCE_TYPES = ['Coins', 'Artifacts', 'Meat', 'Vegetables', 'Grain', 'Materials'];

const PAGE_LOCATIONS = {
  2: ['7','30','186','18','216','34','130','2','174'],
  3: ['63','3','47','37','43','20','218','54'],
  4: ['36','98','126','16','25','72','46'],
  5: ['57','50','189','104','176','90','82','195','183'],
  6: ['108','39','8','88','116','110','52','123','101'],
  7: ['5','31','91','9','28','207','66','10'],
  8: ['51','4','32','15','141','217','111','19','171'],
  9: ['44','48','35','150','21','55','45','17'],
  10: ['11','26','209','62','73','79','96'],
  11: ['97','204','49','190','188','144','177','215','196'],
  12: ['70','41','103','87','68','92','76','115','12'],
  13: ['65','6','121','102','29','59','40','22'],
  14: ['180','132','114','107','77','69','78','60','58','42'],
  15: ['86','122','129','23','13','14'],
  16: ['137','128','106','85','113','24','158','146'],
  17: ['155','149','127','165','120','201','84','64'],
  18: ['192','156','166','172','151','181'],
  19: ['213','206','157','160','199'],
  22: ['R11','R20','R93','R5','R83'],
  23: ['R14','R16','R7','R54','R94','R64','R12'],
  24: ['R15','R26','R34','R21','R36','R30','R1','R19'],
  25: ['R66','R25','R2','R40','R87'],
  26: ['R17','R28','R24','R29','R37','R32','R39'],
  27: ['R27','R4','R33','R22','R60'],
  28: ['R50','R23','R6','R8','R38','R9','R98'],
  29: ['R31','R10','R18','R13','R35','R3'],
  30: ['R51','R61','R59','R99','R46','R72'],
  31: ['R67','R96','R42','R77','R81']
};

// Build reverse lookup: location -> page
const LOCATION_TO_PAGE = {};
for (const [page, locations] of Object.entries(PAGE_LOCATIONS)) {
  for (const loc of locations) {
    LOCATION_TO_PAGE[loc] = parseInt(page);
  }
}

const PRE_ASSIGNED_NAMES = {
  '130': 'Zikura Trading Post',
  '50': 'Blood Rock',
  '90': 'Eye of the Rock',
  '110': 'Crypts of Yvhal',
  '10': "Hunter's Haven",
  '150': 'Pig Ribs',
  '190': 'Alzarria',
  '188': 'Zoo',
  '177': 'South Gate',
  '215': 'Alley Markets',
  '196': 'Lower Docks',
  '70': 'Lukra City',
  '40': 'City of Ashes',
  '180': 'Porthaven',
  '60': 'Glance',
  '120': "Lynn's Grove",
  '160': 'Aurora Township',
  'R20': "Scholars' Camp",
  'R30': 'Zokmere',
  'R40': "Torza's Apothecary",
  'R60': 'Thram Outpost',
  'R50': "Mulnic's Grotto",
  'R10': 'Spiderweb',
  'R59': 'Isle of Souls'
};

function getDefaultGameState() {
  return {
    players: [],
    characters: {},
    experience: 0,
    shipLocation: '2',
    lastShipAction: '',
    shipDamage: [0, 0, 0, 0, 0, 0],
    resources: {
      Coins: 0,
      Artifacts: 0,
      Meat: 0,
      Vegetables: 0,
      Grain: 0,
      Materials: 0
    },
    locationsVisited: [{
      number: '2',
      name: '',
      keywords: []
    }],
    acquiredKeywords: [],
    quests: [],
    totems: [],
    sessionCount: 1
  };
}

function getDefaultCharacterState(name) {
  return {
    name: name,
    cardSlots: [],
    upgrades: [],
    damage: 0,
    fatigue: 0,
    weapons: [],
    statusTokens: {
      'Venom': false,
      'Frightened': false,
      'Madness': false,
      'Weakened': false,
      'Low Morale': false
    }
  };
}
