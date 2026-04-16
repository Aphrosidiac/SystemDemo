import { FastifyInstance } from 'fastify'
import { listBrands, createBrand, updateBrand, deleteBrand } from './brands.controller.js'

export default async function brandRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/', listBrands)
  fastify.post('/', createBrand)
  fastify.put('/:id', updateBrand)
  fastify.delete('/:id', deleteBrand)
}
