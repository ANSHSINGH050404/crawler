import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please use another email",
      });
    }

    // hash password (only if you're NOT using pre-save hook)
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = new UserModel({
      username,
      email,
      password: hashedPassword, // or just `password` if pre-save hook is enabled
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
