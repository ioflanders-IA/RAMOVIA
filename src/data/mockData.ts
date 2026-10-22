import { Client, InventoryItem, Job, User, WorkReport } from '../types';

// Fallback high-resolution SVG photos as data URIs for pristine display
export const SAMPLE_GARDEN_PHOTOS = {
  before1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="%233b473b"/>
    <rect y="180" width="600" height="220" fill="%2348573b"/>
    <!-- Overgrown tall weeds and bush -->
    <path d="M 0 320 Q 50 180 120 280 T 240 240 T 360 290 T 480 230 T 600 310 L 600 400 L 0 400 Z" fill="%232b3624"/>
    <path d="M 30 250 Q 80 140 140 230 Q 200 120 280 220 Q 340 110 420 230 Q 510 130 580 260" stroke="%231b2615" stroke-width="12" fill="none" stroke-linecap="round"/>
    <circle cx="180" cy="190" r="45" fill="%23324029" opacity="0.9"/>
    <circle cx="340" cy="180" r="60" fill="%2324311d" opacity="0.9"/>
    <circle cx="460" cy="210" r="50" fill="%2335442b" opacity="0.9"/>
    <!-- Fallen branches and leaves -->
    <line x1="80" y1="360" x2="210" y2="340" stroke="%234a3525" stroke-width="8" stroke-linecap="round"/>
    <line x1="280" y1="375" x2="430" y2="350" stroke="%233e2b1d" stroke-width="7" stroke-linecap="round"/>
    <!-- Stamp: PRIMA DELL'INTERVENTO -->
    <rect x="20" y="20" width="240" height="40" rx="8" fill="%23b91c1c" fill-opacity="0.9"/>
    <text x="140" y="46" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">PRIMA DELL'INTERVENTO</text>
  </svg>`,
  
  after1: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="%23e0f2fe"/>
    <rect y="170" width="600" height="230" fill="%2316a34a"/>
    <!-- Pristine stripes lawn -->
    <path d="M 0 250 L 600 250 L 600 400 L 0 400 Z" fill="%2315803d"/>
    <path d="M 0 290 L 600 290 L 600 400 L 0 400 Z" fill="%23166534"/>
    <path d="M 0 340 L 600 340 L 600 400 L 0 400 Z" fill="%2314532d"/>
    <!-- Manicured geometric boxwood hedge -->
    <rect x="40" y="140" width="520" height="100" rx="16" fill="%2322c55e" stroke="%2315803d" stroke-width="4"/>
    <circle cx="120" cy="140" r="35" fill="%2316a34a"/>
    <circle cx="280" cy="135" r="40" fill="%2315803d"/>
    <circle cx="440" cy="140" r="36" fill="%2316a34a"/>
    <!-- Clean garden path -->
    <polygon points="260,400 340,400 310,240 290,240" fill="%23e2e8f0" stroke="%23cbd5e1" stroke-width="2"/>
    <!-- Stamp: DOPO L'INTERVENTO -->
    <rect x="20" y="20" width="230" height="40" rx="8" fill="%2315803d" fill-opacity="0.9"/>
    <text x="135" y="46" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">DOPO L'INTERVENTO</text>
  </svg>`,

  before2: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="%23475569"/>
    <rect y="160" width="600" height="240" fill="%2352525b"/>
    <!-- Dead tree branch -->
    <path d="M 300 380 L 300 200 L 220 120 M 300 220 L 390 140 M 300 170 L 330 90" stroke="%233f2e21" stroke-width="16" fill="none" stroke-linecap="round"/>
    <rect x="20" y="20" width="240" height="40" rx="8" fill="%23b91c1c" fill-opacity="0.9"/>
    <text x="140" y="46" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">PRIMA - RAMI PERICOLANTI</text>
  </svg>`,

  after2: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="%23bae6fd"/>
    <rect y="200" width="600" height="200" fill="%2322c55e"/>
    <!-- Healthy pruned tree -->
    <path d="M 300 400 L 300 240" stroke="%23543d2b" stroke-width="20" stroke-linecap="round"/>
    <circle cx="300" cy="180" r="70" fill="%2315803d"/>
    <circle cx="260" cy="170" r="50" fill="%2316a34a"/>
    <circle cx="340" cy="175" r="55" fill="%23166534"/>
    <rect x="20" y="20" width="230" height="40" rx="8" fill="%2315803d" fill-opacity="0.9"/>
    <text x="135" y="46" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">DOPO - POTATURA E PULIZIA</text>
  </svg>`
};

