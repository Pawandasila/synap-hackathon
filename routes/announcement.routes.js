import express from "express";
import {
  createAnnouncement,
  getAnnouncementsByEvent,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getMyImportantAnnouncements,
  getAllAnnouncementsForOrganizer,
  getAllAnnouncementsForParticipant
} from "../controllers/announcement.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createAnnouncementWithValidation,
  updateAnnouncementWithValidation,
  getAnnouncementWithValidation,
  getAnnouncementsByEventWithValidation,
  deleteAnnouncementWithValidation
} from "../validators/announcement.validators.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create announcement (organizers only)
router.post("/", 
  requireRole(["organizer"]), 
  validate(createAnnouncementWithValidation), 
  createAnnouncement
);

// Get all announcements for organizer
router.get("/", 
  requireRole(["organizer"]), 
  getAllAnnouncementsForOrganizer
);

// Get user's important announcements
router.get("/my-important", 
  requireRole(["participant"]), 
  getMyImportantAnnouncements
);

// Get all announcements for participant
router.get("/my-all", 
  requireRole(["participant"]), 
  getAllAnnouncementsForParticipant
);

// Get announcements by event
router.get("/event/:eventId", 
  requireRole(["organizer", "judge", "participant"]), 
  validate(getAnnouncementsByEventWithValidation), 
  getAnnouncementsByEvent
);

// Get specific announcement by ID
router.get("/:id", 
  requireRole(["organizer", "judge", "participant"]), 
  validate(getAnnouncementWithValidation), 
  getAnnouncementById
);

// Update announcement (organizers only)
router.patch("/:id", 
  requireRole(["organizer"]), 
  validate(updateAnnouncementWithValidation), 
  updateAnnouncement
);

// Delete announcement (organizers only)
router.delete("/:id", 
  requireRole(["organizer"]), 
  validate(deleteAnnouncementWithValidation), 
  deleteAnnouncement
);

export default router;
