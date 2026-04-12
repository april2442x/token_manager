const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { hashLicenseKey, generateLicenseKey } = require('../src/utils/crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
    },
  });

  console.log('✅ Created user:', user.email);

  // Generate and hash license keys
  const plainKey1 = generateLicenseKey();
  const plainKey2 = generateLicenseKey();
  const plainKey3 = generateLicenseKey();

  const hashedKey1 = await hashLicenseKey(plainKey1);
  const hashedKey2 = await hashLicenseKey(plainKey2);
  const hashedKey3 = await hashLicenseKey(plainKey3);

  // Create licenses
  const license1 = await prisma.license.upsert({
    where: { key: hashedKey1 },
    update: {},
    create: {
      key: hashedKey1,
      userId: user.id,
      maxDevices: 3,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  const license2 = await prisma.license.upsert({
    where: { key: hashedKey2 },
    update: {},
    create: {
      key: hashedKey2,
      userId: user.id,
      maxDevices: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  const license3 = await prisma.license.upsert({
    where: { key: hashedKey3 },
    update: {},
    create: {
      key: hashedKey3,
      userId: user.id,
      maxDevices: 5,
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired (yesterday)
    },
  });

  console.log('\n✅ Created licenses:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`License 1 (3 devices, expires in 1 year):`);
  console.log(`  Key: ${plainKey1}`);
  console.log(`  Expires: ${license1.expiresAt.toISOString()}`);
  console.log('');
  console.log(`License 2 (1 device, expires in 30 days):`);
  console.log(`  Key: ${plainKey2}`);
  console.log(`  Expires: ${license2.expiresAt.toISOString()}`);
  console.log('');
  console.log(`License 3 (5 devices, EXPIRED):`);
  console.log(`  Key: ${plainKey3}`);
  console.log(`  Expires: ${license3.expiresAt.toISOString()}`);
  console.log('─────────────────────────────────────────────────────');
  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
