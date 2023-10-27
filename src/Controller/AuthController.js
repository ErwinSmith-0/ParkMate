// import fs from "fs";
import bcrypt from "bcrypt";
import authModel from "../DB/Model/authModel.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import { handleMultipartData } from "../Utils/MultipartData.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { sendEmails } from "../Utils/SendEmail.js";
import { mongoose } from "mongoose";
import { accessTokenValidator } from "../Utils/Validator/accessTokenValidator.js";
// import NotificationController from "./NotificationController.js";
// import jwt from "jsonwebtoken";

import {
  CarProfileValidator,
  LoginUserValidator,
  RegisterUserValidator,
  ResetPasswordValidator,
  changePasswordValidator,
  createUserProfileValidator,
  createprofilevalidator,
  forgetpasswordValidator,
  updateUserProfileValidator,
  updatevalidator,
  verifyOTPValidator,
} from "../Utils/Validator/UserValidator.js";
import { linkUserDevice, unlinkUserDevice } from "../Utils/linkUserDevice.js";
import {
  tokenGen,
  OtptokenGen,
  // DatatokenGen,
} from "../Utils/AccessTokenManagement/Tokens.js";
import OtpModel from "../DB/Model/otpModel.js";
// import { genSalt } from "../Utils/saltGen.js";
import { Types } from "mongoose";
// import chaperoneModel from "../DB/Model/chaperoneModel.js";
import userModel from "../DB/Model/userModel.js";
import profileModel from "../DB/Model/profileModel.js";
import carModel from "../DB/Model/carModel.js";

import { genSalt } from "../Utils/saltGen.js";

