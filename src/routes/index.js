// src/routes/index.js
import { Router } from "express";
import notificationRoutes from "./notification.routes.js";

const router = Router();

// Mount routes
router.use('/notifications', notificationRoutes);

// Root endpoint with HATEOAS links
router.get('/', (req, res) => {
  res.status(200).json({
    message: "Notification Service API",
    links: [
      {
        rel: "notifications",
        href: "/api/notifications",
        method: "GET",
        description: "Access notification endpoints"
      }
    ]
  });
});

export default router;
