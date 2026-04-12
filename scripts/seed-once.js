#!/usr/bin/env node

/**
 * Seed Database Once
 * Checks if database has data before seeding
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('🔍 Checking database...');

    // Check if licenses exist
    const licenseCount = await prisma.license.count();

    if (licenseCount > 0) {
      console.log(`✅ Database already has ${licenseCount} license(s), skipping seed`);
      return;
    }

    console.log('🌱 Database is empty, running seed...');
    
    // Run seed script
    execSync('npm run prisma:seed', { stdio: 'inherit' });

    console.log('✅ Seed completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
