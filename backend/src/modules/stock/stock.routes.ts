import { FastifyInstance } from 'fastify'
import { listStock, getStock, createStock, updateStock, deleteStock, adjustStock, getStockHistory, getAllStockHistory, listHeldStock } from './stock.controller.js'

export default async function stockRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/', listStock)
  fastify.get('/held', listHeldStock)
  fastify.get('/history', getAllStockHistory)
  fastify.get('/:id', getStock)
  fastify.post('/', createStock)
  fastify.put('/:id', updateStock)
  fastify.delete('/:id', deleteStock)
  fastify.post('/:id/adjust', adjustStock)
  fastify.get('/:id/history', getStockHistory)
}
