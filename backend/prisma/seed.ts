import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'DEMO-01' },
    update: {},
    create: {
      name: 'SYSTEMDEMO SAMPLE BRANCH',
      code: 'DEMO-01',
      address: 'Suite 12-3, Demo Plaza, Jalan Contoh 1, 50000 Kuala Lumpur',
      phone: '+60 3-1234 5678',
      email: 'hello@demo.local',
      ssmNumber: '202600000001 / 0000001-A',
      bankName: 'DEMO BANK',
      bankAccount: '0000 0000 0000',
    },
  })
  console.log(`Branch created: ${branch.name}`)

  // Create admin user
  const passwordHash = await bcryptjs.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@demo.local' },
    update: {},
    create: {
      branchId: branch.id,
      email: process.env.ADMIN_EMAIL || 'admin@demo.local',
      passwordHash,
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'ADMIN',
    },
  })
  console.log(`Admin user created: ${admin.email}`)

  // Create default stock categories
  const categories = [
    { name: 'Tyres', code: 'TYR' },
    { name: 'Engine Oil', code: 'OIL' },
    { name: 'Brake Parts', code: 'BRK' },
    { name: 'Filters', code: 'FLT' },
    { name: 'Battery', code: 'BAT' },
    { name: 'Suspension', code: 'SUS' },
    { name: 'Alignment & Balancing', code: 'ALN' },
    { name: 'Air-Con Parts', code: 'AC' },
    { name: 'Others', code: 'OTH' },
  ]

  for (const cat of categories) {
    await prisma.stockCategory.upsert({
      where: { branchId_name: { branchId: branch.id, name: cat.name } },
      update: {},
      create: {
        branchId: branch.id,
        name: cat.name,
        code: cat.code,
      },
    })
  }
  console.log(`${categories.length} categories created`)

  // Create default document settings
  const docTypes = [
    { type: 'QUOTATION' as const, prefix: 'QT', label: 'Quotation' },
    { type: 'INVOICE' as const, prefix: 'INV', label: 'Invoice' },
    { type: 'RECEIPT' as const, prefix: 'RCP', label: 'Receipt' },
    { type: 'DELIVERY_ORDER' as const, prefix: 'DO', label: 'Delivery Order' },
  ]

  for (const doc of docTypes) {
    await prisma.documentSetting.upsert({
      where: { branchId_documentType: { branchId: branch.id, documentType: doc.type } },
      update: {},
      create: {
        branchId: branch.id,
        documentType: doc.type,
        prefix: doc.prefix,
        documentLabel: doc.label,
        templateColor: '#6366F1',
        defaultNotes: doc.type === 'INVOICE'
          ? '1. ALL GOODS SOLD ARE NOT RETURNABLE. RM50.00 (1PC) WILL BE CHARGED FOR CANCELLATION.\n2. ALL CHEQUES SHOULD BE CROSSED AND MADE PAYABLE TO: SYSTEMDEMO SAMPLE BRANCH'
          : undefined,
        defaultTerms: doc.type === 'QUOTATION'
          ? 'This quotation is valid for 30 days from the date of issue.'
          : undefined,
      },
    })
  }
  console.log(`${docTypes.length} document settings created`)

  // Create default payment terms
  const paymentTerms = [
    { name: 'Due on Receipt', days: 0, isDefault: true },
    { name: 'Net 7', days: 7 },
    { name: 'Net 14', days: 14 },
    { name: 'Net 30', days: 30 },
  ]

  for (const term of paymentTerms) {
    const existing = await prisma.paymentTerm.findFirst({
      where: { branchId: branch.id, name: term.name },
    })
    if (!existing) {
      await prisma.paymentTerm.create({
        data: {
          branchId: branch.id,
          name: term.name,
          days: term.days,
          isDefault: term.isDefault || false,
        },
      })
    }
  }
  console.log(`${paymentTerms.length} payment terms created`)

  // Create brands under categories
  const categoryBrands: Record<string, string[]> = {
    'Tyres': ['Michelin', 'Continental', 'Bridgestone', 'Goodyear', 'Pirelli', 'Toyo', 'Kumho', 'Dunlop'],
    'Engine Oil': ['Castrol', 'Shell Helix', 'Petronas Syntium', 'Motul', 'Liqui Moly', 'Mobil 1'],
    'Brake Parts': ['Brembo', 'TRW', 'Bosch', 'Bendix'],
    'Filters': ['Bosch', 'Mann-Filter', 'Denso', 'K&N'],
    'Battery': ['Amaron', 'Century', 'Varta', 'Bosch'],
    'Suspension': ['KYB', 'Bilstein', 'Monroe'],
    'Air-Con Parts': ['Denso', 'Valeo', 'Sanden'],
  }

  for (const [catName, brandNames] of Object.entries(categoryBrands)) {
    const category = await prisma.stockCategory.findFirst({
      where: { branchId: branch.id, name: catName },
    })
    if (!category) continue

    for (const brandName of brandNames) {
      const existing = await prisma.brand.findFirst({
        where: { branchId: branch.id, categoryId: category.id, name: brandName },
      })
      if (!existing) {
        await prisma.brand.create({
          data: {
            branchId: branch.id,
            categoryId: category.id,
            name: brandName,
          },
        })
      }
    }
  }
  console.log(`Brands created across ${Object.keys(categoryBrands).length} categories`)

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
