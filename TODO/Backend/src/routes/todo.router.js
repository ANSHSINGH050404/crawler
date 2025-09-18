// routes/todo.routes.js
import express from "express";
import { addTodo,getTodos,updateTodo,deleteTodo } from "../controllers/todo.controller.js";
import { protect } from  "../middlewares/auth.middleware.js";

const todosrouter = express.Router();

// POST /api/todos → create new todo (protected)
todosrouter.post("/", protect, addTodo);
todosrouter.get("/", protect, getTodos);
todosrouter.put("/:id", protect, updateTodo);
todosrouter.delete("/:id", protect, deleteTodo);

export default todosrouter;
