export const translations = {
  search: 'Shakisha',
  searchPlaceholder: 'Shakisha imodoka, spare parts...',
  allCategories: 'Ibyiciro byose',
  login: 'Injira',
  register: 'Iyandikishe',
  logout: 'Sohoka',
  
  categories: {
    vehicles: 'Imodoka',
    electronics: 'Elegitoronike',
    realEstate: 'Amazu',
    furniture: 'Ibikoresho',
    clothing: 'Imyenda',
    construction: 'Kubaka',
    spareParts: 'Ibice',
    machinery: 'Imashini',
    tools: 'Ibikoresho',
    sports: 'Siporo',
    books: 'Ibitabo',
    beauty: 'Ubwiza',
    jewelry: 'Imitako',
    toys: 'Ibikinisho',
    garden: 'Ubusitani',
    pets: 'Amatungo',
    music: 'Umuziki',
    office: 'Ibiro',
    health: 'Ubuzima',
    baby: 'Uruhinja',
    food: 'Ibiryo',
    art: 'Ubuhanzi',
    photography: 'Gufotora',
    gaming: 'Imikino',
    appliances: 'Ibikoresho'
  },
  
  rent: 'Kodesha',
  buy: 'Gura',
  sell: 'Gurisha',
  addProduct: 'Tanga ikintu',
  viewDetails: 'Reba ibisobanuro',
  
  price: 'Igiciro',
  perDay: 'Ku munsi',
  deposit: 'Ingwate',
  condition: 'Imiterere',
  location: 'Aho biherereye',
  description: 'Ibisobanuro',
  features: 'Ibimenyetso',
  reviews: 'Ibitekerezo',
  
  conditions: {
    new: 'Gishya',
    likeNew: 'Nk\'igishya',
    good: 'Nziza',
    fair: 'Isanzwe'
  },
  
  bookNow: 'Kodesha ubu',
  buyNow: 'Gura ubu',
  
  admin: {
    dashboard: 'Dashboard',
    users: 'Abakoresha',
    products: 'Ibicuruzwa',
    categories: 'Ibyiciro',
    approve: 'Emeza',
    reject: 'Anga',
    delete: 'Siba',
    edit: 'Hindura'
  }
};

export const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
    if (!value) return key;
  }
  return value || key;
};
