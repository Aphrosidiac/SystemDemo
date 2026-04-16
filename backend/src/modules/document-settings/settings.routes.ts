import { FastifyInstance } from 'fastify'
import { listSettings, updateSettings } from './settings.controller.js'

export default async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.get('/', listSettings)
  fastify.put('/:type', updateSettings)
}
