const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('./logger');

class QRCodeGenerator {
  static async generate(data) {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 400,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Convert data URL to buffer
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return buffer;
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static async saveToFile(data, filename) {
    try {
      const buffer = await this.generate(data);
      const filepath = path.join(process.env.QR_CODE_DIR, filename);
      await fs.writeFile(filepath, buffer);

      return filepath;
    } catch (error) {
      logger.error('QR code file save error:', error);
      throw new Error('Failed to save QR code to file');
    }
  }

  static async deleteFile(filename) {
    try {
      const filepath = path.join(process.env.QR_CODE_DIR, filename);
      await fs.unlink(filepath);
    } catch (error) {
      logger.error('QR code file delete error:', error);
      throw new Error('Failed to delete QR code file');
    }
  }
}

module.exports = QRCodeGenerator; 