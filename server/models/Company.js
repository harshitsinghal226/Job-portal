import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String, required: false, default: null },
  password: { type: String, required: true },
  resetPasswordToken: { type: String, required: false, default: null },
  resetPasswordExpires: { type: Date, required: false, default: null },
}, {
  timestamps: true
})

const Company = mongoose.model("Company", companySchema);
export default Company;