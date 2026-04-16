import { FastifyRequest, FastifyReply } from 'fastify'

export async function listBrands(
  request: FastifyRequest<{ Querystring: { categoryId?: string } }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const { categoryId } = request.query as any

  const brands = await request.server.prisma.brand.findMany({
    where: {
      branchId,
      isActive: true,
      ...(categoryId && { categoryId }),
    },
    include: { _count: { select: { items: true } }, category: { select: { id: true, name: true } } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  return reply.send({ success: true, data: brands })
}

export async function createBrand(
  request: FastifyRequest<{ Body: { categoryId: string; name: string; code?: string; logoUrl?: string; sortOrder?: number } }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const { categoryId, name, code, logoUrl, sortOrder } = request.body

  if (!categoryId || !name?.trim()) {
    return reply.status(400).send({ success: false, message: 'Category and name are required' })
  }

  const brand = await request.server.prisma.brand.create({
    data: {
      branchId,
      categoryId,
      name: name.trim(),
      code: code?.trim() || null,
      logoUrl: logoUrl?.trim() || null,
      sortOrder: sortOrder ?? 0,
    },
    include: { category: { select: { id: true, name: true } } },
  })

  return reply.status(201).send({ success: true, data: brand })
}

export async function updateBrand(
  request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; code?: string; logoUrl?: string; sortOrder?: number; isActive?: boolean } }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const { id } = request.params
  const { name, code, logoUrl, sortOrder, isActive } = request.body

  const existing = await request.server.prisma.brand.findFirst({ where: { id, branchId } })
  if (!existing) {
    return reply.status(404).send({ success: false, message: 'Brand not found' })
  }

  const brand = await request.server.prisma.brand.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(code !== undefined && { code: code?.trim() || null }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl?.trim() || null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { category: { select: { id: true, name: true } } },
  })

  return reply.send({ success: true, data: brand })
}

export async function deleteBrand(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { branchId } = request.user
  const { id } = request.params

  const existing = await request.server.prisma.brand.findFirst({ where: { id, branchId } })
  if (!existing) {
    return reply.status(404).send({ success: false, message: 'Brand not found' })
  }

  const itemCount = await request.server.prisma.stockItem.count({ where: { brandId: id } })
  if (itemCount > 0) {
    return reply.status(400).send({ success: false, message: `Cannot delete brand with ${itemCount} items` })
  }

  await request.server.prisma.brand.delete({ where: { id } })
  return reply.send({ success: true, message: 'Brand deleted' })
}
