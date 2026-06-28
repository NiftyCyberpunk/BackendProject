import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweets.controller.js";
import { upload } from "../middlewares/multer.middleware.js";


const router = Router();

router.use(verifyJWT);

router.route("/").post(upload.single("tweetImg"), createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(upload.single("tweetImg"), updateTweet).delete(deleteTweet);

export default router;