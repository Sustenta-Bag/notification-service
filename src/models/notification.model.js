export class Notification {
  constructor(title, body, data) {
    this.title = title;
    this.body = body;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  validate() {
    if (!this.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      title: this.title,
      body: this.body,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

export class SingleNotificationRequest {
  constructor(token, notification, data) {
    this.token = token;
    this.notification = notification;
    this.data = data || {};
    this.type = "single";
  }

  validate() {
    if (!this.token) {
      throw new Error('Single notification must have a token');
    }
    if (!this.notification || !this.notification.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      to: this.token,
      notification: this.notification,
      data: this.data,
      type: this.type
    };  }
}

export class BulkNotificationRequest {
  constructor(tokens, notification, data) {
    this.tokens = tokens;
    this.notification = notification;
    this.data = data || {};
    this.type = "bulk";
  }

  validate() {
    if (!this.tokens || !Array.isArray(this.tokens) || this.tokens.length === 0) {
      throw new Error('Bulk notification must have an array of tokens');
    }
    if (!this.notification || !this.notification.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      to: this.tokens,
      notification: this.notification,
      data: this.data,
      type: this.type
    };
  }
}
