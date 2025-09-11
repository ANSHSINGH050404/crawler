import mongoose from "mongoose";

const sharedTodoSchema = new mongoose.Schema(
  {
    todoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Todo", // must be string (model name)
      required: true,
    },
    sharedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor"],
      default: "viewer",
    },
  },
  { timestamps: true }
);

const SharedTodo = mongoose.model("SharedTodo", sharedTodoSchema);

export default SharedTodo;
