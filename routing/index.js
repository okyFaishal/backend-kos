const router = require("express").Router();
const user = require("../module/user/route");
const otp = require("../module/otp/route");
// const chat = require("../module/chat/route");
// const payment = require("../module/payment/route");
// const history = require("../module/history/route");
// const package = require("../module/package/route");
// const room = require("../module/room/route");
// const build = require("../module/build/route");

router.use("/user", user);
router.use("/otp", otp);
// router.use("/chat", chat);
// router.use("/payment", payment);
// router.use("/history", history);
// router.use("/package", package);
// router.use("/room", room);
// router.use("/build", build);

module.exports = router;
