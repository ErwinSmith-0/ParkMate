import mongoose from "mongoose";
import { hashPassword } from "../../Utils/SecuringPassword.js";

const ProfileSchema = mongoose.Schema(
  {
    image: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "fileUpload",
      },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    fullName: {
      type: String,
      required: false,
      trim: true,    
    },
    phone: {
        type: Number,
        trim: true,
        required: false,
        default: "",
      },
    address: {
      type: String,
      required: false,
      trim: true,    
    },    
    preference: {
        type: String,
        required: false,
      },    
  },
  {
    timestamps: true,
  }
);

const profileModel = mongoose.model("profiles", ProfileSchema);
export default profileModel;
