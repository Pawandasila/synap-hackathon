import express from "express";
import {
  createSubmission,
  getSubmissionsByEvent,
  getSubmissionsByTeam,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  getMySubmissions
} from "../controllers/submission.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createSubmissionWithValidation,
  updateSubmissionWithValidation,
  getSubmissionWithValidation,
  getSubmissionsByEventWithValidation,
  getSubmissionsByTeamWithValidation,
  deleteSubmissionWithValidation
} from "../validators/submission.validators.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create submission (participants only)
router.post("/", 
  requireRole(["participant"]), 
  validate(createSubmissionWithValidation), 
  createSubmission
);

// Get user's submissions across all teams
router.get("/my-submissions", 
  requireRole(["participant"]), 
  getMySubmissions
);

// Get submissions by event (organizers and judges can see all, participants see their own team's)
router.get("/event/:eventId", 
  requireRole(["organizer", "judge", "participant"]), 
  validate(getSubmissionsByEventWithValidation), 
  getSubmissionsByEvent
);

// Get submissions by team (team members only)
router.get("/team/:teamId", 
  validate(getSubmissionsByTeamWithValidation), 
  getSubmissionsByTeam
);

// Get specific submission by ID
router.get("/:id", 
  requireRole(["organizer", "judge", "participant"]), 
  validate(getSubmissionWithValidation), 
  getSubmissionById
);

// Update submission (team members only)
router.patch("/:id", 
  requireRole(["participant"]), 
  validate(updateSubmissionWithValidation), 
  updateSubmission
);

// Delete submission (team leaders only)
router.delete("/:id", 
  requireRole(["participant"]), 
  validate(deleteSubmissionWithValidation), 
  deleteSubmission
);

export default router;
