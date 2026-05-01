import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: String,
  status: { type: String, default: "Todo" },
  assignedTo: String,
  projectId: String,
  dueDate: Date
});

export default mongoose.models.Task || mongoose.model("Task", schema);