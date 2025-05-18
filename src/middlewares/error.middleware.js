// src/middlewares/error.middleware.js
import colors from "colors";

export const errorHandler = (err, req, res, next) => {
  console.error(colors.red("Error:"), err);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
    links: [
      {
        rel: "api-root",
        href: "/api",
        method: "GET"
      }
    ]
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
