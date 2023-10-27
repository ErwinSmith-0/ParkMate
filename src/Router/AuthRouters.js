// import cacheMiddleware from "./Middleware/cacheMiddleware.js";
import { Router, application } from "express";
import AuthController from "../Controller/AuthController.js";

import {
  AuthMiddleware,
  EphemeralAccessMiddleware,
} from "./Middleware/AuthMiddleware.js";
// import RideController from "../Controller/rideController.js";

export let AuthRouters = Router();

// AuthRouters.route("/register").post(AuthController.registerUser);

AuthRouters.route("/login").post(AuthController.LoginUser);
AuthRouters.route("/forgetpassword").post(AuthController.forgetPassword);
// AuthRouters.route("/sociallogin").post(AuthController.SocialLoginUser);
// AuthRouters.route("/distanceFareCalc").post(RideController.distanceFareCalculator);

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(AuthRouters);
  this.use(path, middleware, AuthRouters);
  return AuthRouters;
};

AuthRouters.route("/createprofile").post(AuthController.createProfile);
AuthRouters.prefix("/auth", EphemeralAccessMiddleware, async function () {
  AuthRouters.route("/verifyprofile").post(AuthController.verifyProfile);
  AuthRouters.route("/resendOtp").post(AuthController.resendOtp);
  AuthRouters.route("/createuserprofile").post(
    AuthController.createUserProfile
  );
  AuthRouters.route("/createcarprofile").post(AuthController.createCarProfile);
  // AuthRouters.route("/completeprofile").post(AuthController.completeProfile);
  // AuthRouters.route("/resendOtp").post(AuthController.resendOtp);
});

AuthRouters.prefix("/user", AuthMiddleware, async function () {
  // AuthRouters.route("/update").post(AuthController.updateUser);
  AuthRouters.route("/getUserDetails").get(
    // cacheMiddleware(3600),
    AuthController.getUserDetails
  );
  AuthRouters.route("/updateProfile").put(AuthController.updateProfile);
  AuthRouters.route("/updateCar").put(AuthController.updateCar);
  AuthRouters.route("/resetpassword").post(AuthController.resetpassword);
  AuthRouters.route("/Verify").post(AuthController.VerifyOtp);
  AuthRouters.route("/logout").post(AuthController.logout);
  // AuthRouters.route("/prebook").post(RideController.preBookRide)
  // AuthRouters.route("/singleprebook").get(RideController.GetSinglepreBookRidebyUser)
  // AuthRouters.route("/allprebook").get(RideController.GetAllpreBookRidebyUser)
  // AuthRouters.route("/instantridebook").post(RideController.instantRideBook)
  AuthRouters.route("/changepassword").post(AuthController.changePassword);
});
