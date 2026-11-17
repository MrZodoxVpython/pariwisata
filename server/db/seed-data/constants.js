export const SITE = {
  name: 'Canyoning Bali',
  url: 'https://canyoningbali.com/',
  phone: '+62 812-3456-7890',
  email: 'hello@canyoningbali.com',
  currency: 'IDR',
};

export const PICKUP = [
  { id: 'ubud', label: 'Ubud — free pickup', fee: 0 },
  { id: 'sanur', label: 'Sanur — +IDR 100,000 / group', fee: 100000 },
  { id: 'canggu', label: 'Canggu / Seminyak / Kuta — +IDR 150,000 / group', fee: 150000 },
  { id: 'nusadua', label: 'Nusa Dua / Jimbaran — +IDR 200,000 / group', fee: 200000 },
  { id: 'own', label: 'I will make my own way to the basecamp', fee: 0 },
];

export const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export const getTour = (id, tours) => tours.find((t) => t.id === id) || null;
export const getPickup = (id) => PICKUP.find((p) => p.id === id) || PICKUP[0];