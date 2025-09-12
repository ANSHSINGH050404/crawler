import express from 'express'
import { getUserProfile, login, register } from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';


const router=express.Router();


router.post("/register",register)
router.post("/login",login)

router.get("/profile",protect,getUserProfile)



export default router;