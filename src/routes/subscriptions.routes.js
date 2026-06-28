import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels } from "../controllers/subscriptions.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/channel/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription);

router.route("/user/:subscriberId").get(getSubscribedChannels);

export default router;
