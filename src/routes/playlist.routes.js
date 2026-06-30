import { Router } from "express";
import { createPlaylist, addVideoToPlaylist, deletePlaylist, getPlayListById, getUserPlaylist, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);
router.route("/:playlistId")
    .get(getPlayListById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylist);



export default router;