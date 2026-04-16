import { FastifyRequest, FastifyReply } from 'fastify'

// Returns today's active jobs: DRAFT + OUTSTANDING invoices, excluding READY/DONE workshop status,
// plus jobs marked READY in the last 24h so they stay visible on the board.
export async function getJobs(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const docs = await request.server.prisma.document.findMany({
    where: {
      branchId,
      documentType: 'INVOICE',
      OR: [
        { status: 'DRAFT' },
        { status: 'OUTSTANDING' },
        { workshopStatus: 'READY', workshopReadyAt: { gte: since } },
      ],
      NOT: { workshopStatus: 'DONE' },
    },
    select: {
      id: true,
      documentNumber: true,
      vehiclePlate: true,
      vehicleModel: true,
      vehicleColor: true,
      customerName: true,
      workshopStatus: true,
      workshopStartedAt: true,
      workshopReadyAt: true,
      createdAt: true,
      foreman: { select: { name: true } },
      items: { select: { description: true, quantity: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const jobs = docs.map((d) => {
    const elapsedMs =
      d.workshopStatus === 'READY' && d.workshopReadyAt
        ? d.workshopReadyAt.getTime() - d.createdAt.getTime()
        : d.workshopStatus === 'IN_PROGRESS' && d.workshopStartedAt
        ? Date.now() - d.workshopStartedAt.getTime()
        : Date.now() - d.createdAt.getTime()
    return {
      id: d.id,
      documentNumber: d.documentNumber,
      plate: d.vehiclePlate || '—',
      vehicle: [d.vehicleModel, d.vehicleColor].filter(Boolean).join(' — ') || '—',
      customer: d.customerName || 'Walk-in',
      services: d.items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.description}` : i.description)),
      foreman: d.foreman?.name || 'Unassigned',
      status:
        d.workshopStatus === 'READY' ? 'ready' : d.workshopStatus === 'IN_PROGRESS' ? 'progress' : 'waiting',
      elapsed: Math.max(0, Math.floor(elapsedMs / 60000)),
    }
  })

  return reply.send({ success: true, data: jobs })
}

export async function setWorkshopStatus(
  request: FastifyRequest<{ Params: { id: string }; Body: { workshopStatus: 'WAITING' | 'IN_PROGRESS' | 'READY' | 'DONE' } }>,
  reply: FastifyReply,
) {
  const { branchId } = request.user
  const { id } = request.params
  const { workshopStatus } = request.body

  const doc = await request.server.prisma.document.findFirst({ where: { id, branchId } })
  if (!doc) return reply.status(404).send({ success: false, message: 'Document not found' })

  const data: any = { workshopStatus }
  if (workshopStatus === 'IN_PROGRESS' && !doc.workshopStartedAt) data.workshopStartedAt = new Date()
  if (workshopStatus === 'READY') data.workshopReadyAt = new Date()

  const updated = await request.server.prisma.document.update({ where: { id }, data })
  return reply.send({ success: true, data: updated })
}
