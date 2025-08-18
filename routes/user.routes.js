import express from "express";
import { createUser, getAllUsers, getUserById } from "../controllers/user.controllers.js";

const router = express.Router();

router.post('/create', createUser);
router.get('/:id', getUserById);
router.get('/', getAllUsers);


export default router;