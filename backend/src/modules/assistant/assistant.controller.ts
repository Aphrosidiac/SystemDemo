import { FastifyRequest, FastifyReply } from 'fastify'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const apiKey = process.env.ANTHROPIC_API_KEY
const client = apiKey ? new Anthropic({ apiKey }) : null

const SYSTEM_PROMPT = `You are Demo Assistant, an AI helper embedded inside the SystemDemo workshop management sample.

You help staff quickly answer questions about their data: documents (quotations, invoices, receipts, delivery orders), stock, customers, debtors, suppliers, purchase invoices, staff, and dashboard stats. Use the provided tools to look up live data before answering — never fabricate numbers, amounts, or names.

Guidelines:
- Malaysian Ringgit (RM) is the currency. Today's date context is passed with each user message.
- Be concise and direct. Lead with the answer (a number, a short list, a fact), then 1–2 sentences of context if helpful.
- When the user asks "how many X today/this week/this month", use the appropriate date filter in the tool.
- Format money as "RM 1,234.56". Format lists as compact markdown tables when more than 3 items.
- If a tool returns no rows, say so plainly ("No invoices created today.") — don't pad with fluff.
- Never execute writes — all tools are read-only. If the user asks to create/delete/modify data, explain that you can only read.
- Respect the caller's role. Tools already filter to the user's branch automatically.
`

const toolDefs: Anthropic.Messages.Tool[] = [
  {
    name: 'get_dashboard_stats',
    description: 'Get overall stats for the dashboard: total items, customers, invoices today/this month, revenue, outstanding invoices, overdue, pending quotations, drafts, document breakdown by type.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_documents',
    description: 'List documents (quotations, invoices, receipts, delivery orders) with optional filters. Returns up to 50 rows sorted by most recent.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['QUOTATION', 'INVOICE', 'RECEIPT', 'DELIVERY_ORDER'], description: 'Filter by document type' },
        status: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'SENT', 'OUTSTANDING', 'PARTIAL', 'PAID', 'OVERDUE', 'COMPLETED', 'CANCELLED', 'VOID'], description: 'Filter by status' },
        dateFrom: { type: 'string', description: 'ISO date YYYY-MM-DD — only include docs issued on/after this date' },
        dateTo: { type: 'string', description: 'ISO date YYYY-MM-DD — only include docs issued on/before this date' },
        customerName: { type: 'string', description: 'Partial match on customer name or company name' },
        limit: { type: 'integer', description: 'Max rows to return (default 20, max 50)' },
      },
    },
  },
  {
    name: 'list_payments',
    description: 'List customer payments (payment log). Returns payments with document number, amount, method, date.',
    input_schema: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        method: { type: 'string', enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'EWALLET', 'TNG', 'BOOST'] },
        limit: { type: 'integer', description: 'Max rows (default 20, max 50)' },
      },
    },
  },
  {
    name: 'list_debtors',
    description: 'List customers with outstanding/partial invoices and total amount owed.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_stock',
    description: 'List stock items with optional search and low-stock filter.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Partial match on itemCode or description' },
        lowStockOnly: { type: 'boolean', description: 'Only return items where quantity <= minStock' },
        tyresOnly: { type: 'boolean', description: 'Only return tyre items' },
        limit: { type: 'integer', description: 'Max rows (default 20, max 50)' },
      },
    },
  },
  {
    name: 'list_purchase_invoices',
    description: 'List purchase invoices from suppliers.',
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ON_HOLD', 'VERIFIED', 'FINALIZED', 'CANCELLED'] },
        supplierName: { type: 'string', description: 'Partial match on supplier company name' },
        limit: { type: 'integer', description: 'Max rows (default 20, max 50)' },
      },
    },
  },
  {
    name: 'list_suppliers',
    description: 'List suppliers with contact info.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Partial match on company name or contact name' },
      },
    },
  },
  {
    name: 'search_customers',
    description: 'Search customers by name, company, or vehicle plate.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term — matched against name, companyName, phone, or vehicle plate' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_staff',
    description: 'List staff members with their roles and job titles.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
]

type Ctx = { prisma: PrismaClient; branchId: string }

