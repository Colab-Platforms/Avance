import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { sectionIdParamSchema, updateSectionSchema } from "./sections.validation";
import * as sectionsController from "./sections.controller";

const router = Router();

router.use(authMiddleware);

router.patch(
  "/:id",
  validate({ params: sectionIdParamSchema, body: updateSectionSchema }),
  asyncHandler(sectionsController.updateSectionHandler)
);
router.delete("/:id", validate({ params: sectionIdParamSchema }), asyncHandler(sectionsController.deleteSectionHandler));

export default router;
