import express from "express";
import {
  issueCertificate,
  getCertificatesByEvent,
  getMyCertificates,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  bulkIssueCertificates,
  getTemplates,
  generateCertificate
} from "../controllers/certificate.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  issueCertificateWithValidation,
  bulkIssueCertificateWithValidation,
  updateCertificateWithValidation,
  getCertificateWithValidation,
  getCertificatesByEventWithValidation,
  deleteCertificateWithValidation
} from "../validators/certificate.validators.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Issue single certificate (organizers only)
router.post("/", 
  requireRole(["organizer"]), 
  validate(issueCertificateWithValidation), 
  issueCertificate
);

// Bulk issue certificates (organizers only)
router.post("/bulk-issue", 
  requireRole(["organizer"]), 
  validate(bulkIssueCertificateWithValidation), 
  bulkIssueCertificates
);

// Get user's certificates
router.get("/my-certificates", 
  getMyCertificates
);

// Get certificate templates (all authenticated users)
router.get("/templates", getTemplates);

// Generate certificate data (organizers only)
router.post("/generate", 
  requireRole(["organizer"]), 
  generateCertificate
);

// Get certificates by event (organizers and judges only)
router.get("/event/:eventId", 
  requireRole(["organizer", "judge"]), 
  validate(getCertificatesByEventWithValidation), 
  getCertificatesByEvent
);

// Get specific certificate by ID
router.get("/:id", 
  validate(getCertificateWithValidation), 
  getCertificateById
);

// Update certificate (organizers only)
router.patch("/:id", 
  requireRole(["organizer"]), 
  validate(updateCertificateWithValidation), 
  updateCertificate
);

// Delete certificate (organizers only)
router.delete("/:id", 
  requireRole(["organizer"]), 
  validate(deleteCertificateWithValidation), 
  deleteCertificate
);

export default router;
