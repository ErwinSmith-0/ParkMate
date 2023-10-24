import mongoose from "mongoose";
import { hashPassword } from "../../Utils/SecuringPassword.js";

const UserSchema = mongoose.Schema(
  {
    
    image:{    
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "fileUpload",
    },
    // user: findUser._id,
    // fullName:req.body.fullName,
    // phone: req.body.phone,
    // address: req.body.address,
    // preference: req.body.preference,
    fullName: {
        type: String,
        required: false,
      },
      phone: {
      type: Number,
      required: false,
    },
    address: {
        type: String,
        required: false,
    },
      preference: {
        type: String,
        required: false,
       },
    //   pharmacyName: {
    //     type: String,
    //     required: true,
    //   },
      userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "auth",
    },

    // location: {
    //   type: {
    //     type: String,
    //     enum: ['Point'],
    //     required: false,
    //     default:"Point"
    //   },
    //   coordinates: {
    //     type: [Number], // Change to Number data type
    //     required: false,
    //     default:[ 95.7129 , 37.0902]
    //   },
    // },


  },
  {
    timestamps: true,
  }
);

UserSchema.index({ coordinates: "2dsphere" });
const userModel = mongoose.model("user", UserSchema);
export default userModel;
