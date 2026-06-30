import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideosComments, addCommnet, updateComment, deleteComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/:videoId").get(getVideosComments).post(addCommnet);
router.route("/comment/:commentId").delete(deleteComment).patch(updateComment);