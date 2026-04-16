/**
 * seed-more.ts — adds an extra batch of demo data on top of seed.ts + seed-demo.ts.
 *
 * Idempotency: keyed off a sentinel customer ("Tan Boon Hock"). If found, the
 * script exits without changes — safe to run twice.
 *
 * Run: npx tsx prisma/seed-more.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const D = (n: number | string) => new Prisma.Decimal(n)
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)

async function main() {
  console.log('Seed-more: starting...')

  const sentinel = await prisma.customer.findFirst({ where: { name: 'Tan Boon Hock' } })
  if (sentinel) {
    console.log('Sentinel found — seed-more already applied. Skipping.')
    return
  }

  const branch = await prisma.branch.findFirstOrThrow({ where: { code: 'DEMO-01' } })
  const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@demo.local' } })

  const foremen = await prisma.user.findMany({
    where: { branchId: branch.id, jobTitle: 'Foreman' },
  })
  if (foremen.length === 0) throw new Error('No foremen found — run seed-demo.ts first')
  const pickForeman = (i: number) => foremen[i % foremen.length].id

  // ── EXTRA CUSTOMERS ────────────────────────────────────────
  console.log('→ Customers + Vehicles (15 more)')
  const customerSpec = [
    { name: 'Tan Boon Hock', companyName: null, phone: '+60 16-555 0001', email: 'tbh@example.com', vehicles: [{ plate: 'WPK 1100', make: 'Toyota', model: 'Corolla Cross 1.8 V', color: 'Pearl White', mileage: '18,200 km', engineNo: '2ZR-FE-1100' }] },
    { name: 'Goh Pei Shan', companyName: null, phone: '+60 16-555 0002', email: 'pei.s@example.com', vehicles: [{ plate: 'JQT 2233', make: 'Honda', model: 'HR-V e:HEV', color: 'Crystal Black', mileage: '8,400 km', engineNo: 'L15B7-2233' }] },
    { name: 'Daniel Lim', companyName: 'Lim & Sons Logistics', phone: '+60 12-980 4455', email: 'daniel@limsons.my', vehicles: [{ plate: 'JKR 9988', make: 'Mitsubishi', model: 'Triton Athlete', color: 'Diamond Red', mileage: '47,300 km', engineNo: '4N15-9988' }, { plate: 'JKR 9989', make: 'Hyundai', model: 'Staria Premium', color: 'Creamy White', mileage: '34,800 km', engineNo: 'D4HE-9989' }] },
    { name: 'Aisha Kamaruddin', companyName: null, phone: '+60 13-401 7766', email: 'aisha.k@example.com', vehicles: [{ plate: 'PMK 5599', make: 'Mazda', model: 'CX-5 2.5 Turbo', color: 'Soul Red Crystal', mileage: '52,100 km', engineNo: 'PY-VPS-5599' }] },
    { name: 'Krishna Pillai', companyName: 'KP Trading Sdn Bhd', phone: '+60 12-307 1188', email: 'krishna@kp-trading.my', vehicles: [{ plate: 'WMA 3322', make: 'Lexus', model: 'NX350h Premium', color: 'Sonic Quartz', mileage: '12,500 km', engineNo: 'A25A-FXS-3322' }] },
    { name: 'Wong Jia Hui', companyName: null, phone: '+60 11-777 4422', email: 'jh.wong@example.com', vehicles: [{ plate: 'JFR 6611', make: 'Perodua', model: 'Aruz AV', color: 'Granite Grey', mileage: '78,400 km', engineNo: '2NR-VE-6611' }] },
    { name: 'Hassan Yusof', companyName: 'Hassan Auto Spares', phone: '+60 19-808 3344', email: 'hassan@hauto-spares.my', vehicles: [{ plate: 'BPK 4400', make: 'Volkswagen', model: 'Passat 2.0 TSI Elegance', color: 'Reflex Silver', mileage: '88,900 km', engineNo: 'EA888-4400' }] },
    { name: 'Christine Yap', companyName: null, phone: '+60 12-505 1199', email: 'christine.y@example.com', vehicles: [{ plate: 'WTL 8822', make: 'Subaru', model: 'Forester 2.0i-S', color: 'Crystal Black Silica', mileage: '64,000 km', engineNo: 'FB20-8822' }] },
    { name: 'Suresh Devar', companyName: null, phone: '+60 13-666 7733', email: null, vehicles: [{ plate: 'KCG 1177', make: 'Kia', model: 'Sorento 2.5T GT-Line', color: 'Snow White Pearl', mileage: '23,100 km', engineNo: 'G4KH-1177' }] },
    { name: 'Liyana Ahmad', companyName: 'Liyana Boutique', phone: '+60 18-422 9900', email: 'liyana@liyanaboutique.my', vehicles: [{ plate: 'JTR 2255', make: 'Mini', model: 'Cooper S 5-Door', color: 'British Racing Green', mileage: '19,800 km', engineNo: 'B48A20-2255' }] },
    { name: 'Andy Chua', companyName: 'Chua Enterprise', phone: '+60 16-200 5566', email: 'andy@chuaenterprise.com', vehicles: [{ plate: 'WTM 4477', make: 'Range Rover', model: 'Velar P250 R-Dynamic', color: 'Santorini Black', mileage: '36,500 km', engineNo: 'PT204-4477' }] },
    { name: 'Fatimah Abdullah', companyName: null, phone: '+60 11-303 8811', email: 'fatimah.a@example.com', vehicles: [{ plate: 'PJK 9933', make: 'Proton', model: 'Saga Premium', color: 'Quartz Black', mileage: '41,200 km', engineNo: 'VVT-9933' }] },
    { name: 'Eddie Ng', companyName: null, phone: '+60 12-100 6644', email: 'eddie.ng@example.com', vehicles: [{ plate: 'JBN 7700', make: 'Audi', model: 'A4 2.0 TFSI quattro', color: 'Glacier White', mileage: '55,000 km', engineNo: 'EA888-7700' }] },
    { name: 'Priya Devi', companyName: 'Devi & Associates', phone: '+60 12-866 2211', email: 'priya@devi-assoc.my', vehicles: [{ plate: 'WUH 5544', make: 'Toyota', model: 'Alphard 2.5 Executive Lounge', color: 'Black', mileage: '14,200 km', engineNo: '2AR-FE-5544' }] },
    { name: 'Mark Tan', companyName: null, phone: '+60 17-654 3210', email: 'mark.t@example.com', vehicles: [{ plate: 'JFK 8800', make: 'Nissan', model: 'Almera Turbo VLT', color: 'Pearl White', mileage: '29,700 km', engineNo: 'HRA0-8800' }] },
  ]

  const customers: Array<{ id: string; name: string; companyName: string | null; vehicles: Array<{ id: string; plate: string; make: string; model: string }> }> = []
  for (const c of customerSpec) {
    const cust = await prisma.customer.create({
      data: { branchId: branch.id, name: c.name, companyName: c.companyName ?? undefined, phone: c.phone, email: c.email ?? undefined },
    })
    const vs: any[] = []
    for (let i = 0; i < c.vehicles.length; i++) {
      const v = c.vehicles[i]
      const veh = await prisma.vehicle.create({ data: { customerId: cust.id, ...v, isDefault: i === 0 } })
      vs.push(veh)
    }
    customers.push({ ...cust, vehicles: vs })
  }

  // ── EXTRA STOCK ────────────────────────────────────────────
  console.log('→ Stock items (10 more)')
  const catByName = Object.fromEntries(
    (await prisma.stockCategory.findMany({ where: { branchId: branch.id } })).map(c => [c.name, c])
  )
  const brandByKey = Object.fromEntries(
    (await prisma.brand.findMany({ where: { branchId: branch.id } })).map(b => [`${b.categoryId}:${b.name}`, b])
  )
  const bId = (catName: string, brandName: string) => brandByKey[`${catByName[catName].id}:${brandName}`]?.id

  const stockSpec = [
    { itemCode: 'TYR-DUNL-23560R18', cat: 'Tyres', brand: 'Dunlop', description: 'Dunlop SP Sport Maxx 050 235/60R18', uom: 'PCS', costPrice: '510.00', sellPrice: '690.00', quantity: 12, minStock: 4, isTyre: true, tyreSize: '235/60R18', countryOfOrigin: 'Japan', dots: [{ code: '0125', qty: 6 }, { code: '0825', qty: 6 }] },
    { itemCode: 'TYR-KUMH-20555R16', cat: 'Tyres', brand: 'Kumho', description: 'Kumho Ecsta HS51 205/55R16', uom: 'PCS', costPrice: '195.00', sellPrice: '275.00', quantity: 20, minStock: 8, isTyre: true, tyreSize: '205/55R16', countryOfOrigin: 'South Korea', dots: [{ code: '0625', qty: 12 }, { code: '0925', qty: 8 }] },
    { itemCode: 'TYR-MICH-26540R20', cat: 'Tyres', brand: 'Michelin', description: 'Michelin Pilot Sport 4S 265/40R20', uom: 'PCS', costPrice: '920.00', sellPrice: '1180.00', quantity: 6, minStock: 4, isTyre: true, tyreSize: '265/40R20', countryOfOrigin: 'Thailand', dots: [{ code: '0425', qty: 4 }, { code: '1025', qty: 2 }] },
    { itemCode: 'OIL-LIQ-0W20-4L', cat: 'Engine Oil', brand: 'Liqui Moly', description: 'Liqui Moly Special Tec AA 0W-20 4L', uom: 'BTL', costPrice: '210.00', sellPrice: '285.00', quantity: 24, minStock: 10 },
    { itemCode: 'OIL-MOB-0W40-4L', cat: 'Engine Oil', brand: 'Mobil 1', description: 'Mobil 1 0W-40 Fully Synthetic 4L', uom: 'BTL', costPrice: '230.00', sellPrice: '305.00', quantity: 28, minStock: 12 },
    { itemCode: 'BRK-BEN-PAD-FT-VIOS', cat: 'Brake Parts', brand: 'Bendix', description: 'Bendix Front Brake Pads Toyota Vios', uom: 'SET', costPrice: '85.00', sellPrice: '140.00', quantity: 30, minStock: 10 },
    { itemCode: 'FLT-KN-AIR-CIVIC-FE', cat: 'Filters', brand: 'K&N', description: 'K&N Drop-In Air Filter Honda Civic FE', uom: 'PCS', costPrice: '180.00', sellPrice: '265.00', quantity: 8, minStock: 4 },
    { itemCode: 'BAT-VAR-DIN66', cat: 'Battery', brand: 'Varta', description: 'Varta Silver Dynamic DIN66 66Ah', uom: 'PCS', costPrice: '340.00', sellPrice: '465.00', quantity: 8, minStock: 4 },
    { itemCode: 'SUS-MON-AB-CITY-FT', cat: 'Suspension', brand: 'Monroe', description: 'Monroe Reflex Front Absorber Honda City (Pair)', uom: 'PAIR', costPrice: '290.00', sellPrice: '420.00', quantity: 6, minStock: 2 },
    { itemCode: 'AC-VAL-COMP-MYVI', cat: 'Air-Con Parts', brand: 'Valeo', description: 'Valeo A/C Compressor Perodua Myvi', uom: 'PCS', costPrice: '480.00', sellPrice: '680.00', quantity: 4, minStock: 2 },
  ]

  const stockMap: Record<string, any> = {}
  for (const s of stockSpec) {
    const item = await prisma.stockItem.create({
      data: {
        branchId: branch.id,
        categoryId: catByName[s.cat]?.id,
        brandId: s.brand ? bId(s.cat, s.brand) : undefined,
        itemCode: s.itemCode,
        description: s.description,
        uom: s.uom,
        costPrice: D(s.costPrice),
        sellPrice: D(s.sellPrice),
        quantity: s.quantity,
        minStock: s.minStock,
        isTyre: s.isTyre ?? false,
        tyreSize: s.tyreSize,
        countryOfOrigin: s.countryOfOrigin,
      },
    })
    stockMap[s.itemCode] = item
    if (s.dots) {
      for (const d of s.dots) {
        await prisma.tyreDOT.create({ data: { stockItemId: item.id, dotCode: d.code, quantity: d.qty } })
      }
    }
    await prisma.stockHistory.create({
      data: {
        branchId: branch.id, stockItemId: item.id, type: 'IN',
        quantity: s.quantity, previousQty: 0, newQty: s.quantity,
        reason: 'Restock', createdById: admin.id,
      },
    })
  }

  // ── DOCUMENTS ─────────────────────────────────────────────
  console.log('→ Documents (~30 more, spread over 6 months)')

  // Pull existing seed-demo stock items so docs can reference them
  const existingStock = await prisma.stockItem.findMany({ where: { branchId: branch.id } })
  const stockByCode: Record<string, any> = Object.fromEntries(existingStock.map(s => [s.itemCode, s]))

  const year = 26
  const nextDocNum = async (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'DELIVERY_ORDER', prefix: string) => {
    const set = await prisma.documentSetting.findUniqueOrThrow({ where: { branchId_documentType: { branchId: branch.id, documentType: type } } })
    const n = set.nextNumber
    await prisma.documentSetting.update({ where: { id: set.id }, data: { nextNumber: n + 1 } })
    return `${prefix}${year}-${String(n).padStart(4, '0')}`
  }

  type DocSpec = {
    type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'DELIVERY_ORDER'
    prefix: string
    customerIdx: number
    vehicleIdx?: number
    foremanIdx: number
    status: 'DRAFT' | 'OUTSTANDING' | 'PARTIAL' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'SENT' | 'OVERDUE'
    daysAgo: number
    items: Array<{ code: string; qty: number; discountPct?: number; tyreDotCode?: string }>
    payments?: Array<{ amount: number; method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT_CARD' | 'EWALLET' | 'TNG' | 'BOOST'; ref?: string }>
  }

  const docs: DocSpec[] = [
    // Older history (90-180 days ago) — building up volume
    { type: 'INVOICE', prefix: 'INV', customerIdx: 0,  foremanIdx: 0, status: 'PAID', daysAgo: 175, items: [{ code: 'OIL-CAS-5W40-4L', qty: 1 }, { code: 'FLT-BOS-OIL-VIOS', qty: 1 }], payments: [{ amount: 217, method: 'CASH' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 2,  foremanIdx: 1, status: 'PAID', daysAgo: 168, items: [{ code: 'TYR-DUNL-23560R18', qty: 4, tyreDotCode: '0125' }, { code: 'SVC-ALIGN-4WHEEL', qty: 1 }], payments: [{ amount: 2840, method: 'BANK_TRANSFER', ref: 'TXN-700111' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 4,  foremanIdx: 0, status: 'PAID', daysAgo: 152, items: [{ code: 'OIL-LIQ-0W20-4L', qty: 1 }, { code: 'FLT-MAN-AIR-CIVIC', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [{ amount: 403, method: 'CREDIT_CARD', ref: 'CC-**1212' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 1,  foremanIdx: 1, status: 'PAID', daysAgo: 140, items: [{ code: 'TYR-KUMH-20555R16', qty: 4, tyreDotCode: '0625' }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [{ amount: 1140, method: 'BANK_TRANSFER', ref: 'TXN-701332' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 6,  foremanIdx: 0, status: 'PAID', daysAgo: 120, items: [{ code: 'BAT-VAR-DIN66', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 0.5 as any }], payments: [{ amount: 490, method: 'TNG', ref: 'TNG-44551' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 8,  foremanIdx: 1, status: 'PAID', daysAgo: 110, items: [{ code: 'BRK-BEN-PAD-FT-VIOS', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [{ amount: 190, method: 'CASH' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 10, foremanIdx: 0, status: 'PAID', daysAgo: 95, items: [{ code: 'TYR-MICH-26540R20', qty: 4, tyreDotCode: '0425' }, { code: 'SVC-ALIGN-4WHEEL', qty: 1 }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [{ amount: 4840, method: 'CHEQUE', ref: 'CHQ-998811' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 12, foremanIdx: 1, status: 'PAID', daysAgo: 80, items: [{ code: 'OIL-MOB-0W40-4L', qty: 1 }, { code: 'FLT-KN-AIR-CIVIC-FE', qty: 1 }], payments: [{ amount: 570, method: 'CREDIT_CARD', ref: 'CC-**8472' }] },

    // Mid-range (40-80 days)
    { type: 'INVOICE', prefix: 'INV', customerIdx: 3,  foremanIdx: 0, status: 'PAID', daysAgo: 70, items: [{ code: 'OIL-PET-10W40-4L', qty: 1 }, { code: 'FLT-DEN-CAB-MYVI', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 0.5 as any }], payments: [{ amount: 208, method: 'BOOST', ref: 'BST-66112' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 5,  foremanIdx: 1, status: 'PAID', daysAgo: 62, items: [{ code: 'AC-VAL-COMP-MYVI', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 3 }], payments: [{ amount: 830, method: 'BANK_TRANSFER', ref: 'TXN-702991' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 7,  foremanIdx: 0, status: 'PARTIAL', daysAgo: 55, items: [{ code: 'SUS-MON-AB-CITY-FT', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 2 }], payments: [{ amount: 300, method: 'CASH' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 9,  foremanIdx: 1, status: 'PAID', daysAgo: 48, items: [{ code: 'OIL-CAS-5W40-4L', qty: 1 }, { code: 'BRK-BRE-PAD-FT-CIVIC', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1.5 as any }], payments: [{ amount: 470, method: 'CREDIT_CARD', ref: 'CC-**3344' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 11, foremanIdx: 0, status: 'PAID', daysAgo: 41, items: [{ code: 'TYR-MICH-18565R15', qty: 4, tyreDotCode: '2524' }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [{ amount: 1280, method: 'BANK_TRANSFER', ref: 'TXN-703451' }] },

    // Recent — wider mix of statuses
    { type: 'QUOTATION', prefix: 'QT', customerIdx: 13, foremanIdx: 1, status: 'SENT', daysAgo: 25, items: [{ code: 'TYR-MICH-26540R20', qty: 4 }, { code: 'SVC-ALIGN-4WHEEL', qty: 1 }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }] },
    { type: 'QUOTATION', prefix: 'QT', customerIdx: 14, foremanIdx: 0, status: 'SENT', daysAgo: 22, items: [{ code: 'OIL-MOT-5W30-4L', qty: 1 }, { code: 'FLT-BOS-OIL-VIOS', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }] },
    { type: 'QUOTATION', prefix: 'QT', customerIdx: 1,  foremanIdx: 1, status: 'DRAFT', daysAgo: 20, items: [{ code: 'BAT-AMA-NS60L', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 0.5 as any }] },

    { type: 'INVOICE', prefix: 'INV', customerIdx: 0,  foremanIdx: 0, status: 'PAID', daysAgo: 28, items: [{ code: 'TYR-MICH-18565R15', qty: 2, tyreDotCode: '0125' }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [{ amount: 660, method: 'CASH' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 2,  foremanIdx: 1, status: 'OUTSTANDING', daysAgo: 18, items: [{ code: 'OIL-MOB-0W40-4L', qty: 1 }, { code: 'BRK-TRW-PAD-RR-MYVI', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 3,  foremanIdx: 0, status: 'PARTIAL', daysAgo: 15, items: [{ code: 'TYR-CONT-22545R18', qty: 4, tyreDotCode: '4924' }, { code: 'SVC-ALIGN-4WHEEL', qty: 1 }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [{ amount: 1500, method: 'BANK_TRANSFER', ref: 'TXN-720881' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 4,  foremanIdx: 1, status: 'PAID', daysAgo: 12, items: [{ code: 'OIL-LIQ-0W20-4L', qty: 1 }, { code: 'FLT-KN-AIR-CIVIC-FE', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [{ amount: 600, method: 'CREDIT_CARD', ref: 'CC-**9911' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 5,  foremanIdx: 0, status: 'PAID', daysAgo: 10, items: [{ code: 'BRK-BEN-PAD-FT-VIOS', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [{ amount: 190, method: 'TNG', ref: 'TNG-77182' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 6,  foremanIdx: 1, status: 'OUTSTANDING', daysAgo: 8, items: [{ code: 'AC-VAL-COMP-MYVI', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 2.5 as any }], payments: [] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 7,  foremanIdx: 0, status: 'PAID', daysAgo: 5, items: [{ code: 'OIL-CAS-5W40-4L', qty: 1 }, { code: 'FLT-BOS-OIL-VIOS', qty: 1 }], payments: [{ amount: 217, method: 'EWALLET', ref: 'GRAB-66721' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 8,  foremanIdx: 1, status: 'OUTSTANDING', daysAgo: 3, items: [{ code: 'SUS-MON-AB-CITY-FT', qty: 1 }, { code: 'BRK-TRW-PAD-RR-MYVI', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1.5 as any }], payments: [] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 9,  foremanIdx: 0, status: 'PAID', daysAgo: 2, items: [{ code: 'TYR-DUNL-23560R18', qty: 4, tyreDotCode: '0825' }, { code: 'SVC-ALIGN-4WHEEL', qty: 1 }], payments: [{ amount: 2840, method: 'BANK_TRANSFER', ref: 'TXN-721554' }] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 10, foremanIdx: 1, status: 'PAID', daysAgo: 1, items: [{ code: 'OIL-MOB-0W40-4L', qty: 1 }, { code: 'FLT-MAN-AIR-CIVIC', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 1 }], payments: [{ amount: 423, method: 'CASH' }] },

    // Today — fresh activity
    { type: 'INVOICE', prefix: 'INV', customerIdx: 11, foremanIdx: 0, status: 'OUTSTANDING', daysAgo: 0, items: [{ code: 'TYR-KUMH-20555R16', qty: 4, tyreDotCode: '0925' }, { code: 'SVC-BALANCE-4WHEEL', qty: 1 }], payments: [] },
    { type: 'INVOICE', prefix: 'INV', customerIdx: 12, foremanIdx: 1, status: 'PAID', daysAgo: 0, items: [{ code: 'BAT-VAR-DIN66', qty: 1 }, { code: 'SVC-LABOR-HR', qty: 0.5 as any }], payments: [{ amount: 490, method: 'CASH' }] },

    // Delivery orders
    { type: 'DELIVERY_ORDER', prefix: 'DO', customerIdx: 13, foremanIdx: 0, status: 'COMPLETED', daysAgo: 6, items: [{ code: 'TYR-MICH-26540R20', qty: 4 }] },
    { type: 'DELIVERY_ORDER', prefix: 'DO', customerIdx: 11, foremanIdx: 1, status: 'COMPLETED', daysAgo: 12, items: [{ code: 'BAT-VAR-DIN66', qty: 1 }] },

    // Cancelled / overdue
    { type: 'INVOICE', prefix: 'INV', customerIdx: 14, foremanIdx: 0, status: 'CANCELLED', daysAgo: 32, items: [{ code: 'OIL-LIQ-0W20-4L', qty: 2 }] },
  ]

  for (let i = 0; i < docs.length; i++) {
    const opts = docs[i]
    const cust = customers[opts.customerIdx]
    if (!cust) continue
    const veh = cust.vehicles[opts.vehicleIdx ?? 0]
    const num = await nextDocNum(opts.type, opts.prefix)
    const issueDate = daysAgo(opts.daysAgo)

    const lines = opts.items.map((it, idx) => {
      const s = stockByCode[it.code] || stockMap[it.code]
      if (!s) throw new Error(`Stock item not found: ${it.code}`)
      const unitPrice = Number(s.sellPrice)
      const discountPct = it.discountPct ?? 0
      const subtotal = unitPrice * it.qty
      const total = subtotal * (1 - discountPct / 100)
      return { stockItem: s, it, idx, unitPrice, subtotal, total, discountPct }
    })
    const subtotal = lines.reduce((a, l) => a + l.subtotal, 0)
    const discountAmount = lines.reduce((a, l) => a + (l.subtotal - l.total), 0)
    const total = lines.reduce((a, l) => a + l.total, 0)
    const paidAmount = (opts.payments ?? []).reduce((a, p) => a + p.amount, 0)

    const doc = await prisma.document.create({
      data: {
        branchId: branch.id,
        documentType: opts.type,
        documentNumber: num,
        customerId: cust.id,
        vehicleId: veh?.id,
        customerName: cust.name,
        customerCompanyName: cust.companyName ?? undefined,
        vehiclePlate: veh?.plate,
        vehicleModel: veh ? `${veh.make} ${veh.model}` : undefined,
        issueDate,
        dueDate: opts.type === 'INVOICE' ? new Date(issueDate.getTime() + 30 * 86400000) : null,
        status: opts.status,
        subtotal: D(subtotal),
        discountAmount: D(discountAmount),
        totalAmount: D(total),
        paidAmount: D(paidAmount),
        createdById: admin.id,
        foremanId: pickForeman(opts.foremanIdx),
        items: {
          create: await Promise.all(lines.map(async l => {
            let tyreDotId: string | undefined
            if (l.it.tyreDotCode) {
              const d = await prisma.tyreDOT.findUnique({ where: { stockItemId_dotCode: { stockItemId: l.stockItem.id, dotCode: l.it.tyreDotCode } } }).catch(() => null)
              tyreDotId = d?.id
            }
            return {
              stockItemId: l.stockItem.id,
              itemCode: l.stockItem.itemCode,
              description: l.stockItem.description,
              quantity: l.it.qty,
              unit: l.stockItem.uom,
              unitPrice: D(l.unitPrice),
              discountPercent: D(l.discountPct),
              subtotal: D(l.subtotal),
              total: D(l.total),
              sortOrder: l.idx,
              tyreDotId,
              tyreDotCode: l.it.tyreDotCode,
            }
          })),
        },
      },
    })

    if (opts.payments) {
      for (const p of opts.payments) {
        await prisma.payment.create({
          data: {
            documentId: doc.id,
            amount: D(p.amount),
            paymentMethod: p.method,
            referenceNumber: p.ref,
            bankName: p.method === 'BANK_TRANSFER' ? 'Maybank' : undefined,
            createdById: admin.id,
            createdAt: issueDate,
          },
        })
      }
    }
  }

  // ── EXTRA SUPPLIERS + PURCHASE INVOICES ────────────────────
  console.log('→ Suppliers + purchase invoices')
  const supplierSpec = [
    { companyName: 'Dunlop Tyre Distribution', contactName: 'Wilson Lee', phone: '+60 3-7710 5544', email: 'wilson@dunlop-msia.com', address: 'Lot 22, Subang Hi-Tech, 47500 Petaling Jaya', bankName: 'Public Bank', bankAccount: '3155 8822 4411', notes: 'Dunlop tyres distributor' },
    { companyName: 'Mobil Lubricants Sdn Bhd', contactName: 'Aaron Pang', phone: '+60 3-2030 7700', email: 'aaron@mobilube.my', address: 'Level 12, Wisma Mobil, 50480 Kuala Lumpur', bankName: 'CIMB', bankAccount: '8033 4477 5511', notes: 'Mobil 1, ESP range' },
    { companyName: 'Bendix Brake Solutions', contactName: 'Rashid Hamid', phone: '+60 12-789 4411', email: 'rashid@bendix-bs.my', address: 'No 18, Jalan Puchong Industri 4/8, 47100 Puchong', bankName: 'RHB', bankAccount: '2155 7733 8800', notes: 'Brake parts — multi-brand' },
    { companyName: 'Varta Battery Asia', contactName: 'Cynthia Ong', phone: '+60 4-555 2233', email: 'cynthia@varta-asia.com', address: '15 Bayan Lepas FTZ Phase 4, 11900 Penang', bankName: 'Maybank', bankAccount: '5188 2244 6633', notes: 'Varta + Bosch batteries' },
  ]

  const newSuppliers: Record<string, any> = {}
  for (const sp of supplierSpec) {
    newSuppliers[sp.companyName] = await prisma.supplier.create({ data: { branchId: branch.id, ...sp } })
  }

  const piExisting = await prisma.purchaseInvoice.count({ where: { branchId: branch.id } })
  let piSeq = piExisting + 1
  const nextPI = () => `PI${year}-${String(piSeq++).padStart(4, '0')}`

  // FINALIZED — Dunlop tyres
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Dunlop Tyre Distribution'].id, invoiceNumber: 'DTD-2026-0042', internalNumber: nextPI(),
      status: 'FINALIZED', issueDate: daysAgo(40), receivedDate: daysAgo(38), createdById: admin.id,
      subtotal: D(6120), totalAmount: D(6120), paidAmount: D(6120),
      notes: 'Dunlop SP Sport Maxx restock',
      items: {
        create: [
          { stockItemId: stockMap['TYR-DUNL-23560R18'].id, itemCode: 'TYR-DUNL-23560R18', brandName: 'Dunlop', description: 'Dunlop SP Sport Maxx 050 235/60R18', quantity: 12, unitPrice: D(510), total: D(6120), dotCode: '0825', isChecked: true, sortOrder: 0 },
        ],
      },
      attachments: { create: [{ fileName: 'dtd-2026-0042.pdf', fileUrl: '/uploads/seed/dtd-0042.pdf', fileSize: 198000, mimeType: 'application/pdf' }] },
    },
  })

  // VERIFIED — Mobil 1
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Mobil Lubricants Sdn Bhd'].id, invoiceNumber: 'MOB-INV-7741', internalNumber: nextPI(),
      status: 'VERIFIED', issueDate: daysAgo(8), receivedDate: daysAgo(7), createdById: admin.id,
      subtotal: D(6440), totalAmount: D(6440),
      notes: 'Mobil 1 + Liqui Moly bulk',
      items: {
        create: [
          { stockItemId: stockMap['OIL-MOB-0W40-4L'].id, itemCode: 'OIL-MOB-0W40-4L', brandName: 'Mobil 1', description: 'Mobil 1 0W-40 Fully Synthetic 4L', quantity: 28, unitPrice: D(230), total: D(6440), isChecked: true, sortOrder: 0 },
        ],
      },
    },
  })

  // ON_HOLD — Bendix brakes
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Bendix Brake Solutions'].id, invoiceNumber: 'BEN-2026-0118', internalNumber: nextPI(),
      status: 'ON_HOLD', issueDate: daysAgo(2), createdById: admin.id,
      subtotal: D(2550), totalAmount: D(2550),
      notes: 'Awaiting QC check',
      items: {
        create: [
          { stockItemId: stockMap['BRK-BEN-PAD-FT-VIOS'].id, itemCode: 'BRK-BEN-PAD-FT-VIOS', brandName: 'Bendix', description: 'Bendix Front Brake Pads Toyota Vios', quantity: 30, unitPrice: D(85), total: D(2550), isChecked: false, sortOrder: 0 },
        ],
      },
    },
  })

  // FINALIZED — Varta batteries
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Varta Battery Asia'].id, invoiceNumber: 'VAR-INV-2026-0034', internalNumber: nextPI(),
      status: 'FINALIZED', issueDate: daysAgo(25), receivedDate: daysAgo(23), createdById: admin.id,
      subtotal: D(2720), totalAmount: D(2720), paidAmount: D(2720),
      notes: 'Varta Silver Dynamic batch',
      items: {
        create: [
          { stockItemId: stockMap['BAT-VAR-DIN66'].id, itemCode: 'BAT-VAR-DIN66', brandName: 'Varta', description: 'Varta Silver Dynamic DIN66 66Ah', quantity: 8, unitPrice: D(340), total: D(2720), isChecked: true, sortOrder: 0 },
        ],
      },
    },
  })

  // ── SUPPLIER PAYMENTS ──────────────────────────────────────
  console.log('→ Supplier payments')
  const payExisting = await prisma.supplierPayment.count({ where: { branchId: branch.id } })
  let payIdx = payExisting + 1
  const nextPay = () => `PAY${year}-${String(payIdx++).padStart(4, '0')}`

  await prisma.supplierPayment.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Dunlop Tyre Distribution'].id, paymentNumber: nextPay(),
      amount: D(6120), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'TXN-722115',
      bankName: 'Maybank', paymentDate: daysAgo(35), createdById: admin.id,
      notes: 'Full payment — DTD-2026-0042',
    },
  })

  await prisma.supplierPayment.create({
    data: {
      branchId: branch.id, supplierId: newSuppliers['Varta Battery Asia'].id, paymentNumber: nextPay(),
      amount: D(2720), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'TXN-722440',
      bankName: 'CIMB', paymentDate: daysAgo(20), createdById: admin.id,
    },
  })

  console.log('Seed-more complete!')
  console.table({
    customers: await prisma.customer.count({ where: { branchId: branch.id } }),
    vehicles: await prisma.vehicle.count(),
    stockItems: await prisma.stockItem.count({ where: { branchId: branch.id } }),
    documents: await prisma.document.count({ where: { branchId: branch.id } }),
    payments: await prisma.payment.count(),
    suppliers: await prisma.supplier.count({ where: { branchId: branch.id } }),
    purchaseInvoices: await prisma.purchaseInvoice.count({ where: { branchId: branch.id } }),
    supplierPayments: await prisma.supplierPayment.count({ where: { branchId: branch.id } }),
  })
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
