import { Router } from "express";
import { authMiddleware } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { asyncHandler } from "../../common/utils/asyncHandler";
import {
  createDocumentSchema,
  documentIdParamSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema,
} from "./documents.validation";
import * as documentsController from "./documents.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", validate({ query: listDocumentsQuerySchema }), asyncHandler(documentsController.listDocumentsHandler));
router.post("/", validate({ body: createDocumentSchema }), asyncHandler(documentsController.createDocumentHandler));
router.patch(
  "/:id",
  validate({ params: documentIdParamSchema, body: updateDocumentSchema }),
  asyncHandler(documentsController.updateDocumentHandler)
);
router.delete("/:id", validate({ params: documentIdParamSchema }), asyncHandler(documentsController.deleteDocumentHandler));

export default router;
