import { FastifyRequest, FastifyReply } from 'fastify'

export async function getStats(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const cacheKey = `dashboard:stats:${branchId}`

  // Check cache first (30s TTL — fresh enough for dashboard)
  const cached = await request.server.cache.get(cacheKey)
  if (cached) return reply.send({ success: true, data: cached })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    totalItems, totalCustomers,
    invoicesToday, invoicesMonth,
    outstandingInvoices, overdueInvoices,
    pendingQuotations, draftDocuments,
    docCounts,
  ] = await Promise.all([
    request.server.prisma.stockItem.count({ where: { branchId, isActive: true } }),
    request.server.prisma.customer.count({ where: { branchId } }),
    request.server.prisma.document.findMany({
      where: { branchId, documentType: 'INVOICE', status: { notIn: ['VOID', 'CANCELLED', 'DRAFT'] }, issueDate: { gte: today } },
    }),
    request.server.prisma.document.findMany({
      where: { branchId, documentType: 'INVOICE', status: { notIn: ['VOID', 'CANCELLED', 'DRAFT'] }, issueDate: { gte: monthStart } },
    }),
    request.server.prisma.document.count({
      where: { branchId, documentType: 'INVOICE', status: { in: ['OUTSTANDING', 'PARTIAL'] } },
    }),
    request.server.prisma.document.count({
      where: { branchId, documentType: 'INVOICE', status: { in: ['OUTSTANDING', 'PARTIAL'] }, dueDate: { lt: today } },
    }),
    request.server.prisma.document.count({
      where: { branchId, documentType: 'QUOTATION', status: { in: ['PENDING', 'APPROVED', 'SENT'] } },
    }),
    request.server.prisma.document.count({
      where: { branchId, status: 'DRAFT' },
    }),
    // Count by document type
    request.server.prisma.document.groupBy({
      by: ['documentType'],
      where: { branchId, status: { notIn: ['VOID', 'CANCELLED'] } },
      _count: true,
    }),
  ])

  const revenueToday = invoicesToday.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0)
  const revenueThisMonth = invoicesMonth.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0)

  const documentBreakdown = Object.fromEntries(
    docCounts.map((d) => [d.documentType, d._count])
  )

  const data = {
    totalItems,
    totalCustomers,
    invoicesToday: invoicesToday.length,
    invoicesThisMonth: invoicesMonth.length,
    revenueToday,
    revenueThisMonth,
    outstandingInvoices,
    overdueInvoices,
    pendingQuotations,
    draftDocuments,
    documentBreakdown,
  }

  await request.server.cache.set(cacheKey, data, 30)
  return reply.send({ success: true, data })
}

export async function getRevenueChart(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const cacheKey = `dashboard:revenue:${branchId}`

  const cached = await request.server.cache.get(cacheKey)
  if (cached) return reply.send({ success: true, data: cached })

  // Last 7 days revenue
  const days: { date: string; revenue: number; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const invoices = await request.server.prisma.document.findMany({
      where: {
        branchId,
        documentType: 'INVOICE',
        status: { notIn: ['VOID', 'CANCELLED', 'DRAFT'] },
        issueDate: { gte: date, lt: nextDay },
      },
      select: { totalAmount: true },
    })

    days.push({
      date: date.toISOString().split('T')[0],
      revenue: invoices.reduce((sum, inv) => sum + inv.totalAmount.toNumber(), 0),
      count: invoices.length,
    })
  }

  await request.server.cache.set(cacheKey, days, 60)
  return reply.send({ success: true, data: days })
}

export async function getLowStock(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const cacheKey = `dashboard:lowstock:${branchId}`

  const cached = await request.server.cache.get(cacheKey)
  if (cached) return reply.send({ success: true, data: cached })

  const items = await request.server.prisma.$queryRaw`
    SELECT si.*, sc.name as "categoryName"
    FROM stock_items si
    LEFT JOIN stock_categories sc ON si."categoryId" = sc.id
    WHERE si."branchId" = ${branchId}
    AND si."isActive" = true
    AND si.quantity <= si."minStock"
    ORDER BY si.quantity ASC
    LIMIT 20
  `

  await request.server.cache.set(cacheKey, items, 60)
  return reply.send({ success: true, data: items })
}

export async function getRecentInvoices(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user

  const documents = await request.server.prisma.document.findMany({
    where: { branchId, documentType: 'INVOICE' },
    include: { createdBy: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return reply.send({ success: true, data: documents })
}

export async function getActionItems(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [overdue, pendingQuotations, drafts] = await Promise.all([
    request.server.prisma.document.findMany({
      where: { branchId, documentType: 'INVOICE', status: { in: ['OUTSTANDING', 'PARTIAL'] }, dueDate: { lt: today } },
      select: { id: true, documentNumber: true, customerName: true, totalAmount: true, paidAmount: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    request.server.prisma.document.findMany({
      where: { branchId, documentType: 'QUOTATION', status: { in: ['PENDING', 'APPROVED', 'SENT'] } },
      select: { id: true, documentNumber: true, customerName: true, totalAmount: true, status: true, issueDate: true },
      orderBy: { issueDate: 'asc' },
      take: 10,
    }),
    request.server.prisma.document.findMany({
      where: { branchId, status: 'DRAFT' },
      select: { id: true, documentNumber: true, documentType: true, customerName: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return reply.send({ success: true, data: { overdue, pendingQuotations, drafts } })
}

export async function getRecentActivity(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user

  // Get recent stock history + recent documents + recent payments as a combined feed
  const [stockHistory, recentDocs, recentPayments] = await Promise.all([
    request.server.prisma.stockHistory.findMany({
      where: { branchId },
      include: { stockItem: { select: { itemCode: true } }, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    request.server.prisma.document.findMany({
      where: { branchId },
      select: { id: true, documentNumber: true, documentType: true, status: true, customerName: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    request.server.prisma.payment.findMany({
      where: { document: { branchId } },
      include: { document: { select: { documentNumber: true } }, createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  // Merge and sort by date
  const activities = [
    ...stockHistory.map((h) => ({
      type: 'stock' as const,
      description: `${h.type === 'IN' ? '+' : '-'}${h.quantity} ${h.stockItem.itemCode} — ${h.reason}`,
      by: h.createdBy.name,
      date: h.createdAt,
    })),
    ...recentDocs.map((d) => ({
      type: 'document' as const,
      description: `${d.documentNumber} ${d.status}${d.customerName ? ` — ${d.customerName}` : ''}`,
      by: '',
      date: d.createdAt,
      link: `/app/documents/${d.id}`,
    })),
    ...recentPayments.map((p) => ({
      type: 'payment' as const,
      description: `RM ${p.amount.toNumber().toFixed(2)} received for ${p.document.documentNumber}`,
      by: p.createdBy.name,
      date: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  return reply.send({ success: true, data: activities })
}
