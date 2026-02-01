export const categories = [
  {
    id: 'futlyary',
    name: 'Футляры',
    items: [
      { id: 'f-braslet', name: 'Футляры для браслетов', count: 8 },
      { id: 'f-kolec', name: 'Футляры для колец', count: 22 },
      { id: 'f-kolee', name: 'Футляры для колье и цепочек', count: 20 },
      { id: 'f-nabor', name: 'Футляры для наборов', count: 48 },
      { id: 'f-chasy', name: 'Футляры для часов', count: 12 },
    ],
  },
  {
    id: 'podstavki',
    name: 'Подставки',
    items: [
      { id: 'p-braslet', name: 'Подставки для браслет', count: 10 },
      { id: 'p-kolco', name: 'Подставки для колец', count: 6 },
      { id: 'p-kulon', name: 'Подставки для кулон', count: 1 },
      { id: 'p-nabor', name: 'Подставки для наборов', count: 7 },
      { id: 'p-cep', name: 'Подставки для цепей', count: 7 },
      { id: 'p-sergi', name: 'Подставки для серёг', count: 13 },
      { id: 'p-planchet', name: 'Планшет для браслет', count: 4 },
      { id: 'p-planchet-kolco', name: 'Планшет для кольца', count: 7 },
    ],
  },
]

export const products = [
  { id: 1, title: '9×9 кожный для браслет', size: '9×9см', price: 650, pack: 12, box: 270, minOrder: 12, packOnly: true, cat: 'f-braslet' },
  { id: 2, title: 'Атлас 12×12×10', size: '12×12×10cm', price: 650, cat: 'f-nabor' },
  { id: 3, title: 'Атлас 12×16', size: '12×16cm', price: 750, cat: 'f-nabor' },
  { id: 4, title: 'Атлас 20×20', size: '20×20cm', price: 1500, cat: 'f-nabor' },
  { id: 5, title: 'Атлас 5×22', size: '5×22cm', price: 500, cat: 'f-kolee' },
  { id: 6, title: 'Атлас 5×8', size: '12×12см для ремня', price: 700, cat: 'f-chasy' },
  { id: 7, title: 'Атлас 9×9×5', size: '9×9×5cm', price: 450, cat: 'f-kolec' },
  { id: 8, title: 'Атлас 7×9', size: '7×9cm', price: 350, cat: 'f-kolec' },
  { id: 9, title: 'Бархат браслет кольцо', size: '9×9см', price: 500, pack: 40, box: 300, cat: 'p-braslet' },
  { id: 10, title: 'Бархат кольцо', size: '5×5см', price: 250, pack: 12, box: 720, cat: 'p-kolco' },
  { id: 11, title: 'Бархат кольцо 6×6', size: '6×6см', price: 270, pack: 12, box: 720, minOrder: 12, packOnly: true, cat: 'p-kolco' },
  { id: 12, title: 'Бархат набор 7×7', size: '7×7см', price: 350, pack: 12, box: 684, minOrder: 12, packOnly: true, cat: 'p-nabor' },
  { id: 13, title: 'Бархат набор 7×9', size: '7×9см', price: 400, pack: 12, box: 500, minOrder: 12, packOnly: true, cat: 'p-nabor' },
  { id: 14, title: 'Бархат цеп 3×21', size: '3×21см', price: 450, pack: 24, box: 240, cat: 'p-cep' },
  { id: 15, title: 'Бархат цеп 5×22', size: '5.5×23см', price: 500, pack: 6, box: 300, minOrder: 6, packOnly: true, cat: 'p-cep' },
  { id: 16, title: 'Бумажный для браслет круглый', size: 'круглый 8см', price: 150, pack: 6, box: 732, minOrder: 6, packOnly: true, cat: 'f-braslet' },
  { id: 17, title: 'Бумажный для кольца', size: '5×5см', price: 75, pack: 24, box: 960, minOrder: 24, packOnly: true, cat: 'f-kolec' },
  { id: 18, title: 'Бумажный для набора 12×16', size: '12×16см', price: 270, pack: 6, box: 336, minOrder: 6, packOnly: true, cat: 'f-nabor' },
]
