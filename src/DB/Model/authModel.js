import mongoose from "mongoose";
import { hashPassword } from "../../Utils/SecuringPassword.js";

const AuthSchema = mongoose.Schema(
  {
   
    fullName: {
      type: String,
      required: false,
      trim: true,
    
    },

    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
    },

    isProfileCompleted: {
      type: Boolean,
      // required: true,
      default:false
    },
    isCarInfoCompleted: {
      type: Boolean,
      // required: true,
      default:false
    },
    isVerified: {
      type: Boolean,
      required: false,
      default:false
    },

    userType: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    notificationOn: {
      type: Boolean,
      default: true,
    },
    devices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "device",
      },
    ],

    otp: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "otp",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
// AuthSchema.pre("update", function (next) {
//   // do something
//   console.log(this.isModified('password'));
//   if (!this.isModified('password')) return next();
//   this.password = hashPassword(this.password);

//   next(); //dont forget next();
// });

const authModel = mongoose.model("auth", AuthSchema);
export default authModel;
