import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { createTabSchema, tabIdParamSchema, updateTabSchema } from "./tabs.validation";
import { createSectionSchema } from "./sections.validation";
import * as tabsController from "./tabs.controller";
import * as sectionsController from "./sections.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", asyncHandler(tabsController.listTabsHandler));
router.post("/", validate({ body: createTabSchema }), asyncHandler(tabsController.createTabHandler));
router.get("/:id", validate({ params: tabIdParamSchema }), asyncHandler(tabsController.getTabHandler));
router.patch(
  "/:id",
  validate({ params: tabIdParamSchema, body: updateTabSchema }),
  asyncHandler(tabsController.updateTabHandler)
);
router.delete("/:id", validate({ params: tabIdParamSchema }), asyncHandler(tabsController.deleteTabHandler));

router.post(
  "/:id/sections",
  validate({ params: tabIdParamSchema, body: createSectionSchema }),
  asyncHandler(sectionsController.createSectionHandler)
);

export default router;
