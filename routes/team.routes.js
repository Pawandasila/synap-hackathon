import express from "express";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  getTeamById,
  getTeamsByEvent,
  getUserTeams,
  updateTeam,
  removeMember,
  deleteTeam,
} from "../controllers/team.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createTeamWithValidation,
  updateTeamWithValidation,
  joinTeamWithValidation,
  leaveTeamWithValidation,
  getTeamWithValidation,
  removeMemberWithValidation,
  deleteTeamWithValidation,
  getTeamsByEventWithValidation,
} from "../validators/team.validators.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/", validate(createTeamWithValidation), createTeam);

router.get("/my-teams", getUserTeams);

router.get(
  "/event/:eventId",
  validate(getTeamsByEventWithValidation),
  getTeamsByEvent
);

router.get("/:teamId", validate(getTeamWithValidation), getTeamById);

router.put("/:teamId", validate(updateTeamWithValidation), updateTeam);

router.delete("/:teamId", validate(deleteTeamWithValidation), deleteTeam);

router.post("/:teamId/join", validate(joinTeamWithValidation), joinTeam);

router.post("/:teamId/leave", validate(leaveTeamWithValidation), leaveTeam);

router.delete(
  "/:teamId/members/:memberId",
  validate(removeMemberWithValidation),
  removeMember
);

export default router;
