import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Delete test customers (from API tests)
  const deadCustomers = await prisma.customer.findMany({
    where: { OR: [{ name: 'q' }, { name: 'John Doe' }, { name: '' }] },
    include: { documents: true, vehicles: true },
  })
  for (const c of deadCustomers) {
    console.log(`Removing customer "${c.name}" (${c.documents.length} docs, ${c.vehicles.length} vehicles)`)
    // cascade: vehicles auto-delete; documents don't cascade so null-out customerId
    await prisma.document.updateMany({ where: { customerId: c.id }, data: { customerId: null, vehicleId: null } })
    await prisma.vehicle.deleteMany({ where: { customerId: c.id } })
    await prisma.customer.delete({ where: { id: c.id } })
  }

  // Delete test staff
  const deadUsers = await prisma.user.findMany({
    where: { email: { in: ['worker1@test.local'] } },
    include: { createdDocuments: true, foremanDocuments: true, createdPayments: true, stockHistory: true },
  })
  for (const u of deadUsers) {
    if (u.createdDocuments.length || u.foremanDocuments.length || u.createdPayments.length || u.stockHistory.length) {
      console.log(`Skipping user ${u.email} — has relations`)
      continue
    }
    console.log(`Removing test user ${u.email}`)
    await prisma.user.delete({ where: { id: u.id } })
  }

  // Delete test supplier "Tyre Supplier Co" (from API tests) if empty
  const testSuppliers = await prisma.supplier.findMany({
    where: { companyName: 'Tyre Supplier Co' },
    include: { purchaseInvoices: true, payments: true },
  })
  for (const s of testSuppliers) {
    await prisma.supplierPayment.deleteMany({ where: { supplierId: s.id } })
    // delete PIs + items + attachments for this supplier
    const pis = await prisma.purchaseInvoice.findMany({ where: { supplierId: s.id } })
    for (const pi of pis) await prisma.purchaseInvoice.delete({ where: { id: pi.id } })
    await prisma.supplier.delete({ where: { id: s.id } })
    console.log(`Removed test supplier ${s.companyName}`)
  }

  // Delete orphaned PI26-0001 (the test one from API)
  const testPIs = await prisma.purchaseInvoice.findMany({
    where: { invoiceNumber: 'INV-001' },
  })
  for (const p of testPIs) {
    await prisma.purchaseInvoice.delete({ where: { id: p.id } })
    console.log(`Removed test PI ${p.internalNumber}`)
  }

  // Set admin jobTitle
  await prisma.user.updateMany({
    where: { email: 'admin@demo.local' },
    data: { jobTitle: 'System Administrator', phone: '+60 3-1234 5678' },
  })
  console.log('Admin jobTitle set')

  // Fix any invoice with no foreman — assign Ahmad
  const ahmad = await prisma.user.findFirst({ where: { email: 'ahmad@demo.local' } })
  if (ahmad) {
    const orphanDocs = await prisma.document.findMany({
      where: { foremanId: null, documentType: 'INVOICE' },
    })
    for (const d of orphanDocs) {
      await prisma.document.update({ where: { id: d.id }, data: { foremanId: ahmad.id } })
      console.log(`Assigned foreman to ${d.documentNumber}`)
    }
  }

  console.log('Cleanup complete')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
