// src/utils/logger.util.js
import colors from "colors";

/**
 * Utility for standardized logging
 */
export default class Logger {
  /**
   * Log an info message
   * @param {String} message - The message to log
   * @param {Object} data - Optional data to include
   */
  static info(message, data) {
    console.log(colors.cyan(`[INFO] ${message}`), data ? data : '');
  }

  /**
   * Log a success message
   * @param {String} message - The message to log
   * @param {Object} data - Optional data to include
   */
  static success(message, data) {
    console.log(colors.green(`[SUCCESS] ${message}`), data ? data : '');
  }

  /**
   * Log a warning message
   * @param {String} message - The message to log
   * @param {Object} data - Optional data to include
   */
  static warn(message, data) {
    console.log(colors.yellow(`[WARNING] ${message}`), data ? data : '');
  }

  /**
   * Log an error message
   * @param {String} message - The message to log
   * @param {Error|Object} error - The error object or data
   */
  static error(message, error) {
    console.error(colors.red(`[ERROR] ${message}`), error);
  }

  /**
   * Log a debug message (only in development)
   * @param {String} message - The message to log
   * @param {Object} data - Optional data to include
   */
  static debug(message, data) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(colors.blue(`[DEBUG] ${message}`), data ? data : '');
    }
  }
}
