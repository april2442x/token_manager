require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createLicense() {
  try {
    const licenseKey = crypto.randomBytes(16).toString('hex').toUpperCase();
    const hashedKey = await bcrypt.hash(licenseKey, 10);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);
    
    const license = await prisma.license.create({
      data: {
        key: hashedKey,
        max_devices: 5,
        expires_at: expiresAt,
      },
    });
    
    console.log('\n✅ License Created Successfully!\n');
    console.log('License Key:', licenseKey);
    console.log('Max Devices:', license.max_devices);
    console.log('Expires:', license.expires_at.toISOString());
    console.log('');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createLicense();