export const INITIAL_USERS: User[] = [
  {
    uid: 'user_admin_1',
    email: 'andrea.blasi@ramovia.it',
    displayName: 'Andrea Blasi (Titolare)',
    role: 'admin',
    phone: '+39 347 123 4567',
    active: true,
    hourlyCost: 45.0,
    hourlyBillableRate: 65.0
  },
  {
    uid: 'user_worker_1',
    email: 'matteo.bianchi@ramovia.it',
    displayName: 'Matteo Bianchi',
    role: 'worker',
    phone: '+39 339 987 6543',
    active: true,
    hourlyCost: 24.5,
    hourlyBillableRate: 42.0
  },
  {
    uid: 'user_worker_2',
    email: 'luca.rossi@ramovia.it',
    displayName: 'Luca Rossi',
    role: 'worker',
    phone: '+39 338 555 4321',
    active: true,
    hourlyCost: 22.0,
    hourlyBillableRate: 40.0
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Villa Visconti',
    phone: '+39 039 990 1245',
    email: 'amministrazione@villavisconti.it',
    address: 'Via Garibaldi 18, Merate (LC)',
    lat: 45.6983,
    lng: 9.4214,
    createdAt: '2025-01-15',
    hourlyPriceCharged: 45.0,
    gardenNotes: {
      squareMeters: 1250,
      irrigationDetails: 'Impianto a scomparsa Hunter 6 zone con centralina Rain Bird WiFi nel sottoscala garage.',
      delicatePlants: 'Siepe perimetrale di lauroceraso, 3 cycas revoluta pregiate sul fronte est, aiuola di azalee e ortensie idrofile.',
      gateCode: '#4582 (poi citofonare se il cancello non risponde)',
      dogPresent: true,
      notes: 'Pastore tedesco maschio (Rex): il custode lo chiude nel box prima del nostro arrivo alle 08:30.'
    }
  },
  {
    id: 'cli_2',
    name: 'Residenza Parco Villa d\'Adda',
    phone: '+39 039 617 889',
    email: 'info@residenzaparco.it',
    address: 'Viale Brianza 44, Arcore (MB)',
    lat: 45.6267,
    lng: 9.3242,
    createdAt: '2025-02-10',
    hourlyPriceCharged: 42.0,
    gardenNotes: {
      squareMeters: 450,
      irrigationDetails: 'Impianto a goccia microforato su aiuole perimetrali e 2 irrigatori statici su prato centrale.',
      delicatePlants: 'Acero giapponese palmato secolare nel patio interno (attenzione durante lo sfalcio a non toccare il tronco).',
      gateCode: 'Citofonare int. 12 (Sig.ra Carla), apre cancello carraio.',
      dogPresent: false,
      notes: 'Acqua per rifornimento disponibile dal rubinetto in ottone a fianco della casetta attrezzi.'
    }
  },
  {
    id: 'cli_3',
    name: 'Tenuta Il Bosco Antico',
    phone: '+39 039 230 4567',
    email: 'proprieta@ilboscoantico.com',
    address: 'Via Cavriga 12, Monza (MB)',
    lat: 45.5985,
    lng: 9.2891,
    createdAt: '2025-03-01',
    hourlyPriceCharged: 48.0,
    gardenNotes: {
      squareMeters: 2800,
      irrigationDetails: 'Alimentazione da pozzo artesiano dedicato. Pressione 3.8 bar, 8 zone a turbina Hunter PGP.',
      delicatePlants: 'Ampio prato a rotoli festuca arundinacea posato nel 2024. Bordo siepe di carpino bianco.',
      gateCode: 'Sbarra automatica codice 9912.',
      dogPresent: true,
      notes: 'Due boxer molto giocherelloni. Avvisare il proprietario 15 minuti prima per consentire il ricovero.'
    }
  },
  {
    id: 'cli_4',
    name: 'Condominio Le Betulle',
    phone: '+39 039 608 1122',
    email: 'studio.gestioni@amministrazionibrianza.it',
    address: 'Via Torri Bianche 6, Vimercate (MB)',
    lat: 45.6083,
    lng: 9.3621,
    createdAt: '2025-03-15',
    hourlyPriceCharged: 40.0,
    gardenNotes: {
      squareMeters: 850,
      irrigationDetails: 'Impianto automatico Toro centralizzato condominiale. Non toccare il pozzetto di mandata.',
      delicatePlants: 'Boschetto di betulle argentee, cespugli di rose inglesi e camelie invernali.',
      gateCode: 'Chiave cassetta grigia a destra del passo carrabile, combinazione 1984.',
      dogPresent: false,
      notes: 'Smaltire tutti gli sfalci nel cassone verde posizionato all\'angolo del parcheggio interrato.'
    }
  },
  {
    id: 'cli_5',
    name: 'Villa Bellavista',
    phone: '+39 0362 901 888',
    email: 'bellavista.brianza@gmail.com',
    address: 'Via Privata delle Ginestre 3, Carate Brianza (MB)',
    lat: 45.6742,
    lng: 9.2411,
    createdAt: '2025-04-02',
    hourlyPriceCharged: 46.0,
    gardenNotes: {
      squareMeters: 1600,
      irrigationDetails: 'Nebulizzazione perimetrale e 4 settori indipendenti Claber.',
      delicatePlants: 'Collezione di ulivi centenari toscani e siepe di gelsomino rincospermo.',
      gateCode: 'Telecomando custodito nella colonnina di ricarica auto (codice pin: 7731).',
      dogPresent: true,
      notes: 'Cane di piccola taglia (chihuahua) che corre in giardino. Fare massima attenzione alla chiusura cancelli.'
    }
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  // ATTREZZATURE (Equipment)
  {
    id: 'inv_eq_1',
    name: 'Tosaerba semovente Honda HRX 537 VK',
    category: 'equipment',
    quantity: 2,
    unit: 'pz',
    minThreshold: 1,
    assignedToWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    brand: 'Honda Power Equipment',
    maintenanceIntervalHours: 50,
    currentUsageHours: 44, // In scadenza manutenzione!
    status: 'available',
    lastMaintenanceDate: '2025-08-10',
    unitCost: 1150
  },
  {
    id: 'inv_eq_2',
    name: 'Trattorino tagliaerba John Deere X147R',
    category: 'equipment',
    quantity: 1,
    unit: 'pz',
    minThreshold: 1,
    assignedToWorkerId: 'user_worker_2',
    assignedWorkerName: 'Luca Rossi',
    brand: 'John Deere',
    maintenanceIntervalHours: 100,
    currentUsageHours: 104, // OLTRE SOGLIA: MANUTENZIONE SCADUTA!
    status: 'maintenance',
    lastMaintenanceDate: '2025-05-18',
    unitCost: 4800
  },
  {
    id: 'inv_eq_3',
    name: 'Decespugliatore professionale Stihl FS 460 C-EM',
    category: 'equipment',
    quantity: 3,
    unit: 'pz',
    minThreshold: 2,
    assignedToWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    brand: 'STIHL',
    maintenanceIntervalHours: 40,
    currentUsageHours: 18,
    status: 'available',
    lastMaintenanceDate: '2025-09-01',
    unitCost: 890
  },
  {
    id: 'inv_eq_4',
    name: 'Motosega da potatura Stihl MS 194 T',
    category: 'equipment',
    quantity: 2,
    unit: 'pz',
    minThreshold: 1,
    assignedToWorkerId: null,
    brand: 'STIHL',
    maintenanceIntervalHours: 50,
    currentUsageHours: 32,
    status: 'available',
    lastMaintenanceDate: '2025-08-20',
    unitCost: 520
  },
  {
    id: 'inv_eq_5',
    name: 'Tagliasiepi telescopico a batteria Husqvarna 520iHE3',
    category: 'equipment',
    quantity: 2,
    unit: 'pz',
    minThreshold: 1,
    assignedToWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    brand: 'Husqvarna',
    maintenanceIntervalHours: 40,
    currentUsageHours: 12,
    status: 'available',
    lastMaintenanceDate: '2025-09-15',
    unitCost: 650
  },
  {
    id: 'inv_eq_6',
    name: 'Biotrituratore Cippatore Pezzolato professionale',
    category: 'equipment',
    quantity: 1,
    unit: 'pz',
    minThreshold: 1,
    assignedToWorkerId: null,
    brand: 'Pezzolato',
    maintenanceIntervalHours: 100,
    currentUsageHours: 85,
    status: 'available',
    lastMaintenanceDate: '2025-07-11',
    unitCost: 5600
  },

  // MATERIALI & CONSUMABILI (Materials)
  {
    id: 'inv_mat_1',
    name: 'Concime NPK Gold Prato a lenta cessione (25 kg)',
    category: 'material',
    quantity: 6, // Soglia min 10 -> SOTTO SCORTA!
    unit: 'sacchi',
    minThreshold: 10,
    assignedToWorkerId: null,
    brand: 'Compo Expert',
    status: 'available',
    unitCost: 38.5
  },
  {
    id: 'inv_mat_2',
    name: 'Miscela alchilata 2T per motori a due tempi',
    category: 'material',
    quantity: 35,
    unit: 'lt',
    minThreshold: 20,
    assignedToWorkerId: null,
    brand: 'Aspen 2',
    status: 'available',
    unitCost: 4.8
  },
  {
    id: 'inv_mat_3',
    name: 'Filo professionale per decespugliatore 3.5mm elicoidale',
    category: 'material',
    quantity: 14,
    unit: 'pz',
    minThreshold: 5,
    assignedToWorkerId: null,
    brand: 'Oregon Duoline',
    status: 'available',
    unitCost: 19.0
  },
  {
    id: 'inv_mat_4',
    name: 'Terriccio professionale per tappeti erbosi e rigenerazione',
    category: 'material',
    quantity: 4, // Soglia min 15 -> SOTTO SCORTA CRITICA!
    unit: 'sacchi',
    minThreshold: 15,
    assignedToWorkerId: null,
    brand: 'Vigorplant',
    status: 'available',
    unitCost: 9.5
  },
  {
    id: 'inv_mat_5',
    name: 'Seme rigenerante prato calpestabile Festuca/Poa',
    category: 'material',
    quantity: 12, // Soglia min 20 -> SOTTO SCORTA!
    unit: 'kg',
    minThreshold: 20,
    assignedToWorkerId: null,
    brand: 'Bottos Maciste',
    status: 'available',
    unitCost: 14.2
  },
  {
    id: 'inv_mat_6',
    name: 'Trattamento antiparassitario fungicida biologico rameico',
    category: 'material',
    quantity: 8,
    unit: 'lt',
    minThreshold: 5,
    assignedToWorkerId: null,
    brand: 'Bayer Garden',
    status: 'available',
    unitCost: 22.0
  },
  {
    id: 'inv_mat_7',
    name: 'Telo pacciamatura biodegradabile 1.6 x 50m',
    category: 'material',
    quantity: 4,
    unit: 'rotoli',
    minThreshold: 2,
    assignedToWorkerId: null,
    brand: 'Novamont',
    status: 'available',
    unitCost: 45.0
  }
];

// Today's date ISO helper (always adapts to current date context)
const todayDate = new Date().toISOString().split('T')[0];

// Yesterday and tomorrow helpers
const yesterdayObj = new Date();
yesterdayObj.setDate(yesterdayObj.getDate() - 1);
const yesterdayDate = yesterdayObj.toISOString().split('T')[0];

const tomorrowObj = new Date();
tomorrowObj.setDate(tomorrowObj.getDate() + 1);
const tomorrowDate = tomorrowObj.toISOString().split('T')[0];

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job_today_1',
    clientId: 'cli_1',
    clientName: 'Villa Visconti',
    clientAddress: 'Via Garibaldi 18, Merate (LC)',
    clientPhone: '+39 039 990 1245',
    assignedWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    date: todayDate,
    timeSlot: '08:00 - 12:30',
    status: 'scheduled',
    title: 'Potatura siepe lauroceraso e arieggiatura prato',
    description: 'Taglio e squadratura siepe perimetrale con tagliasiepi telescopico, raccolta ramaglie, arieggiatura prato fronte villa e concimazione rigenerante.',
    notes: 'Attenzione alle cycas sul lato est. Chiudere il cancello pedonale durante le operazioni.',
    materialsRequired: [
      { itemId: 'inv_mat_1', name: 'Concime NPK Gold Prato a lenta cessione', qtyNeeded: 3, unit: 'sacchi' },
      { itemId: 'inv_mat_5', name: 'Seme rigenerante prato calpestabile Festuca/Poa', qtyNeeded: 5, unit: 'kg' },
      { itemId: 'inv_mat_2', name: 'Miscela alchilata 2T per motori a due tempi', qtyNeeded: 5, unit: 'lt' }
    ],
    lat: 45.6983,
    lng: 9.4214,
    estimatedHours: 4.5,
    agreedPrice: 280.0
  },
  {
    id: 'job_today_2',
    clientId: 'cli_2',
    clientName: 'Residenza Parco Villa d\'Adda',
    clientAddress: 'Viale Brianza 44, Arcore (MB)',
    clientPhone: '+39 039 617 889',
    assignedWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    date: todayDate,
    timeSlot: '14:00 - 17:30',
    status: 'scheduled',
    title: 'Trattamento antiparassitario e sagomatura acero',
    description: 'Controllo afidi e trattamento rameico bio su rose, pulizia secco interno acero giapponese e diserbo manuale aiuole.',
    notes: 'Suonare int. 12 per accesso rubinetto.',
    materialsRequired: [
      { itemId: 'inv_mat_6', name: 'Trattamento antiparassitario fungicida biologico', qtyNeeded: 2, unit: 'lt' },
      { itemId: 'inv_mat_4', name: 'Terriccio professionale per tappeti erbosi', qtyNeeded: 2, unit: 'sacchi' }
    ],
    lat: 45.6267,
    lng: 9.3242,
    estimatedHours: 3.5,
    agreedPrice: 195.0
  },
  {
    id: 'job_today_3',
    clientId: 'cli_3',
    clientName: 'Tenuta Il Bosco Antico',
    clientAddress: 'Via Cavriga 12, Monza (MB)',
    clientPhone: '+39 039 230 4567',
    assignedWorkerId: 'user_worker_2',
    assignedWorkerName: 'Luca Rossi',
    date: todayDate,
    timeSlot: '08:30 - 15:30',
    status: 'in_progress',
    title: 'Sfalcio erba con tosaerba e decespugliatura bordi',
    description: 'Taglio completo 2800 mq, rifinitura bordi lungo la recinzione e muretti a secco, soffiaggio vialetti e controllo ugelli irrigazione.',
    notes: 'Avvisato il proprietario dei cani, sono nel recinto. Non forzare il passaggio con il carrello vicino al porticato.',
    materialsRequired: [
      { itemId: 'inv_mat_3', name: 'Filo professionale per decespugliatore 3.5mm', qtyNeeded: 2, unit: 'pz' },
      { itemId: 'inv_mat_2', name: 'Miscela alchilata 2T per motori a due tempi', qtyNeeded: 8, unit: 'lt' }
    ],
    lat: 45.5985,
    lng: 9.2891,
    estimatedHours: 6.0,
    agreedPrice: 360.0
  },
  {
    id: 'job_tomorrow_1',
    clientId: 'cli_5',
    clientName: 'Villa Bellavista',
    clientAddress: 'Via Privata delle Ginestre 3, Carate Brianza (MB)',
    clientPhone: '+39 0362 901 888',
    assignedWorkerId: 'user_worker_1',
    assignedWorkerName: 'Matteo Bianchi',
    date: tomorrowDate,
    timeSlot: '09:00 - 13:00',
    status: 'scheduled',
    title: 'Potatura di rimonda ulivi e concimazione organica',
    description: 'Sfoltimento rami succhioni sui 12 ulivi, eliminazione rami secchi e distribuzione stallatico pellettato.',
    notes: 'Controllare telecomando nella colonnina.',
    materialsRequired: [
      { itemId: 'inv_mat_1', name: 'Concime NPK Gold Prato a lenta cessione', qtyNeeded: 2, unit: 'sacchi' },
      { itemId: 'inv_mat_2', name: 'Miscela alchilata 2T per motori a due tempi', qtyNeeded: 3, unit: 'lt' }
    ],
    lat: 45.6742,
    lng: 9.2411,
    estimatedHours: 4.0,
    agreedPrice: 250.0
  },
  {
    id: 'job_completed_1',
    clientId: 'cli_4',
    clientName: 'Condominio Le Betulle',
    clientAddress: 'Via Torri Bianche 6, Vimercate (MB)',
    clientPhone: '+39 039 608 1122',
    assignedWorkerId: 'user_worker_2',
    assignedWorkerName: 'Luca Rossi',
    date: yesterdayDate,
    timeSlot: '08:30 - 14:00',
    status: 'completed',
    title: 'Abbattimento controllato pino secco e cippatura',
    description: 'Taglio in quota a pezzi del pino marittimo deperito, cippatura rami in loco e pulizia completa piazzale.',
    notes: 'Lavoro concluso e verificato con il caposcala.',
    materialsRequired: [
      { itemId: 'inv_mat_2', name: 'Miscela alchilata 2T per motori a due tempi', qtyNeeded: 6, unit: 'lt' }
    ],
    lat: 45.6083,
    lng: 9.3621,
    estimatedHours: 5.5,
    agreedPrice: 480.0
  }
];

