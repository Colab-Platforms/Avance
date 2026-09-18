import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { validate } from "../../common/middleware/validate.middleware";
import { loginSchema } from "./auth.validation";
import { loginHandler } from "./auth.controller";

const router = Router();

router.post("/login", validate({ body: loginSchema }), asyncHandler(loginHandler));

export default router;
