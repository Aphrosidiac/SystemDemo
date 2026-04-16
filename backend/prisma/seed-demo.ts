import { PrismaClient, Prisma } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

const D = (n: number | string) => new Prisma.Decimal(n)
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)

async function main() {
  console.log('🌱 Demo seed starting...')

  const branch = await prisma.branch.findFirstOrThrow({ where: { code: 'DEMO-01' } })
  const admin = await prisma.user.findFirstOrThrow({ where: { email: 'admin@demo.local' } })

  // ── STAFF (managers + workers) ─────────────────────────────
  console.log('→ Staff')
  const pwd = await bcryptjs.hash('password123', 12)
  const staffSpec = [
    { email: 'manager@demo.local', name: 'Lim Boon Keat', role: 'MANAGER' as const, jobTitle: 'Branch Manager', phone: '+60 12-321 1001' },
    { email: 'ahmad@demo.local', name: 'Ahmad bin Rahman', role: 'WORKER' as const, jobTitle: 'Foreman', phone: '+60 12-321 2001' },
    { email: 'rizal@demo.local', name: 'Rizal Hakim', role: 'WORKER' as const, jobTitle: 'Mechanic', phone: '+60 12-321 2002' },
    { email: 'jason@demo.local', name: 'Jason Tan', role: 'WORKER' as const, jobTitle: 'Technician', phone: '+60 12-321 2003' },
    { email: 'muthu@demo.local', name: 'Muthu Samy', role: 'WORKER' as const, jobTitle: 'Mechanic', phone: '+60 12-321 2004' },
    { email: 'wei@demo.local', name: 'Wei Liang', role: 'WORKER' as const, jobTitle: 'Foreman', phone: '+60 12-321 2005' },
    { email: 'ali@demo.local', name: 'Ali Osman', role: 'WORKER' as const, jobTitle: 'Salesman', phone: '+60 12-321 2006' },
  ]
  const staff: Record<string, { id: string }> = {}
  for (const s of staffSpec) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, role: s.role, jobTitle: s.jobTitle, phone: s.phone },
      create: { ...s, branchId: branch.id, passwordHash: pwd },
    })
    staff[s.email] = u
  }
  const foremanAhmad = staff['ahmad@demo.local']
  const foremanWei = staff['wei@demo.local']

  // ── CUSTOMERS + VEHICLES ───────────────────────────────────
  console.log('→ Customers + Vehicles')
  const customerSpec = [
    { name: 'Tan Ah Kow', companyName: null, phone: '+60 16-111 0001', email: 'tanak@example.com', vehicles: [{ plate: 'JPK 8823', make: 'Toyota', model: 'Vios 1.5G', color: 'Silver', mileage: '85,420 km', engineNo: '2NZ-FE-9823' }] },
    { name: 'Siti Nuraini', companyName: null, phone: '+60 16-111 0002', email: 'siti.n@example.com', vehicles: [{ plate: 'WVG 1234', make: 'Perodua', model: 'Myvi Advance', color: 'Ocean Blue', mileage: '42,800 km', engineNo: 'K3-VE-7742' }] },
    { name: 'Rajesh Kumar', companyName: 'Kumar Trading Sdn Bhd', phone: '+60 12-777 5566', email: 'rk@kumartrading.com.my', vehicles: [{ plate: 'JHB 7788', make: 'Honda', model: 'Civic FD 2.0', color: 'Black', mileage: '123,500 km', engineNo: 'K20Z2-001' }, { plate: 'JHB 7789', make: 'Toyota', model: 'Hilux Rogue', color: 'White', mileage: '56,000 km', engineNo: '2GD-FTV-112' }] },
    { name: 'Chong Mei Ling', companyName: 'MeiLing Beauty Enterprise', phone: '+60 12-333 8899', email: 'meiling@ml-beauty.my', vehicles: [{ plate: 'VAB 9922', make: 'Mercedes-Benz', model: 'C200 AMG Line', color: 'Obsidian Black', mileage: '28,100 km', engineNo: 'M264-9922' }] },
    { name: 'Azman Hashim', companyName: null, phone: '+60 13-222 4411', email: null, vehicles: [{ plate: 'PKH 3344', make: 'Proton', model: 'X70 Premium', color: 'Snow White', mileage: '67,900 km', engineNo: 'TGDI-1.8-334' }] },
    { name: 'Lee Chong Wei', companyName: null, phone: '+60 11-888 1122', email: 'lcw@example.com', vehicles: [{ plate: 'JSK 1100', make: 'BMW', model: '320i M Sport', color: 'Alpine White', mileage: '15,200 km', engineNo: 'B48-1100' }] },
    { name: 'Ravi Shankar', companyName: 'Shankar Logistics', phone: '+60 12-555 6677', email: 'ops@shankarlogistics.my', vehicles: [{ plate: 'MAA 4455', make: 'Isuzu', model: 'D-Max V-Cross', color: 'Obsidian Grey', mileage: '98,000 km', engineNo: '4JJ1-4455' }] },
    { name: 'Nur Aisyah', companyName: null, phone: '+60 17-999 0033', email: 'aisyah@example.com', vehicles: [{ plate: 'JQP 2211', make: 'Perodua', model: 'Bezza 1.3 Advance', color: 'Granite Grey', mileage: '31,400 km', engineNo: 'NR-VE-2211' }] },
    { name: 'Vincent Ooi', companyName: 'Ooi Construction Sdn Bhd', phone: '+60 12-444 9900', email: 'vincent@ooicon.my', vehicles: [{ plate: 'JKL 5678', make: 'Ford', model: 'Ranger Raptor', color: 'Performance Blue', mileage: '22,300 km', engineNo: 'V6-BiTurbo-5678' }] },
    { name: 'Farah Aziz', companyName: null, phone: '+60 11-202 3030', email: 'farah.a@example.com', vehicles: [{ plate: 'WUT 8080', make: 'Honda', model: 'City RS e:HEV', color: 'Platinum White Pearl', mileage: '12,900 km', engineNo: 'LEB-H4-8080' }] },
  ]

  const customers: Array<{ id: string; name: string; companyName: string | null; vehicles: Array<{ id: string; plate: string; make: string; model: string; color: string; mileage: string; engineNo: string }> }> = []
  for (const c of customerSpec) {
    const existing = await prisma.customer.findFirst({ where: { branchId: branch.id, name: c.name } })
    const cust = existing ?? (await prisma.customer.create({
      data: { branchId: branch.id, name: c.name, companyName: c.companyName ?? undefined, phone: c.phone, email: c.email ?? undefined },
    }))
    const vs: any[] = []
    for (let i = 0; i < c.vehicles.length; i++) {
      const v = c.vehicles[i]
      const vexist = await prisma.vehicle.findFirst({ where: { customerId: cust.id, plate: v.plate } })
      const veh = vexist ?? (await prisma.vehicle.create({ data: { customerId: cust.id, ...v, isDefault: i === 0 } }))
      vs.push(veh)
    }
    customers.push({ ...cust, vehicles: vs })
  }

  // ── STOCK ITEMS ────────────────────────────────────────────
  console.log('→ Stock items (incl. tyres w/ DOT batches)')
  const catByName = Object.fromEntries(
    (await prisma.stockCategory.findMany({ where: { branchId: branch.id } })).map(c => [c.name, c])
  )
  const brandByKey = Object.fromEntries(
    (await prisma.brand.findMany({ where: { branchId: branch.id } })).map(b => [`${b.categoryId}:${b.name}`, b])
  )
  const bId = (catName: string, brandName: string) => brandByKey[`${catByName[catName].id}:${brandName}`]?.id

  const stockSpec = [
    // Tyres — with DOT batches
    { itemCode: 'TYR-MICH-18565R15', cat: 'Tyres', brand: 'Michelin', description: 'Michelin Primacy 4 185/65R15', uom: 'PCS', costPrice: '220.00', sellPrice: '310.00', quantity: 24, minStock: 8, isTyre: true, tyreSize: '185/65R15', countryOfOrigin: 'Thailand', dots: [{ code: '1524', qty: 8 }, { code: '2524', qty: 8 }, { code: '0125', qty: 8 }] },
    { itemCode: 'TYR-BRID-19560R15', cat: 'Tyres', brand: 'Bridgestone', description: 'Bridgestone Turanza 6 195/60R15', uom: 'PCS', costPrice: '240.00', sellPrice: '335.00', quantity: 16, minStock: 8, isTyre: true, tyreSize: '195/60R15', countryOfOrigin: 'Indonesia', dots: [{ code: '3524', qty: 8 }, { code: '0525', qty: 8 }] },
    { itemCode: 'TYR-GOOD-21555R17', cat: 'Tyres', brand: 'Goodyear', description: 'Goodyear Eagle F1 Asymmetric 5 215/55R17', uom: 'PCS', costPrice: '460.00', sellPrice: '620.00', quantity: 12, minStock: 4, isTyre: true, tyreSize: '215/55R17', countryOfOrigin: 'Germany', dots: [{ code: '4824', qty: 4 }, { code: '0225', qty: 8 }] },
    { itemCode: 'TYR-CONT-22545R18', cat: 'Tyres', brand: 'Continental', description: 'Continental MC6 225/45R18', uom: 'PCS', costPrice: '540.00', sellPrice: '720.00', quantity: 8, minStock: 4, isTyre: true, tyreSize: '225/45R18', countryOfOrigin: 'Portugal', dots: [{ code: '4924', qty: 8 }] },
    { itemCode: 'TYR-PIRE-24540R18', cat: 'Tyres', brand: 'Pirelli', description: 'Pirelli P Zero 245/40R18', uom: 'PCS', costPrice: '780.00', sellPrice: '980.00', quantity: 4, minStock: 4, isTyre: true, tyreSize: '245/40R18', countryOfOrigin: 'Italy', dots: [{ code: '0325', qty: 4 }] },
    { itemCode: 'TYR-TOYO-26565R17', cat: 'Tyres', brand: 'Toyo', description: 'Toyo Open Country A/T III 265/65R17', uom: 'PCS', costPrice: '620.00', sellPrice: '820.00', quantity: 8, minStock: 4, isTyre: true, tyreSize: '265/65R17', countryOfOrigin: 'Japan', dots: [{ code: '2024', qty: 4 }, { code: '0125', qty: 4 }] },
    // Engine oil
    { itemCode: 'OIL-CAS-5W40-4L', cat: 'Engine Oil', brand: 'Castrol', description: 'Castrol Edge 5W-40 Fully Synthetic 4L', uom: 'BTL', costPrice: '135.00', sellPrice: '185.00', quantity: 40, minStock: 15 },
    { itemCode: 'OIL-SHL-5W30-4L', cat: 'Engine Oil', brand: 'Shell Helix', description: 'Shell Helix Ultra 5W-30 4L', uom: 'BTL', costPrice: '145.00', sellPrice: '199.00', quantity: 30, minStock: 15 },
    { itemCode: 'OIL-PET-10W40-4L', cat: 'Engine Oil', brand: 'Petronas Syntium', description: 'Petronas Syntium 3000 AV 10W-40 4L', uom: 'BTL', costPrice: '98.00', sellPrice: '145.00', quantity: 50, minStock: 20 },
    { itemCode: 'OIL-MOT-5W30-4L', cat: 'Engine Oil', brand: 'Motul', description: 'Motul 8100 X-cess 5W-30 4L', uom: 'BTL', costPrice: '180.00', sellPrice: '240.00', quantity: 18, minStock: 10 },
    // Brakes
    { itemCode: 'BRK-BRE-PAD-FT-CIVIC', cat: 'Brake Parts', brand: 'Brembo', description: 'Brembo Front Brake Pads Civic FD', uom: 'SET', costPrice: '140.00', sellPrice: '210.00', quantity: 12, minStock: 6 },
    { itemCode: 'BRK-TRW-PAD-RR-MYVI', cat: 'Brake Parts', brand: 'TRW', description: 'TRW Rear Brake Pads Myvi', uom: 'SET', costPrice: '75.00', sellPrice: '125.00', quantity: 20, minStock: 8 },
    { itemCode: 'BRK-BOS-DSC-FT-320', cat: 'Brake Parts', brand: 'Bosch', description: 'Bosch Front Brake Disc BMW 320i', uom: 'PCS', costPrice: '320.00', sellPrice: '450.00', quantity: 6, minStock: 4 },
    // Filters
    { itemCode: 'FLT-BOS-OIL-VIOS', cat: 'Filters', brand: 'Bosch', description: 'Bosch Oil Filter Toyota Vios/Yaris', uom: 'PCS', costPrice: '18.00', sellPrice: '32.00', quantity: 60, minStock: 20 },
    { itemCode: 'FLT-MAN-AIR-CIVIC', cat: 'Filters', brand: 'Mann-Filter', description: 'Mann Air Filter Honda Civic FC', uom: 'PCS', costPrice: '42.00', sellPrice: '68.00', quantity: 25, minStock: 10 },
    { itemCode: 'FLT-DEN-CAB-MYVI', cat: 'Filters', brand: 'Denso', description: 'Denso Cabin Filter Perodua Myvi', uom: 'PCS', costPrice: '22.00', sellPrice: '38.00', quantity: 45, minStock: 15 },
    // Battery
    { itemCode: 'BAT-AMA-NS60L', cat: 'Battery', brand: 'Amaron', description: 'Amaron Hi-Life NS60L 45Ah', uom: 'PCS', costPrice: '180.00', sellPrice: '245.00', quantity: 10, minStock: 5 },
    { itemCode: 'BAT-CEN-DIN74', cat: 'Battery', brand: 'Century', description: 'Century Ultra Hi-Electric DIN74 74Ah', uom: 'PCS', costPrice: '310.00', sellPrice: '425.00', quantity: 6, minStock: 3 },
    // Suspension
    { itemCode: 'SUS-KYB-ABS-CIVIC-FT', cat: 'Suspension', brand: 'KYB', description: 'KYB Excel-G Front Absorber Civic FD (Pair)', uom: 'PAIR', costPrice: '360.00', sellPrice: '520.00', quantity: 4, minStock: 2 },
    { itemCode: 'SUS-BIL-B6-320-RR', cat: 'Suspension', brand: 'Bilstein', description: 'Bilstein B6 Rear Shock BMW 320i (Pair)', uom: 'PAIR', costPrice: '880.00', sellPrice: '1150.00', quantity: 2, minStock: 2 },
    // Air-con
    { itemCode: 'AC-DEN-COMP-VIOS', cat: 'Air-Con Parts', brand: 'Denso', description: 'Denso A/C Compressor Vios NCP93', uom: 'PCS', costPrice: '650.00', sellPrice: '880.00', quantity: 3, minStock: 2 },
    // Services (non-stock, but represented as items)
    { itemCode: 'SVC-ALIGN-4WHEEL', cat: 'Alignment & Balancing', brand: null, description: '4-Wheel Alignment', uom: 'JOB', costPrice: '0.00', sellPrice: '80.00', quantity: 999, minStock: 0 },
    { itemCode: 'SVC-BALANCE-4WHEEL', cat: 'Alignment & Balancing', brand: null, description: '4-Wheel Balancing', uom: 'JOB', costPrice: '0.00', sellPrice: '40.00', quantity: 999, minStock: 0 },
    { itemCode: 'SVC-LABOR-HR', cat: 'Others', brand: null, description: 'Workshop Labour (per hour)', uom: 'HR', costPrice: '0.00', sellPrice: '50.00', quantity: 999, minStock: 0 },
  ]

  const stockMap: Record<string, any> = {}
  for (const s of stockSpec) {
    const existing = await prisma.stockItem.findUnique({ where: { branchId_itemCode: { branchId: branch.id, itemCode: s.itemCode } } })
    const item = existing ?? (await prisma.stockItem.create({
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
    }))
    stockMap[s.itemCode] = item
    if (s.dots) {
      for (const d of s.dots) {
        await prisma.tyreDOT.upsert({
          where: { stockItemId_dotCode: { stockItemId: item.id, dotCode: d.code } },
          update: { quantity: d.qty },
          create: { stockItemId: item.id, dotCode: d.code, quantity: d.qty },
        })
      }
    }
    // Stock history IN on initial seed
    await prisma.stockHistory.create({
      data: {
        branchId: branch.id, stockItemId: item.id, type: 'IN',
        quantity: s.quantity, previousQty: 0, newQty: s.quantity,
        reason: 'Initial stock', createdById: admin.id,
      },
    })
  }

  // ── SUPPLIERS ───────────────────────────────────────────────
  console.log('→ Suppliers')
  const supplierSpec = [
    { companyName: 'Tyre Plus Distribution Sdn Bhd', contactName: 'Edmund Lau', phone: '+60 7-234 5678', email: 'edmund@tyreplus.my', address: 'No 15, Jalan Perindustrian Senai 3, 81400 Senai, Johor', bankName: 'Maybank', bankAccount: '5123 4567 8901', notes: 'Main tyre supplier — Michelin, Bridgestone, Continental' },
    { companyName: 'Petronas Lubricants Malaysia', contactName: 'Norlia Ibrahim', phone: '+60 3-2055 1234', email: 'norlia@petronas.com.my', address: 'Level 32, Tower 1, Petronas Twin Towers, KLCC, 50088 KL', bankName: 'CIMB', bankAccount: '8012 3456 7890', notes: 'Engine oil — Syntium range' },
    { companyName: 'Castrol Asia Pacific', contactName: 'Kenneth Yap', phone: '+60 3-7842 9000', email: 'kyap@castrol.com', address: 'Level 18, Menara TA One, 22 Jalan P Ramlee, 50250 KL', bankName: 'HSBC', bankAccount: '3001 2345 6789', notes: 'Castrol Edge, Magnatec — 60-day terms' },
    { companyName: 'Brembo Auto Parts Trading', contactName: 'Mohd Faizal', phone: '+60 12-345 8888', email: 'faizal@bremboparts.my', address: '88, Jalan Industri 5, Taman Perindustrian Skudai, 81300 Skudai', bankName: 'Public Bank', bankAccount: '3128 7654 3210', notes: 'Brake system specialist' },
    { companyName: 'Amaron Battery Sdn Bhd', contactName: 'Siva Kumar', phone: '+60 4-398 7777', email: 'siva@amaron.my', address: 'Lot 22, Bayan Lepas FTZ, 11900 Penang', bankName: 'Maybank', bankAccount: '5145 8899 2233', notes: 'Battery distributor, Northern region' },
    { companyName: 'KYB Automotive Parts', contactName: 'Tanaka Hiroshi', phone: '+60 3-5633 2211', email: 'tanaka@kyb-malaysia.com', address: '7, Jalan PJS 11/18, Bandar Sunway, 47500 Petaling Jaya', bankName: 'MUFG Bank', bankAccount: '7788 0099 1122', notes: 'Suspension parts — KYB, Bilstein' },
    { companyName: 'Denso Parts Distribution', contactName: 'Lee Wai Kit', phone: '+60 3-8888 4455', email: 'lee.wk@denso-malaysia.com', address: 'Lot 10, Jalan Hasil, Shah Alam Industrial, 40000 Shah Alam', bankName: 'OCBC', bankAccount: '6012 3456 7890', notes: 'Filters, A/C compressors' },
  ]

  const suppliers: Record<string, any> = {}
  for (const sp of supplierSpec) {
    const existing = await prisma.supplier.findFirst({ where: { branchId: branch.id, companyName: sp.companyName } })
    suppliers[sp.companyName] = existing ?? (await prisma.supplier.create({ data: { branchId: branch.id, ...sp } }))
  }

  // ── DOCUMENT NUMBERING HELPER ──────────────────────────────
  const year = 26
  const nextDocNum = async (type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'DELIVERY_ORDER', prefix: string) => {
    const set = await prisma.documentSetting.findUniqueOrThrow({ where: { branchId_documentType: { branchId: branch.id, documentType: type } } })
    const n = set.nextNumber
    await prisma.documentSetting.update({ where: { id: set.id }, data: { nextNumber: n + 1 } })
    return `${prefix}${year}-${String(n).padStart(4, '0')}`
  }

  // ── DOCUMENTS ──────────────────────────────────────────────
  console.log('→ Documents (quotations, invoices, receipts, DOs)')

  // helper to make a document with items and totals
  const mkDoc = async (opts: {
    type: 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'DELIVERY_ORDER'
    prefix: string
    customer: (typeof customers)[number]
    vehicleIdx?: number
    foremanId?: string
    status: 'DRAFT' | 'OUTSTANDING' | 'PARTIAL' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'SENT'
    daysAgo: number
    items: Array<{ code: string; qty: number; discountPct?: number; tyreDotCode?: string }>
    payments?: Array<{ amount: number; method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT_CARD' | 'EWALLET' | 'TNG' | 'BOOST'; ref?: string }>
    convertedFromId?: string
    convertedFromType?: 'QUOTATION' | 'INVOICE' | 'DELIVERY_ORDER' | 'RECEIPT'
  }) => {
    const num = await nextDocNum(opts.type, opts.prefix)
    const veh = opts.customer.vehicles[opts.vehicleIdx ?? 0]
    const issueDate = daysAgo(opts.daysAgo)

    // compute line totals
    const lines = opts.items.map((it, idx) => {
      const s = stockMap[it.code]
      const unitPrice = Number(s.sellPrice)
      const discountPct = it.discountPct ?? 0
      const subtotal = unitPrice * it.qty
      const afterDiscount = subtotal * (1 - discountPct / 100)
      return { stockItem: s, it, idx, unitPrice, subtotal, total: afterDiscount, discountPct }
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
        customerId: opts.customer.id,
        vehicleId: veh?.id,
        customerName: opts.customer.name,
        customerCompanyName: opts.customer.companyName ?? undefined,
        customerPhone: (opts.customer as any).phone ?? undefined,
        vehiclePlate: veh?.plate,
        vehicleModel: veh ? `${veh.make} ${veh.model}` : undefined,
        vehicleColor: veh?.color,
        vehicleMileage: veh?.mileage,
        vehicleEngineNo: veh?.engineNo,
        issueDate,
        dueDate: opts.type === 'INVOICE' ? new Date(issueDate.getTime() + 30 * 86400000) : null,
        status: opts.status,
        subtotal: D(subtotal),
        discountAmount: D(discountAmount),
        totalAmount: D(total),
        paidAmount: D(paidAmount),
        createdById: admin.id,
        foremanId: opts.foremanId,
        convertedFromId: opts.convertedFromId,
        convertedFromType: opts.convertedFromType,
        items: {
          create: await Promise.all(lines.map(async l => {
            let tyreDotId: string | undefined
            if (l.it.tyreDotCode) {
              const d = await prisma.tyreDOT.findUnique({ where: { stockItemId_dotCode: { stockItemId: l.stockItem.id, dotCode: l.it.tyreDotCode } } })
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

    if (opts.payments && opts.payments.length) {
      for (const p of opts.payments) {
        await prisma.payment.create({
          data: {
            documentId: doc.id,
            amount: D(p.amount),
            paymentMethod: p.method,
            referenceNumber: p.ref,
            bankName: p.method === 'BANK_TRANSFER' ? 'Maybank' : undefined,
            createdById: admin.id,
          },
        })
      }
    }
    return doc
  }

  // 2 quotations — one sent, one converted to invoice
  const q1 = await mkDoc({ type: 'QUOTATION', prefix: 'QT', customer: customers[2], foremanId: foremanAhmad.id, status: 'SENT', daysAgo: 12, items: [
    { code: 'TYR-GOOD-21555R17', qty: 4, tyreDotCode: '4824' },
    { code: 'SVC-ALIGN-4WHEEL', qty: 1 },
    { code: 'SVC-BALANCE-4WHEEL', qty: 1 },
  ] })
  const q2 = await mkDoc({ type: 'QUOTATION', prefix: 'QT', customer: customers[5], foremanId: foremanWei.id, status: 'SENT', daysAgo: 8, items: [
    { code: 'OIL-MOT-5W30-4L', qty: 1 },
    { code: 'FLT-BOS-OIL-VIOS', qty: 1 },
    { code: 'SVC-LABOR-HR', qty: 1 },
  ] })

  // Invoices: mix of PAID (full cash), PARTIAL (half transfer), OUTSTANDING, and one converted from q2
  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[0], foremanId: foremanAhmad.id, status: 'PAID', daysAgo: 30, items: [
    { code: 'OIL-PET-10W40-4L', qty: 1 },
    { code: 'FLT-BOS-OIL-VIOS', qty: 1 },
    { code: 'SVC-LABOR-HR', qty: 1 },
  ], payments: [{ amount: 227, method: 'CASH', ref: 'RCP-0001' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[1], foremanId: foremanWei.id, status: 'PAID', daysAgo: 22, items: [
    { code: 'TYR-MICH-18565R15', qty: 4, tyreDotCode: '1524' },
    { code: 'SVC-ALIGN-4WHEEL', qty: 1 },
    { code: 'SVC-BALANCE-4WHEEL', qty: 1 },
  ], payments: [{ amount: 1360, method: 'BANK_TRANSFER', ref: 'TXN-558912' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[3], foremanId: foremanAhmad.id, status: 'PARTIAL', daysAgo: 14, items: [
    { code: 'TYR-CONT-22545R18', qty: 4, tyreDotCode: '4924' },
    { code: 'BRK-BOS-DSC-FT-320', qty: 2 },
    { code: 'SVC-LABOR-HR', qty: 3 },
  ], payments: [{ amount: 2000, method: 'BANK_TRANSFER', ref: 'TXN-561034' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[6], foremanId: foremanWei.id, status: 'OUTSTANDING', daysAgo: 40, items: [
    { code: 'TYR-TOYO-26565R17', qty: 4, tyreDotCode: '2024' },
    { code: 'OIL-SHL-5W30-4L', qty: 1 },
    { code: 'FLT-MAN-AIR-CIVIC', qty: 1 },
    { code: 'SVC-ALIGN-4WHEEL', qty: 1 },
  ] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[4], foremanId: foremanAhmad.id, status: 'PAID', daysAgo: 7, items: [
    { code: 'BAT-AMA-NS60L', qty: 1 },
    { code: 'SVC-LABOR-HR', qty: 0.5 as any },
  ], payments: [{ amount: 270, method: 'TNG', ref: 'TNG-99882' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[8], foremanId: foremanWei.id, status: 'PARTIAL', daysAgo: 5, items: [
    { code: 'SUS-BIL-B6-320-RR', qty: 1 },
    { code: 'SUS-KYB-ABS-CIVIC-FT', qty: 1 },
    { code: 'SVC-LABOR-HR', qty: 4 },
  ], payments: [{ amount: 1000, method: 'CHEQUE', ref: 'CHQ-778811' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[7], foremanId: foremanAhmad.id, status: 'PAID', daysAgo: 2, items: [
    { code: 'OIL-CAS-5W40-4L', qty: 1 },
    { code: 'FLT-DEN-CAB-MYVI', qty: 1 },
    { code: 'BRK-TRW-PAD-RR-MYVI', qty: 1 },
  ], payments: [{ amount: 348, method: 'BOOST', ref: 'BST-22914' }] })

  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[9], foremanId: foremanWei.id, status: 'OUTSTANDING', daysAgo: 1, items: [
    { code: 'TYR-BRID-19560R15', qty: 4, tyreDotCode: '3524' },
    { code: 'SVC-ALIGN-4WHEEL', qty: 1 },
  ] })

  // Converted invoice from q2
  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[5], foremanId: foremanWei.id, status: 'PAID', daysAgo: 6, items: [
    { code: 'OIL-MOT-5W30-4L', qty: 1 },
    { code: 'FLT-BOS-OIL-VIOS', qty: 1 },
    { code: 'SVC-LABOR-HR', qty: 1 },
  ], payments: [{ amount: 322, method: 'CREDIT_CARD', ref: 'CC-**4821' }], convertedFromId: q2.id, convertedFromType: 'QUOTATION' })

  // Delivery Order
  await mkDoc({ type: 'DELIVERY_ORDER', prefix: 'DO', customer: customers[6], foremanId: foremanAhmad.id, status: 'COMPLETED', daysAgo: 40, items: [
    { code: 'TYR-TOYO-26565R17', qty: 4 },
  ] })

  // Cancelled invoice
  await mkDoc({ type: 'INVOICE', prefix: 'INV', customer: customers[0], foremanId: foremanAhmad.id, status: 'CANCELLED', daysAgo: 18, items: [
    { code: 'OIL-PET-10W40-4L', qty: 2 },
  ] })

  // Receipt (standalone)
  await mkDoc({ type: 'RECEIPT', prefix: 'RCP', customer: customers[2], foremanId: foremanAhmad.id, status: 'PAID', daysAgo: 4, items: [
    { code: 'SVC-LABOR-HR', qty: 2 },
  ], payments: [{ amount: 100, method: 'CASH' }] })

  // ── PURCHASE INVOICES ──────────────────────────────────────
  console.log('→ Purchase invoices + attachments')
  const piExisting = await prisma.purchaseInvoice.count({ where: { branchId: branch.id } })
  let piSeq = piExisting + 1
  const nextPI = () => `PI${year}-${String(piSeq++).padStart(4, '0')}`

  const tyrePlus = suppliers['Tyre Plus Distribution Sdn Bhd']
  const castrol = suppliers['Castrol Asia Pacific']
  const petronas = suppliers['Petronas Lubricants Malaysia']
  const brembo = suppliers['Brembo Auto Parts Trading']
  const amaron = suppliers['Amaron Battery Sdn Bhd']
  const kyb = suppliers['KYB Automotive Parts']

  // FINALIZED — all items checked, stock already accounted for in initial seed
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: tyrePlus.id, invoiceNumber: 'TP-24-09887', internalNumber: nextPI(),
      status: 'FINALIZED', issueDate: daysAgo(35), receivedDate: daysAgo(33), createdById: admin.id,
      subtotal: D(4480), totalAmount: D(4480),
      notes: 'Monthly tyre restock — Michelin + Continental',
      items: {
        create: [
          { stockItemId: stockMap['TYR-MICH-18565R15'].id, itemCode: 'TYR-MICH-18565R15', brandName: 'Michelin', description: 'Michelin Primacy 4 185/65R15', quantity: 8, unitPrice: D(220), total: D(1760), dotCode: '2524', isChecked: true, sortOrder: 0 },
          { stockItemId: stockMap['TYR-CONT-22545R18'].id, itemCode: 'TYR-CONT-22545R18', brandName: 'Continental', description: 'Continental MC6 225/45R18', quantity: 5, unitPrice: D(540), total: D(2700), dotCode: '4924', isChecked: true, sortOrder: 1 },
          { description: 'Freight & handling', quantity: 1, unitPrice: D(20), total: D(20), isChecked: true, sortOrder: 2 },
        ],
      },
      attachments: {
        create: [
          { fileName: 'TP-24-09887-invoice.pdf', fileUrl: '/uploads/seed/tp-09887.pdf', fileSize: 245120, mimeType: 'application/pdf' },
          { fileName: 'TP-24-09887-DO.jpg', fileUrl: '/uploads/seed/tp-09887-do.jpg', fileSize: 812340, mimeType: 'image/jpeg' },
        ],
      },
    },
  })

  // VERIFIED — all items checked, pending final stock post
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: petronas.id, invoiceNumber: 'PET-2026-03-4451', internalNumber: nextPI(),
      status: 'VERIFIED', issueDate: daysAgo(10), receivedDate: daysAgo(9), createdById: admin.id,
      subtotal: D(4900), totalAmount: D(4900),
      notes: 'Syntium bulk order',
      items: {
        create: [
          { stockItemId: stockMap['OIL-PET-10W40-4L'].id, itemCode: 'OIL-PET-10W40-4L', brandName: 'Petronas Syntium', description: 'Petronas Syntium 3000 AV 10W-40 4L', quantity: 50, unitPrice: D(98), total: D(4900), isChecked: true, sortOrder: 0 },
        ],
      },
      attachments: { create: [{ fileName: 'petronas-inv.pdf', fileUrl: '/uploads/seed/petronas-4451.pdf', fileSize: 180000, mimeType: 'application/pdf' }] },
    },
  })

  // ON_HOLD — partial item-check in progress
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: brembo.id, invoiceNumber: 'BRM-INV-887', internalNumber: nextPI(),
      status: 'ON_HOLD', issueDate: daysAgo(3), createdById: admin.id,
      subtotal: D(3600), totalAmount: D(3600),
      notes: 'Pending warehouse check',
      items: {
        create: [
          { stockItemId: stockMap['BRK-BRE-PAD-FT-CIVIC'].id, itemCode: 'BRK-BRE-PAD-FT-CIVIC', brandName: 'Brembo', description: 'Brembo Front Brake Pads Civic FD', quantity: 10, unitPrice: D(140), total: D(1400), isChecked: true, sortOrder: 0 },
          { stockItemId: stockMap['BRK-BOS-DSC-FT-320'].id, itemCode: 'BRK-BOS-DSC-FT-320', brandName: 'Bosch', description: 'Bosch Front Brake Disc BMW 320i', quantity: 4, unitPrice: D(320), total: D(1280), isChecked: false, sortOrder: 1 },
          { description: 'Assorted brake fluid DOT 4 (6 x 500ml)', quantity: 6, unitPrice: D(45), total: D(270), isChecked: false, sortOrder: 2 },
          { description: 'Shipping', quantity: 1, unitPrice: D(650), total: D(650), isChecked: false, sortOrder: 3 },
        ],
      },
      attachments: { create: [{ fileName: 'brembo-inv-887.jpg', fileUrl: '/uploads/seed/brembo-887.jpg', fileSize: 642100, mimeType: 'image/jpeg' }] },
    },
  })

  // Another FINALIZED — castrol + partial payment
  const pi4 = await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: castrol.id, invoiceNumber: 'CAS-INV-72344', internalNumber: nextPI(),
      status: 'FINALIZED', issueDate: daysAgo(20), receivedDate: daysAgo(18), createdById: admin.id,
      subtotal: D(5400), totalAmount: D(5400), paidAmount: D(3000),
      notes: 'Castrol Edge 5W-40 — 60 day terms',
      items: {
        create: [
          { stockItemId: stockMap['OIL-CAS-5W40-4L'].id, itemCode: 'OIL-CAS-5W40-4L', brandName: 'Castrol', description: 'Castrol Edge 5W-40 Fully Synthetic 4L', quantity: 40, unitPrice: D(135), total: D(5400), isChecked: true, sortOrder: 0 },
        ],
      },
      attachments: { create: [{ fileName: 'castrol-72344.pdf', fileUrl: '/uploads/seed/castrol-72344.pdf', fileSize: 212000, mimeType: 'application/pdf' }] },
    },
  })

  // FINALIZED — KYB suspension
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: kyb.id, invoiceNumber: 'KYB-INV-11229', internalNumber: nextPI(),
      status: 'FINALIZED', issueDate: daysAgo(25), receivedDate: daysAgo(23), createdById: admin.id,
      subtotal: D(3200), totalAmount: D(3200), paidAmount: D(3200),
      notes: 'Suspension restock',
      items: {
        create: [
          { stockItemId: stockMap['SUS-KYB-ABS-CIVIC-FT'].id, itemCode: 'SUS-KYB-ABS-CIVIC-FT', brandName: 'KYB', description: 'KYB Excel-G Front Absorber Civic FD (Pair)', quantity: 4, unitPrice: D(360), total: D(1440), isChecked: true, sortOrder: 0 },
          { stockItemId: stockMap['SUS-BIL-B6-320-RR'].id, itemCode: 'SUS-BIL-B6-320-RR', brandName: 'Bilstein', description: 'Bilstein B6 Rear Shock BMW 320i (Pair)', quantity: 2, unitPrice: D(880), total: D(1760), isChecked: true, sortOrder: 1 },
        ],
      },
    },
  })

  // CANCELLED
  await prisma.purchaseInvoice.create({
    data: {
      branchId: branch.id, supplierId: amaron.id, invoiceNumber: 'AMA-772', internalNumber: nextPI(),
      status: 'CANCELLED', issueDate: daysAgo(15), createdById: admin.id,
      subtotal: D(1800), totalAmount: D(1800),
      notes: 'Cancelled — duplicate order',
      items: {
        create: [
          { stockItemId: stockMap['BAT-AMA-NS60L'].id, itemCode: 'BAT-AMA-NS60L', brandName: 'Amaron', description: 'Amaron Hi-Life NS60L 45Ah', quantity: 10, unitPrice: D(180), total: D(1800), isChecked: false, sortOrder: 0 },
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
      branchId: branch.id, supplierId: tyrePlus.id, paymentNumber: nextPay(),
      amount: D(4480), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'TXN-998812',
      bankName: 'Maybank', paymentDate: daysAgo(30), createdById: admin.id,
      notes: 'Full payment — TP-24-09887',
    },
  })

  await prisma.supplierPayment.create({
    data: {
      branchId: branch.id, supplierId: castrol.id, purchaseInvoiceId: pi4.id, paymentNumber: nextPay(),
      amount: D(3000), paymentMethod: 'CHEQUE', referenceNumber: 'CHQ-445122',
      bankName: 'Public Bank', paymentDate: daysAgo(15), createdById: admin.id,
      notes: 'Partial payment — CAS-INV-72344',
    },
  })

  await prisma.supplierPayment.create({
    data: {
      branchId: branch.id, supplierId: kyb.id, paymentNumber: nextPay(),
      amount: D(3200), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'TXN-1005118',
      bankName: 'OCBC', paymentDate: daysAgo(22), createdById: admin.id,
    },
  })

  await prisma.supplierPayment.create({
    data: {
      branchId: branch.id, supplierId: petronas.id, paymentNumber: nextPay(),
      amount: D(2000), paymentMethod: 'BANK_TRANSFER', referenceNumber: 'TXN-1006221',
      bankName: 'CIMB', paymentDate: daysAgo(5), createdById: admin.id,
      notes: 'Deposit — PET-2026-03-4451',
    },
  })

  console.log('✅ Demo seed complete!')

  // Summary
  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    vehicles: await prisma.vehicle.count(),
    stockItems: await prisma.stockItem.count(),
    tyreDots: await prisma.tyreDOT.count(),
    documents: await prisma.document.count(),
    documentItems: await prisma.documentItem.count(),
    payments: await prisma.payment.count(),
    suppliers: await prisma.supplier.count(),
    purchaseInvoices: await prisma.purchaseInvoice.count(),
    purchaseItems: await prisma.purchaseInvoiceItem.count(),
    purchaseAttachments: await prisma.purchaseAttachment.count(),
    supplierPayments: await prisma.supplierPayment.count(),
    stockHistory: await prisma.stockHistory.count(),
  }
  console.table(counts)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
