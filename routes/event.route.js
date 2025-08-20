import express from "express";
import { 
    createEvents, 
    deleteEvent, 
    getEventById, 
    getEventByOrganizerId, 
    getEvents, 
    getUpcomingEvents, 
    searchEvents, 
    updateEvent,
    enrollToEvent,
    cancelEnrollment,
    getUserEnrollments,
    getEventEnrollments,
    getEnrollmentStats,
    updateEnrollmentTeam,
    getEventForParticipant
} from "../controllers/event.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Event CRUD operations
router.post("/create", authenticateToken, requireRole(["organizer"]), createEvents);
router.get('/', authenticateToken, getEvents);
router.get('/search', authenticateToken, requireRole(["participant", "organizer"]), searchEvents);
router.get('/upcoming', authenticateToken, getUpcomingEvents);
router.get('/:id/participant', authenticateToken, requireRole(['participant']), getEventForParticipant);
router.get('/:id', authenticateToken, getEventById);
router.get('/organizer/:organizerId', authenticateToken, getEventByOrganizerId);
router.patch('/update/:id', authenticateToken, requireRole(["organizer"]), updateEvent);
router.delete('/delete/:id', authenticateToken, requireRole(["organizer"]), deleteEvent);

// Event Enrollment operations
router.post('/:eventId/enroll', authenticateToken, requireRole(['participant']), enrollToEvent);
router.post('/:eventId/cancel', authenticateToken, requireRole(['participant']), cancelEnrollment);
router.get('/my/enrollments', authenticateToken, requireRole(['participant']), getUserEnrollments);

// Organizer-only enrollment management
router.get('/:eventId/enrollments', authenticateToken, requireRole(["organizer"]), getEventEnrollments);
router.get('/:eventId/enrollment-stats', authenticateToken, requireRole(["organizer"]), getEnrollmentStats);

// Team association in enrollment
router.patch('/:eventId/enrollment/team', authenticateToken, updateEnrollmentTeam);

export default router;