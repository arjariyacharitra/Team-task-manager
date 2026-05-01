import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: String,
  createdBy: String,
  members: [String]
});

export default mongoose.models.Project || mongoose.model("Project", schema);