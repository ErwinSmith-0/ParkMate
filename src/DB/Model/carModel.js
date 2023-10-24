import mongoose from "mongoose";

const CarSchema = mongoose.Schema(
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
    carName: {
      type: String,
      required: false,
      trim: true,    
    },
    modelCar: {
        type: String,
        trim: true,
        required: false,
        default: "",
      },
    carPlateNumber: {
      type: String,
      required: true,
      trim: true,    
    },    
    licenseNumber: {
        type: String,
        required: true,
      },    
  },
  {
    timestamps: true,
  }
);

const carModel = mongoose.model("cars", CarSchema);
export default carModel;