export const INITIAL_REPORTS: WorkReport[] = [
  {
    id: 'rep_yesterday_1',
    jobId: 'job_completed_1',
    jobTitle: 'Abbattimento controllato pino secco e cippatura',
    clientId: 'cli_4',
    clientName: 'Condominio Le Betulle',
    clientAddress: 'Via Torri Bianche 6, Vimercate (MB)',
    workerId: 'user_worker_2',
    workerName: 'Luca Rossi',
    date: yesterdayDate,
    startTime: '08:30',
    endTime: '14:00',
    totalHours: 5.5,
    trackingType: 'timer',
    photosBefore: [SAMPLE_GARDEN_PHOTOS.before2],
    photosAfter: [SAMPLE_GARDEN_PHOTOS.after2],
    materialsUsed: [
      { itemId: 'inv_mat_2', name: 'Miscela alchilata 2T per motori a due tempi', qty: 6, unit: 'lt' }
    ],
    signatureDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100"><path d="M 20 60 Q 60 20 90 70 T 140 30 T 210 80 T 270 40" fill="none" stroke="%231e293b" stroke-width="3" stroke-linecap="round"/></svg>',
    clientSigneeName: 'Ing. Marco Fumagalli (Amministratore)',
    clientNotes: 'Intervento perfetto, l\'area è stata ripulita impeccabilmente.',
    adminNotes: 'Fattura proforma n. 28/2025 pronta per emissione.',
    status: 'approved',
    createdAt: `${yesterdayDate}T14:15:00Z`
  }
];
