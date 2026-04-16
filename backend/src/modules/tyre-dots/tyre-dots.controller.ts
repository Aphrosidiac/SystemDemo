import { FastifyRequest, FastifyReply } from 'fastify'
import { recordStockHistory } from '../stock/stock.history.js'

// ─── LIST DOT BATCHES ─────────────────────────────────────
export async function listDOTs(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const stockItemId = request.params.id

  const stockItem = await request.server.prisma.stockItem.findFirst({
    where: { id: stockItemId, branchId },
  })
  if (!stockItem) {
    return reply.status(404).send({ success: false, message: 'Stock item not found' })
  }

  const dots = await request.server.prisma.tyreDOT.findMany({
    where: { stockItemId },
    orderBy: { dotCode: 'asc' },
  })

  return reply.send({ success: true, data: dots })
}

// ─── ADD DOT BATCH ────────────────────────────────────────
export async function addDOTBatch(
  request: FastifyRequest<{
    Params: { id: string }
    Body: { dotCode: string; quantity: number }
  }>,
  reply: FastifyReply
) {
  const { branchId, userId } = request.user
  const stockItemId = request.params.id
  const { dotCode, quantity } = request.body

  // Validate dotCode is 4 digits (WWYY format)
  if (!dotCode || !/^\d{4}$/.test(dotCode)) {
    return reply.status(400).send({ success: false, message: 'DOT code must be 4 digits in WWYY format' })
  }

  if (!quantity || quantity <= 0) {
    return reply.status(400).send({ success: false, message: 'Quantity must be positive' })
  }

  const stockItem = await request.server.prisma.stockItem.findFirst({
    where: { id: stockItemId, branchId },
  })
  if (!stockItem) {
    return reply.status(404).send({ success: false, message: 'Stock item not found' })
  }

  // Upsert DOT batch
  const dot = await request.server.prisma.tyreDOT.upsert({
    where: { stockItemId_dotCode: { stockItemId, dotCode } },
    create: { stockItemId, dotCode, quantity },
    update: { quantity: { increment: quantity } },
  })

  // Update parent StockItem quantity to sum of all DOT batches
  const aggregate = await request.server.prisma.tyreDOT.aggregate({
    where: { stockItemId },
    _sum: { quantity: true },
  })
  const totalQty = aggregate._sum.quantity || 0

  const previousQty = stockItem.quantity
  await request.server.prisma.stockItem.update({
    where: { id: stockItemId },
    data: { quantity: totalQty },
  })

  // Record stock history
  await recordStockHistory({
    prisma: request.server.prisma,
    branchId,
    stockItemId,
    type: 'IN',
    quantity,
    previousQty,
    newQty: totalQty,
    reason: `DOT batch ${dotCode} added`,
    createdById: userId,
  })

  return reply.status(201).send({ success: true, data: dot })
}

// ─── ADJUST DOT BATCH ────────────────────────────────────
export async function adjustDOTBatch(
  request: FastifyRequest<{
    Params: { id: string; dotId: string }
    Body: { type: 'add' | 'remove'; quantity: number; reason: string }
  }>,
  reply: FastifyReply
) {
  const { branchId, userId } = request.user
  const { dotId } = request.params
  const { type, quantity, reason } = request.body

  if (!quantity || quantity <= 0) {
    return reply.status(400).send({ success: false, message: 'Quantity must be positive' })
  }
  if (!reason?.trim()) {
    return reply.status(400).send({ success: false, message: 'Reason is required' })
  }

  const dot = await request.server.prisma.tyreDOT.findUnique({
    where: { id: dotId },
    include: { stockItem: true },
  })
  if (!dot || dot.stockItem.branchId !== branchId) {
    return reply.status(404).send({ success: false, message: 'DOT batch not found' })
  }

  if (type === 'remove' && dot.quantity < quantity) {
    return reply.status(400).send({
      success: false,
      message: `Insufficient DOT batch stock: have ${dot.quantity}, trying to remove ${quantity}`,
    })
  }

  const newDotQty = type === 'add' ? dot.quantity + quantity : dot.quantity - quantity

  const updatedDot = await request.server.prisma.tyreDOT.update({
    where: { id: dotId },
    data: { quantity: newDotQty },
  })

  // Update parent StockItem quantity to sum of all DOT batches
  const stockItemId = dot.stockItemId
  const aggregate = await request.server.prisma.tyreDOT.aggregate({
    where: { stockItemId },
    _sum: { quantity: true },
  })
  const totalQty = aggregate._sum.quantity || 0
  const previousQty = dot.stockItem.quantity

  await request.server.prisma.stockItem.update({
    where: { id: stockItemId },
    data: { quantity: totalQty },
  })

  // Record stock history
  await recordStockHistory({
    prisma: request.server.prisma,
    branchId,
    stockItemId,
    type: type === 'add' ? 'IN' : 'OUT',
    quantity,
    previousQty,
    newQty: totalQty,
    reason: reason.trim(),
    createdById: userId,
  })

  return reply.send({ success: true, data: updatedDot })
}

// ─── TYRE STOCK (WORKER DASHBOARD) ───────────────────────
export async function getTyreStock(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { branchId } = request.user

  const items = await request.server.prisma.stockItem.findMany({
    where: {
      branchId,
      isTyre: true,
      isActive: true,
    },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      tyreDots: {
        where: { quantity: { gt: 0 } },
        orderBy: { dotCode: 'asc' },
        select: { id: true, dotCode: true, quantity: true },
      },
    },
    orderBy: { description: 'asc' },
  })

  // Group by tyreSize
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const size = item.tyreSize || 'Unknown'
    if (!grouped.has(size)) {
      grouped.set(size, [])
    }
    grouped.get(size)!.push(item)
  }

  const data = Array.from(grouped.entries()).map(([tyreSize, sizeItems]) => ({
    tyreSize,
    items: sizeItems.map((item) => ({
      id: item.id,
      itemCode: item.itemCode,
      description: item.description,
      sellPrice: item.sellPrice,
      costPrice: item.costPrice,
      brand: item.brand,
      category: item.category,
      tyreDots: item.tyreDots,
      quantity: item.quantity,
    })),
  }))

  return reply.send({ success: true, data })
}
