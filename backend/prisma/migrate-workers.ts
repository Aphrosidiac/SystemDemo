/**
 * Migration script: Merge Worker records into User table.
 *
 * For each Worker, creates a User record with:
 * - email: {name-slugified}@demo.local
 * - password: "worker123" (hashed) — admin should reset after migration
 * - role: WORKER
 * - jobTitle: worker's role field (e.g. "Foreman")
 * - phone: worker's phone
 *
 * Then updates all documents.foremanId from old worker IDs to new user IDs.
 *
 * Run: npx tsx prisma/migrate-workers.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Worker → User migration...\n')

  // Get all workers
  const workers = await prisma.$queryRaw<
    { id: string; branchId: string; name: string; phone: string | null; role: string; isActive: boolean }[]
  >`SELECT id, "branchId", name, phone, role, "isActive" FROM workers`

  if (workers.length === 0) {
    console.log('No workers found. Nothing to migrate.')
    return
  }

  console.log(`Found ${workers.length} workers to migrate.\n`)

  const defaultPasswordHash = await bcrypt.hash('worker123', 10)
  const idMapping: Record<string, string> = {}

  for (const worker of workers) {
    // Generate a unique email from the worker's name
    const slug = worker.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'worker'

    // Check if email already exists, append number if needed
    let email = `${slug}@demo.local`
    let attempt = 0
    while (true) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (!existing) break
      attempt++
      email = `${slug}-${attempt}@demo.local`
    }

    // Create user record
    const user = await prisma.user.create({
      data: {
        branchId: worker.branchId,
        email,
        passwordHash: defaultPasswordHash,
        name: worker.name,
        phone: worker.phone,
        jobTitle: worker.role,
        role: 'WORKER',
        isActive: worker.isActive,
      },
    })

    idMapping[worker.id] = user.id
    console.log(`  ✓ ${worker.name} (${worker.role}) → ${email} [${user.id}]`)
  }

  // Update all documents.foremanId references
  console.log('\nUpdating document foreman references...')
  let updated = 0
  for (const [oldId, newId] of Object.entries(idMapping)) {
    const result = await prisma.$executeRaw`
      UPDATE documents SET "foremanId" = ${newId} WHERE "foremanId" = ${oldId}
    `
    updated += Number(result)
  }
  console.log(`  ✓ Updated ${updated} document(s)`)

  // Drop workers table
  console.log('\nDropping workers table...')
  await prisma.$executeRaw`DROP TABLE IF EXISTS workers CASCADE`
  console.log('  ✓ Workers table dropped')

  console.log('\n✅ Migration complete!')
  console.log('\nID Mapping:')
  for (const [oldId, newId] of Object.entries(idMapping)) {
    console.log(`  ${oldId} → ${newId}`)
  }
  console.log('\n⚠️  Default password for all migrated workers: "worker123"')
  console.log('   Admin should reset passwords via the Staff management page.')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
