import colors from "colors";

/**
 * Logger utility - provides consistent logging across the application
 */
class Logger {
  
  info(message, data = null) {
    console.log(colors.blue(message), data || '');
  }

  success(message, data = null) {
    console.log(colors.green(message), data || '');
  }

  warning(message, data = null) {
    console.log(colors.yellow(message), data || '');
  }

  error(message, error = null) {
    if (error) {
      console.error(colors.red(message), error);
    } else {
      console.error(colors.red(message));
    }
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(colors.cyan(`[DEBUG] ${message}`), data || '');
    }
  }

  separator() {
    console.log(colors.rainbow("========================================"));
  }

  banner(text) {
    this.separator();
    console.log(colors.bold.green(`  ${text}`));
    this.separator();
  }
  
  processingStart(task) {
    this.separator();

    const logData = {
      to: typeof task.to === 'string' 
        ? task.to.substring(0, 16) + '...' 
        : Array.isArray(task.to) 
          ? `${task.to.length} tokens` 
          : 'INVALID',
      title: task.notification?.title,
      type: task.type || (Array.isArray(task.to) ? "bulk" : "single"),
    };

    if (task.userId) {
      logData.userId = task.userId;
    }

    this.info("Processing notification:", logData);
  }

  processingSuccess(task, type) {
    this.success(`Notification processed successfully!`);
    this.info(`Title: ${task.notification.title}`);
    this.info(`Type: ${type}`);
  }

  messageReceived(content, retries) {
    this.success("==> Message received:", content);
    this.success("===> Retry count:", retries);
  }

  messageProcessed() {
    this.success("====> Message processed successfully!");
  }

  messageRetrying() {
    this.warning("====> Retrying message...");
  }

  messageToDLQ() {
    this.error("====> Message sent to DLQ!");
  }

  bulkNotificationComplete(successCount, failureCount) {
    this.info(`Bulk notification complete. Success: ${successCount}, Failures: ${failureCount}`);
  }
}

export default new Logger();
