import { FastifyInstance } from 'fastify'
import { listDOTs, addDOTBatch, adjustDOTBatch, getTyreStock } from './tyre-dots.controller.js'

export default async function tyreDotRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/tyre-stock', getTyreStock)
  fastify.get('/stock/:id/dots', listDOTs)
  fastify.post('/stock/:id/dots', addDOTBatch)
  fastify.patch('/stock/:id/dots/:dotId', adjustDOTBatch)
}
