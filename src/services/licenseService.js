const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { compareLicenseKey, hashDeviceId } = require('../utils/crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

class LicenseService {
  /**
   * Find license by plain key (compares with all hashed keys)
   */
  async findLicenseByKey(plainKey) {
    const licenses = await prisma.license.findMany({
      include: {
        devices: true,
      },
    });

    for (const license of licenses) {
      const isMatch = await compareLicenseKey(plainKey, license.key);
      if (isMatch) {
        return license;
      }
    }

    return null;
  }

  /**
   * Check if license is expired
   */
  isExpired(license) {
    if (!license.expiresAt) return false;
    return new Date() > new Date(license.expiresAt);
  }

  /**
   * Check if device limit is reached
   */
  isDeviceLimitReached(license) {
    return license.devices.length >= license.maxDevices;
  }

  /**
   * Find device by license and device ID
   */
  async findDevice(licenseId, deviceId) {
    const hashedDeviceId = hashDeviceId(deviceId);
    return prisma.device.findUnique({
      where: {
        licenseId_deviceId: {
          licenseId,
          deviceId: hashedDeviceId,
        },
      },
    });
  }

  /**
   * Register a new device
   */
  async registerDevice(licenseId, deviceId) {
    const hashedDeviceId = hashDeviceId(deviceId);
    return prisma.device.create({
      data: {
        licenseId,
        deviceId: hashedDeviceId,
      },
    });
  }

  /**
   * Log usage
   */
  async logUsage(licenseId, deviceId, ip) {
    return prisma.usageLog.create({
      data: {
        licenseId,
        deviceId,
        ip,
      },
    });
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(licenseId, deviceId) {
    const hashedDeviceId = hashDeviceId(deviceId);
    return prisma.device.deleteMany({
      where: {
        licenseId,
        deviceId: hashedDeviceId,
      },
    });
  }
}

module.exports = new LicenseService();
