import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { sendToken } from '../utils/jwtUtils.js';

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role && ['user', 'admin'].includes(role) ? role : 'user';

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
    });

    sendToken(newUser, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    sendToken(user, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserStatus = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { _id, name, email, role } = req.user;
  res.status(200).json({ user: { id: _id, name, email, role } });
};