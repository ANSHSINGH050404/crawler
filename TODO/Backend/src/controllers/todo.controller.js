import TodoModel from "../models/todo.model.js";

// controllers/todo.controller.js


export const addTodo = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    // Make sure user is logged in
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const todo = await TodoModel.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      userId: req.user._id, // link to logged-in user
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// controllers/todo.controller.js


export const getTodos = async (req, res) => {
  try {
    const todos = await TodoModel.find({ userId: req.user._id });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const todo = await TodoModel.findOne({ _id: req.params.id, userId: req.user._id });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    const updatedTodo = await TodoModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteTodo = async (req, res) => {
  try {
    const todo = await TodoModel.findOne({ _id: req.params.id, userId: req.user._id });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    await todo.deleteOne();
    res.json({ message: "Todo removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

