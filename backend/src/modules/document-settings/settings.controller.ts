import { FastifyRequest, FastifyReply } from 'fastify'

export async function listSettings(request: FastifyRequest, reply: FastifyReply) {
  const { branchId } = request.user
  const settings = await request.server.prisma.documentSetting.findMany({
    where: { branchId },
    orderBy: { documentType: 'asc' },
  })
  return reply.send({ success: true, data: settings })
}

export async function updateSettings(
  request: FastifyRequest<{ Params: { type: string }; Body: Record<string, any> }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const { type } = request.params
  const body = request.body

  const existing = await request.server.prisma.documentSetting.findUnique({
    where: { branchId_documentType: { branchId, documentType: type as any } },
  })

  if (!existing) {
    return reply.status(404).send({ success: false, message: 'Setting not found' })
  }

  const setting = await request.server.prisma.documentSetting.update({
    where: { id: existing.id },
    data: {
      ...(body.prefix !== undefined && { prefix: body.prefix }),
      ...(body.nextNumber !== undefined && { nextNumber: body.nextNumber }),
      ...(body.paddingLength !== undefined && { paddingLength: body.paddingLength }),
      ...(body.includeYear !== undefined && { includeYear: body.includeYear }),
      ...(body.yearFormat !== undefined && { yearFormat: body.yearFormat }),
      ...(body.separator !== undefined && { separator: body.separator }),
      ...(body.template !== undefined && { template: body.template }),
      ...(body.templateColor !== undefined && { templateColor: body.templateColor }),
      ...(body.documentLabel !== undefined && { documentLabel: body.documentLabel }),
      ...(body.footerNotes !== undefined && { footerNotes: body.footerNotes }),
      ...(body.documentSize !== undefined && { documentSize: body.documentSize }),
      ...(body.logoScale !== undefined && { logoScale: body.logoScale }),
      ...(body.defaultNotes !== undefined && { defaultNotes: body.defaultNotes }),
      ...(body.defaultTerms !== undefined && { defaultTerms: body.defaultTerms }),
      ...(body.defaultPaymentTermDays !== undefined && { defaultPaymentTermDays: body.defaultPaymentTermDays }),
    },
  })

  return reply.send({ success: true, data: setting })
}
