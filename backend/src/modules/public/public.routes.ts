import { Router } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { getPublicTabsHandler } from "./public.controller";

const router = Router();

router.get("/tabs", asyncHandler(getPublicTabsHandler));

export default router;