async function runTool(ctx: Ctx, name: string, input: any): Promise<string> {
  const { prisma, branchId } = ctx
  const clamp = (n: number | undefined, max = 50, def = 20) => Math.min(Math.max(n ?? def, 1), max)

  try {
    switch (name) {
      case 'get_dashboard_stats': {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const [totalItems, totalCustomers, invoicesToday, invoicesThisMonth, outstanding, overdue, pendingQt, drafts, breakdown] = await Promise.all([
          prisma.stockItem.count({ where: { branchId } }),
          prisma.customer.count({ where: { branchId } }),
          prisma.document.count({ where: { branchId, documentType: 'INVOICE', issueDate: { gte: startOfToday } } }),
          prisma.document.count({ where: { branchId, documentType: 'INVOICE', issueDate: { gte: startOfMonth } } }),
          prisma.document.count({ where: { branchId, documentType: 'INVOICE', status: { in: ['OUTSTANDING', 'PARTIAL'] } } }),
          prisma.document.count({ where: { branchId, documentType: 'INVOICE', status: 'OVERDUE' } }),
          prisma.document.count({ where: { branchId, documentType: 'QUOTATION', status: { in: ['SENT', 'APPROVED'] } } }),
          prisma.document.count({ where: { branchId, status: 'DRAFT' } }),
          prisma.document.groupBy({ by: ['documentType'], where: { branchId }, _count: true }),
        ])
        const revenueAgg = await prisma.document.aggregate({
          where: { branchId, documentType: 'INVOICE', status: 'PAID', issueDate: { gte: startOfMonth } },
          _sum: { totalAmount: true },
        })
        return JSON.stringify({
          totalItems, totalCustomers, invoicesToday, invoicesThisMonth,
          revenueThisMonth: Number(revenueAgg._sum.totalAmount ?? 0),
          outstandingInvoices: outstanding, overdueInvoices: overdue,
          pendingQuotations: pendingQt, draftDocuments: drafts,
          documentBreakdown: Object.fromEntries(breakdown.map(b => [b.documentType, b._count])),
        })
      }
      case 'list_documents': {
        const where: any = { branchId }
        if (input.type) where.documentType = input.type
        if (input.status) where.status = input.status
        if (input.dateFrom || input.dateTo) {
          where.issueDate = {}
          if (input.dateFrom) where.issueDate.gte = new Date(input.dateFrom)
          if (input.dateTo) where.issueDate.lte = new Date(input.dateTo + 'T23:59:59')
        }
        if (input.customerName) {
          where.OR = [
            { customerName: { contains: input.customerName, mode: 'insensitive' } },
            { customerCompanyName: { contains: input.customerName, mode: 'insensitive' } },
          ]
        }
        const rows = await prisma.document.findMany({
          where, take: clamp(input.limit), orderBy: { issueDate: 'desc' },
          select: { documentNumber: true, documentType: true, status: true, issueDate: true, customerName: true, customerCompanyName: true, vehiclePlate: true, totalAmount: true, paidAmount: true },
        })
        return JSON.stringify(rows.map(r => ({ ...r, totalAmount: Number(r.totalAmount), paidAmount: Number(r.paidAmount), issueDate: r.issueDate.toISOString().slice(0, 10) })))
      }
      case 'list_payments': {
        const where: any = { document: { branchId } }
        if (input.method) where.paymentMethod = input.method
        if (input.dateFrom || input.dateTo) {
          where.createdAt = {}
          if (input.dateFrom) where.createdAt.gte = new Date(input.dateFrom)
          if (input.dateTo) where.createdAt.lte = new Date(input.dateTo + 'T23:59:59')
        }
        const rows = await prisma.payment.findMany({
          where, take: clamp(input.limit), orderBy: { createdAt: 'desc' },
          include: { document: { select: { documentNumber: true, customerName: true } } },
        })
        return JSON.stringify(rows.map(r => ({
          documentNumber: r.document.documentNumber, customerName: r.document.customerName,
          amount: Number(r.amount), paymentMethod: r.paymentMethod, referenceNumber: r.referenceNumber,
          date: r.createdAt.toISOString().slice(0, 10),
        })))
      }
      case 'list_debtors': {
        const rows = await prisma.document.findMany({
          where: { branchId, documentType: 'INVOICE', status: { in: ['OUTSTANDING', 'PARTIAL', 'OVERDUE'] } },
          select: { documentNumber: true, customerName: true, customerCompanyName: true, vehiclePlate: true, totalAmount: true, paidAmount: true, dueDate: true, issueDate: true, status: true },
          orderBy: { issueDate: 'asc' },
          take: 50,
        })
        const grouped = new Map<string, { customer: string; company?: string | null; count: number; owed: number; oldest: Date }>()
        for (const r of rows) {
          const key = r.customerName ?? 'Unknown'
          const existing = grouped.get(key)
          const balance = Number(r.totalAmount) - Number(r.paidAmount)
          if (existing) { existing.count++; existing.owed += balance; if (r.issueDate < existing.oldest) existing.oldest = r.issueDate }
          else grouped.set(key, { customer: key, company: r.customerCompanyName, count: 1, owed: balance, oldest: r.issueDate })
        }
        return JSON.stringify(Array.from(grouped.values()).map(g => ({ ...g, oldest: g.oldest.toISOString().slice(0, 10) })))
      }
      case 'list_stock': {
        const where: any = { branchId }
        if (input.search) {
          where.OR = [
            { itemCode: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ]
        }
        if (input.tyresOnly) where.isTyre = true
        const rows = await prisma.stockItem.findMany({
          where, take: clamp(input.limit), orderBy: { description: 'asc' },
          select: { itemCode: true, description: true, uom: true, quantity: true, minStock: true, sellPrice: true, isTyre: true, tyreSize: true },
        })
        const filtered = input.lowStockOnly ? rows.filter(r => r.quantity <= r.minStock) : rows
        return JSON.stringify(filtered.map(r => ({ ...r, sellPrice: Number(r.sellPrice) })))
      }
      case 'list_purchase_invoices': {
        const where: any = { branchId }
        if (input.status) where.status = input.status
        if (input.supplierName) where.supplier = { companyName: { contains: input.supplierName, mode: 'insensitive' } }
        const rows = await prisma.purchaseInvoice.findMany({
          where, take: clamp(input.limit), orderBy: { issueDate: 'desc' },
          include: { supplier: { select: { companyName: true } } },
        })
        return JSON.stringify(rows.map(r => ({
          internalNumber: r.internalNumber, supplierInvoiceNumber: r.invoiceNumber,
          supplier: r.supplier.companyName, status: r.status,
          totalAmount: Number(r.totalAmount), paidAmount: Number(r.paidAmount),
          issueDate: r.issueDate.toISOString().slice(0, 10),
        })))
      }
      case 'list_suppliers': {
        const where: any = { branchId, isActive: true }
        if (input.search) {
          where.OR = [
            { companyName: { contains: input.search, mode: 'insensitive' } },
            { contactName: { contains: input.search, mode: 'insensitive' } },
          ]
        }
        const rows = await prisma.supplier.findMany({ where, orderBy: { companyName: 'asc' }, take: 50 })
        return JSON.stringify(rows.map(r => ({ companyName: r.companyName, contactName: r.contactName, phone: r.phone, email: r.email })))
      }
      case 'search_customers': {
        const q = input.query
        const rows = await prisma.customer.findMany({
          where: {
            branchId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { companyName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { vehicles: { some: { plate: { contains: q, mode: 'insensitive' } } } },
            ],
          },
          include: { vehicles: { select: { plate: true, make: true, model: true } } },
          take: 20,
        })
        return JSON.stringify(rows.map(r => ({
          name: r.name, companyName: r.companyName, phone: r.phone,
          vehicles: r.vehicles.map(v => `${v.plate} (${v.make} ${v.model})`),
        })))
      }
      case 'list_staff': {
        const rows = await prisma.user.findMany({
          where: { branchId, isActive: true },
          select: { name: true, email: true, role: true, jobTitle: true, phone: true },
          orderBy: { role: 'asc' },
        })
        return JSON.stringify(rows)
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message ?? 'Tool execution failed' })
  }
}

export async function chat(request: FastifyRequest, reply: FastifyReply) {
  if (!client) return reply.status(503).send({ success: false, message: 'ANTHROPIC_API_KEY not configured' })
  const { messages } = request.body as { messages: Array<{ role: 'user' | 'assistant'; content: string }> }
  if (!Array.isArray(messages) || messages.length === 0) {
    return reply.status(400).send({ success: false, message: 'messages required' })
  }

  const ctx: Ctx = { prisma: request.server.prisma, branchId: request.user.branchId }
  const todayIso = new Date().toISOString().slice(0, 10)
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `Context: today is ${todayIso}. Caller role: ${request.user.role}. Branch is pre-filtered on every tool call.` },
  ]

  const apiMessages: Anthropic.Messages.MessageParam[] = messages.map(m => ({ role: m.role, content: m.content }))

  for (let iter = 0; iter < 8; iter++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemBlocks,
      tools: toolDefs,
      messages: apiMessages,
    })

    if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') {
      const text = response.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text').map(b => b.text).join('\n')
      return reply.send({ success: true, data: { reply: text, usage: response.usage } })
    }

    if (response.stop_reason !== 'tool_use') {
      return reply.status(500).send({ success: false, message: `Unexpected stop_reason: ${response.stop_reason}` })
    }

    apiMessages.push({ role: 'assistant', content: response.content })
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const result = await runTool(ctx, block.name, block.input)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        try {
          await ctx.prisma.auditLog.create({
            data: {
              branchId: request.user.branchId,
              userId: request.user.userId,
              action: 'ASSISTANT_TOOL',
              entity: 'assistant',
              method: request.method,
              path: request.url,
              ipAddress: request.ip,
              userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
              changes: { tool: block.name, input: block.input } as any,
            },
          })
        } catch (err) {
          request.log.error({ err }, 'assistant audit log failed')
        }
      }
    }
    apiMessages.push({ role: 'user', content: toolResults })
  }

  return reply.status(500).send({ success: false, message: 'Assistant exceeded tool-use iteration limit' })
}
