// src/middlewares/logger.middleware.js
import colors from "colors";

export const requestLogger = (req, res, next) => {
  console.log(colors.cyan(`[${new Date().toISOString()}] ${req.method} ${req.url}`));
  
  // Log request body if present (for POST/PUT)
  if (req.method === "POST" || req.method === "PUT") {
    const sanitizedBody = { ...req.body };
    
    // Sanitize sensitive data if present
    if (sanitizedBody.token) sanitizedBody.token = "***";
    if (sanitizedBody.tokens) sanitizedBody.tokens = `[${sanitizedBody.tokens.length} tokens]`;
    
    console.log(colors.blue("Request Body:"), sanitizedBody);
  }
  
  next();
};
