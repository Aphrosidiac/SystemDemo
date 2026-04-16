import { FastifyPluginAsync } from 'fastify'
import { getJobs, setWorkshopStatus } from './shop-display.controller.js'

const shopDisplayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.get('/jobs', getJobs)
  fastify.patch('/documents/:id/workshop-status', setWorkshopStatus)
}

export default shopDisplayRoutes
