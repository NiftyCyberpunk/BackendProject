import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, publishVideo, getVideoByID, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT) //Apply middleware to all

router.route("/")
    .get(getAllVideos)
    .post(                  //express get the type of request if it is post or get and exexutes the required function,
    upload.fields([        //logical grouping; groups all operations for same resource
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishVideo
);

router.route("/:videoId")
    .get(getVideoByID)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;