const createProfile = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(CustomError.badRequest("Invalid Email or Password"));
    }
    const hashedPassword = hashPassword(password);
    // Check if the email already exists
    const User = await authModel.findOne({ email });
    console.log(User);
    if (User) {
      return next(CustomError.badRequest("User Already Exists"));
    }
    let otp = Math.floor(Math.random() * 9000) + 1000;
    const emailData = {
      subject: "Park-Mate - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >

    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
  
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To ParkMate</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi,</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      // attachments: [
      //   {
      //     filename: "logo.jpg",
      //     path: "./assets/logo.jpg",
      //     cid: "logo",
      //     contentDisposition: "inline",
      //   },
      // {
      //   filename: "bg.png",
      //   path: "./Uploads/bg.png",
      //   cid: "background",
      //   contentDisposition: "inline",
      // },
      // ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html
      // emailData.attachments
    );

    //user creds
    const newUser = {
      email,
      password: hashedPassword,
    };

    const token = await OtptokenGen({ newUser, otp });

    //jwt.sign({userData:newUser , otp:userOTP} , 'secret' , {expiresIn:1})

    return next(
      CustomSuccess.createSuccess(
        { token },
        // { token },
        "Verification OTP has been sent",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const verifyProfile = async (req, res, next) => {
  try {
    const { user } = req;

    const { otp } = req.body;
    console.log("User ===>", user);
    // Check if the email already exists

    const TokenOtp = user.payload.userData.otp;
    const userData = user.payload.userData.newUser;

    if (TokenOtp !== otp) {
      return next(CustomError.createError("Invalid OTP", 401));
    }

    const token = await OtptokenGen({ userData, isVerified: true });

    return next(
      CustomSuccess.createSuccess(
        { token, userData },
        "User Verified Succesfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const createUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { fullName, preference, address, phone, userType } = req.body;

    const { error } = createUserProfileValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    if (userType !== "user" && userType !== "admin") {
      return next(CustomError.badRequest("Invalid UserType"));
    }
    const isVerified = user.payload.userData.isVerified;

    if (!user.payload.userData.userData) {
      return next(CustomError.badRequest("please Signup Again"));
    }
    const { email, password } = user.payload.userData.userData;

    if (!isVerified) {
      return next(CustomError.badRequest("Unverified User"));
    }

    if (!req.file) {
      return next(CustomError.badRequest("Image not found"));
    }

    let findUser = await authModel.findOne({ email });

    let authData = {
      userType,
      isVerified,
      email,
      password,
      isProfileCompleted: true,
    };
    const Auth = new authModel(authData);
    await Auth.save();

    findUser = await authModel.findOne({ email });

    const userProfileData = {
      fullName,
      preference,
      address,
      phone,
      userType,
      userId: findUser._id,
    };

    const User = new profileModel(userProfileData);
    await User.save();

    if (req.file) {
      const file = req.file;
      const fileData = {
        file: file.filename,
        fileType: file.mimetype,
        user: findUser._id,
      };

      const fileUploadModelInstance = await fileUploadModel.create(fileData);
      // Update the profileModel with the fileUploadModel's ID
      const updatedProfile = await profileModel.findOneAndUpdate(
        { userId: findUser._id },
        { image: fileUploadModelInstance._id },
        { new: true }
      );

      // Check if the update was successful
      if (!updatedProfile) {
        return next(
          CustomError.createError("Failed to update profile with image", 500)
        );
      }
    }

    const token = await OtptokenGen({ authData });
    return next(
      CustomSuccess.createSuccess(
        { token, userProfileData, authData },
        "User Profile created successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const createCarProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { carName, licenseNumber, carPlateNumber, modelCar } = req.body;
    const { email, isProfileCompleted } = user.payload.userData.authData;

    if (!isProfileCompleted) {
      return next(CustomError.badRequest("complete User Profile"));
    }

    // if (!carName || !licenseNumber|| !carPlateNumber|| !modelCar) {
    //   return next(CustomError.badRequest("fill all fields"));
    // }
    const { error } = CarProfileValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    if (!req.file) {
      return next(CustomError.badRequest("Image not found"));
    }

    let findUser = await authModel.findOne({ email });

    const authData = {
      isCarInfoCompleted: true,
    };

    await authModel.findOneAndUpdate({ _id: findUser._id }, authData, {
      new: true,
    });
    // findUser.save();

    const carProfileData = {
      carName,
      licenseNumber,
      carPlateNumber,
      modelCar,
      userId: findUser._id,
    };

    const Cars = new carModel(carProfileData);
    await Cars.save();

    if (req.file) {
      const file = req.file;
      const fileData = {
        file: file.filename,
        fileType: file.mimetype,
        user: findUser._id,
      };

      const fileUploadModelInstance = await fileUploadModel.create(fileData);

      const updatedCar = await carModel.findOneAndUpdate(
        { userId: findUser._id },
        { image: fileUploadModelInstance._id },
        { new: true }
      );
      if (!updatedCar) {
        return next(
          CustomError.createError("Failed to update profile with image", 500)
        );
      }
    }
    // const token = await tokenGen(
    //   { carProfileData },
    //   "auth",
    //   req.body.deviceToken
    // );

    return next(
      CustomSuccess.createSuccess(
        { carProfileData, authData },
        "Car Profile created successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const LoginUser = async (req, res, next) => {
  try {
    const { error } = LoginUserValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email, password, deviceType, deviceToken } = req.body;
    const AuthModel = await authModel.findOne({ email });

    if (!AuthModel) {
      return next(CustomError.badRequest("User Not Found"));
    }
    // if (!AuthModel.isVerified) {
    //   let otp = Math.floor(Math.random() * 900) + 1000;
    //   otpExist = await OtpModel.create({
    //     auth: dataExist._id,
    //     otpKey: otp,
    //     reason: "forgetPassword",
    //     expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
    //   });
    //   await otpExist.save();
    //   return next(CustomError.badRequest("VerifyOtp", otp));
    // }
    // console.log(AuthModel);

    const isPasswordValid = comparePassword(password, AuthModel.password);
    if (!isPasswordValid) {
      return next(CustomError.unauthorized("Invalid Password"));
    }

    if (!AuthModel.isCarInfoCompleted) {
      const authData = {
        email,
        password,
        isProfileCompleted: true,
      };
      const token = await OtptokenGen({ authData });
      return next(
        CustomSuccess.createSuccess(
          { token, authData },
          "CarInfo is not completed",
          200
        )
      );
      return next(
        CustomSuccess.createSuccess({}, "CarInfo is not completed", 200)
      );
    }

    const device = await linkUserDevice(AuthModel._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }

    const token = await tokenGen(
      { id: AuthModel._id, userType: AuthModel.userType },
      "auth",
      deviceToken
    );
    return next(
      CustomSuccess.createSuccess(
        { AuthModel, token },
        "User loged in successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { error } = forgetpasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email } = req.body;

    const dataExist = await authModel.findOne({
      email: email,
      isDeleted: false,
    });

    if (!dataExist) {
      return next(CustomError.badRequest("User Not Found"));
    }
    let otp = Math.floor(Math.random() * 900) + 1000;
    let otpExist = await OtpModel.findOne({ auth: dataExist._id });
    if (otpExist) {
      await OtpModel.findOneAndUpdate(
        { auth: dataExist._id },
        {
          otpKey: await bcrypt.hash(otp.toString(), genSalt),
          reason: "forgetPassword",
          otpUsed: false,
          expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        }
      );
    } else {
      otpExist = await OtpModel.create({
        auth: dataExist._id,
        otpKey: otp,
        reason: "forgetPassword",
        expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
      });
      await otpExist.save();
    }

    await authModel.findOneAndUpdate({ email }, { otp: otpExist._id });
    const emailData = {
      subject: "ParkMate - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >

    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
  
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To ParkMate</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi,</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      // attachments: [
      //   {
      //     filename: "logo.jpg",
      //     path: "./assets/logo.jpg",
      //     cid: "logo",
      //     contentDisposition: "inline",
      //   },
      // {
      //   filename: "bg.png",
      //   path: "./Uploads/bg.png",
      //   cid: "background",
      //   contentDisposition: "inline",
      // },
      // ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html
      // emailData.attachments
    );
    const token = await tokenGen(
      { id: dataExist._id, userType: dataExist.userType },
      "forgetPassword"
    );

    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        "OTP for forgot password is sent to given email",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const VerifyOtp = async (req, res, next) => {
  try {
    console.log("reqreqerq");
    console.log(req.user);
    // if (req.user.tokenType != "forgetPassword") {
    //   return next(
    //     CustomError.createError("Token type is not forgot password", 200)
    //   );
    // }

    const { error } = verifyOTPValidator.validate(req.body);
    if (error) {
      error.details.map((err) => {
        next(CustomError.createError(err.message, 200));
      });
    }

    const { otp, deviceToken, deviceType } = req.body;
    const { email } = req.user;

    const user = await authModel.findOne({ email }).populate(["otp"]);
    console.log(user, "uuuuuuuuuuuuu");
    if (!user) {
      return next(CustomError.createError("User not found", 200));
    }
    const OTP = user.otp;
    if (!OTP || OTP.otpUsed) {
      return next(CustomError.createError("OTP not found", 200));
    }
    const userOTP = await bcrypt.hash(otp.toString(), genSalt);
    console.log(userOTP, "userOTP");
    console.log(OTP.otpKey, "OTP.otpKey");
    if (OTP.otpKey !== userOTP) {
      return next(CustomError.createError("Invalid OTP", 401));
    }

    const currentTime = new Date();
    const OTPTime = OTP.updatedAt;
    const diff = currentTime.getTime() - OTPTime.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes > 60) {
      return next(CustomError.createError("OTP expired", 200));
    }
    const device = await linkUserDevice(user._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }
    const token = await tokenGen(user, "verify otp", deviceToken);

    const bulkOps = [];
    const update = { otpUsed: true, otpKey: null };
    // let  userUpdate ;
    if (OTP._doc.reason !== "forgetPassword") {
      bulkOps.push({
        deleteOne: {
          filter: { _id: OTP._id },
        },
      });
      // userUpdate.OTP = null;
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: OTP._id },
          update: { $set: update },
        },
      });
    }
    OtpModel.bulkWrite(bulkOps);
    // AuthModel.updateOne({ identifier: user.identifier }, { $set: userUpdate });
    // user.profile._doc.userType = user.userType;
    // const profile = { ...user.profile._doc, token };
    // delete profile.auth;

    return next(
      CustomSuccess.createSuccess(
        { ...user._doc, token },
        "OTP verified successfully",
        200
      )
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("otp not verify", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { user } = req;
    let email, password;
    let otp = Math.floor(Math.random() * 900) + 1000;
    console.log("user.payload.tokenType");
    console.log(user.payload.tokenType);
    if (user.payload.tokenType === "forgetPassword") {
      console.log("forgetfeorde");
      const AuthModel = await authModel.findOne({ _id: user.payload.uid });
      let otpExist = await OtpModel.findOne({ auth: AuthModel._id });
      if (otpExist) {
        await OtpModel.findOneAndUpdate(
          { auth: AuthModel._id },
          {
            otpKey: await bcrypt.hash(otp.toString(), genSalt),
            reason: "forgetPassword",
            otpUsed: false,
            expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
          }
        );
      } else {
        otpExist = await OtpModel.create({
          auth: AuthModel._id,
          otpKey: otp,
          reason: "forgetPassword",
          expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        });
        await otpExist.save();
      }
      console.log(AuthModel);
      email = AuthModel.email;
      password = AuthModel.password;
    } else {
      email = user.payload.userData.newUser.email;
      password = user.payload.userData.newUser.password;
    }

    const emailData = {
      subject: "Park-Mate - Account Verification",
      html: `
<div
  style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
>
  <img 
        style="
        top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
        src="cid:background" alt="background" 
  />
  <div style="z-index:1; position: relative;">
  <header style="padding-bottom: 20px">
    <div class="logo" style="text-align:center;">
      <img 
        style="width: 150px;" 
        src="cid:logo" alt="logo" />
    </div>
  </header>
  <main 
    style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
  >
    <h1 
      style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
    >Welcome To ParkMate</h1>
    <p
      style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
    >Hi,</p>
    <p 
      style="font-size: 20px; text-align: left; font-weight: 500;"
    > Please use the following OTP to reset your password.</p>
    <h2
      style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
    >${otp}</h2>
    <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
    style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
    >let us know.</a></p>
    <p style = "font-size: 20px;">Regards,</p>
    <p style = "font-size: 20px;">Dev Team</p>
  </main>
  </div>
<div>
`,
      attachments: [
        {
          filename: "logo.jpg",
          path: "./assets/logo.jpg",
          cid: "logo",
          contentDisposition: "inline",
        },
        // {
        //   filename: "bg.png",
        //   path: "./Uploads/bg.png",
        //   cid: "background",
        //   contentDisposition: "inline",
        // },
      ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );

    //user creds
    const newUser = {
      email,
      password,
    };

    const token = await OtptokenGen({ newUser, otp });

    //jwt.sign({userData:newUser , otp:userOTP} , 'secret' , {expiresIn:1})

    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        // { token },
        "Verification OTP has been sent",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { error } = changePasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { user } = req;
    console.log(user);
    console.log("UID", user.payload.uid);

    const { old_password, new_password } = req.body;
    const AuthModel = await authModel.findOne({ _id: user.payload.uid });
    if (!AuthModel) {
      return next(CustomError.badRequest("User Not Found"));
    }
    const isMatch = comparePassword(old_password, AuthModel.password);
    if (!isMatch) {
      return next(CustomError.badRequest("Old Password is Incorrect"));
    }
    AuthModel.password = hashPassword(new_password);
    await AuthModel.save();
    return next(
      CustomSuccess.createSuccess(
        { AuthModel },
        "Password Changed Successfully",
        200
      )
    );
  } catch (error) {
    console.error(error, "Error in resetPassword");
    return next(CustomError.badRequest(error.message));
  }
};

const resetpassword = async (req, res, next) => {
  try {
    if (req.user.tokenType != "verify otp") {
      return next(
        CustomError.createError("First verify otp then reset password", 200)
      );
    }
    const { error } = ResetPasswordValidator.validate(req.body);

    if (error) {
      error.details.map((err) => {
        next(err.message, 200);
      });
    }

    // const { devicetoken } = req.headers;

    const { email } = req.user;
    // if (req.user.devices[req.user.devices.length - 1].deviceToken != devicetoken) {
    //   return next(CustomError.createError("Invalid device access", 200));
    // }

    const updateuser = await authModel.findOneAndUpdate(
      { email },
      {
        password: await bcrypt.hash(req.body.password, genSalt),
        otp: null,
      },
      { new: true }
    );

    // if (!updateuser) {
    //   return next(CustomError.createError("password not reset", 200));
    // }

    const user = await authModel.findOne({ email });
    const token = await tokenGen(user, "auth", req.body.deviceToken);

    const profile = { ...user._doc, token };
    delete profile.password;

    return next(
      CustomSuccess.createSuccess(profile, "Password reset succesfully", 200)
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("code not send", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const { user } = req;
    const findCar = await carModel.findOne({ userId: user._id }).populate({
      path: "image",
      select: "-_id file",
    });

    const findProfile = await profileModel
      .findOne({ userId: user._id })
      .populate({
        path: "userId",
        // select: "email",
      })
      .populate({
        path: "image",
        select: "-_id file",
      });

    const imageUrl =
      "https://parkmate-api.thesuitchstaging.com/parkmate/Uploads/"; // Replace with your live image URL prefix
    findCar.image.file = imageUrl + findCar.image.file;
    findProfile.image.file = imageUrl + findProfile.image.file;

    const UserDetails = {
      findProfile,
      findCar,
    };
    return next(
      CustomSuccess.createSuccess(
        UserDetails,
        "Profile Details get successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const logout = async (req, res, next) => {
  try {
    const { deviceType, deviceToken } = req.body;

    unlinkUserDevice(req.user._id, deviceToken, deviceType);
    return next(
      CustomSuccess.createSuccess({}, "User Logout Successfully", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 200));
  }
};

const updateProfile = async (req, res, next) => {
  // console.log("fdfd");
  try {
    const { user } = req;

    console.log(user, "sdasdas");
    const { error } = updateUserProfileValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    // console.log(req.file);
    if (req.file) {
      const file = req.file;
      const fileData = {
        file: file.filename,
        fileType: file.mimetype,
        user: user._id,
      };
      const fileUploadModelInstance = await fileUploadModel.findOneAndUpdate(
        { user: user._id },
        fileData,
        { new: true }
      );
      // fileUploadModelInstance.save();
      const ProfileImgUpdate = await profileModel.findOneAndUpdate(
        { userId: user._id },
        { image: fileUploadModelInstance._id },
        { new: true }
      );
    }

    const dataExist = await profileModel.findOne({ userId: user._id });

    if (!dataExist) {
      return next(CustomError.badRequest("User Not Found"));
    }

    dataExist.fullName = req.body.fullName || dataExist.fullName;
    dataExist.phone = req.body.phone || dataExist.phone;
    dataExist.address = req.body.address || dataExist.address;
    dataExist.preference = req.body.preference || dataExist.preference;

    dataExist.save();

    return next(
      CustomSuccess.createSuccess({}, "Profile Updated Successfully", 200)
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const updateCar = async (req, res, next) => {
  // console.log("fdfd");
  try {
    const { user } = req;

    console.log(user, "sdasdas");
    const { error } = updateUserProfileValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const findCar = await carModel.findOne({ userId: user._id });
    // console.log(req.file);
    if (req.file) {
      const file = req.file;
      const fileData = {
        file: file.filename,
        fileType: file.mimetype,
        user: user._id,
      };
      const fileUploadModelInstance = await fileUploadModel.findOneAndUpdate(
        { user: user._id },
        fileData,
        { new: true }
      );
      // fileUploadModelInstance.save();
      const ProfileImgUpdate = await carModel.findOneAndUpdate(
        { _id: findCar._id },
        { image: fileUploadModelInstance._id },
        { new: true }
      );
    }

    const dataExist = await carModel.findOne({ userId: user._id });

    if (!dataExist) {
      return next(CustomError.badRequest("User Not Found"));
    }

    dataExist.carName = req.body.carName || dataExist.carName;
    dataExist.modelCar = req.body.modelCar || dataExist.modelCar;
    dataExist.carPlateNumber =
      req.body.carPlateNumber || dataExist.carPlateNumber;
    dataExist.licenseNumber = req.body.licenseNumber || dataExist.licenseNumber;

    dataExist.save();

    return next(
      CustomSuccess.createSuccess({}, "Profile Updated Successfully", 200)
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const AuthController = {
  createUserProfile: [handleMultipartData.single("image"), createUserProfile],
  createCarProfile: [handleMultipartData.single("image"), createCarProfile],
  updateProfile: [handleMultipartData.single("image"), updateProfile],
  updateCar: [handleMultipartData.single("image"), updateCar],

  createProfile,
  verifyProfile,
  LoginUser,
  // getProfile,
  forgetPassword,
  VerifyOtp,
  changePassword,
  resetpassword,
  logout,
  resendOtp,
  getUserDetails,
  // updateProfile,
  //   SocialLoginUser,
};

export default AuthController;
