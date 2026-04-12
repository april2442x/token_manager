const licenseService = require('../services/licenseService');
const { signResponse } = require('../utils/jwt');

class LicenseController {
  /**
   * POST /activate
   * Activate a license for a device
   */
  async activate(req, res) {
    try {
      const { key, device_id } = req.body;

      if (!key || !device_id) {
        return res.status(400).json({
          valid: false,
          error: 'Missing required fields: key and device_id',
        });
      }

      // Find license
      const license = await licenseService.findLicenseByKey(key);
      if (!license) {
        await licenseService.logUsage('unknown', device_id, req.ip);
        return res.status(404).json({
          valid: false,
          error: 'Invalid license key',
        });
      }

      // Check expiration
      if (licenseService.isExpired(license)) {
        await licenseService.logUsage(license.id, device_id, req.ip);
        return res.status(403).json({
          valid: false,
          error: 'License has expired',
          expires_at: license.expiresAt,
        });
      }

      // Check if device already exists
      let device = await licenseService.findDevice(license.id, device_id);

      if (!device) {
        // Check device limit
        if (licenseService.isDeviceLimitReached(license)) {
          await licenseService.logUsage(license.id, device_id, req.ip);
          return res.status(403).json({
            valid: false,
            error: 'Device limit reached',
            max_devices: license.maxDevices,
          });
        }

        // Register new device
        device = await licenseService.registerDevice(license.id, device_id);
      }

      // Log usage
      await licenseService.logUsage(license.id, device_id, req.ip);

      // Prepare response
      const responseData = {
        valid: true,
        expires_at: license.expiresAt,
        max_devices: license.maxDevices,
        device_count: license.devices.length + (device ? 1 : 0),
      };

      const token = signResponse(responseData);

      return res.status(200).json({
        ...responseData,
        token,
      });
    } catch (error) {
      console.error('Activation error:', error);
      return res.status(500).json({
        valid: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /validate
   * Validate a license and device
   */
  async validate(req, res) {
    try {
      const { key, device_id } = req.body;

      if (!key || !device_id) {
        return res.status(400).json({
          valid: false,
          error: 'Missing required fields: key and device_id',
        });
      }

      // Find license
      const license = await licenseService.findLicenseByKey(key);
      if (!license) {
        await licenseService.logUsage('unknown', device_id, req.ip);
        return res.status(404).json({
          valid: false,
          error: 'Invalid license key',
        });
      }

      // Check expiration
      if (licenseService.isExpired(license)) {
        await licenseService.logUsage(license.id, device_id, req.ip);
        return res.status(403).json({
          valid: false,
          error: 'License has expired',
          expires_at: license.expiresAt,
        });
      }

      // Check if device exists
      const device = await licenseService.findDevice(license.id, device_id);
      if (!device) {
        await licenseService.logUsage(license.id, device_id, req.ip);
        return res.status(403).json({
          valid: false,
          error: 'Device not registered for this license',
        });
      }

      // Log usage
      await licenseService.logUsage(license.id, device_id, req.ip);

      // Prepare response
      const responseData = {
        valid: true,
        expires_at: license.expiresAt,
      };

      const token = signResponse(responseData);

      return res.status(200).json({
        ...responseData,
        token,
      });
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        valid: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * POST /deactivate
   * Deactivate a device from a license
   */
  async deactivate(req, res) {
    try {
      const { key, device_id } = req.body;

      if (!key || !device_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: key and device_id',
        });
      }

      // Find license
      const license = await licenseService.findLicenseByKey(key);
      if (!license) {
        return res.status(404).json({
          success: false,
          error: 'Invalid license key',
        });
      }

      // Deactivate device
      const result = await licenseService.deactivateDevice(license.id, device_id);

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: 'Device not found for this license',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Device deactivated successfully',
      });
    } catch (error) {
      console.error('Deactivation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /health
   * Health check endpoint
   */
  async health(req, res) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new LicenseController();
