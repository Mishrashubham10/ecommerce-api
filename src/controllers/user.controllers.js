import mongoose from 'mongoose';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import { Address } from '../models/Address.js';

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      addresses,
    } = req.body;

    // Ensure only admin can call this
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ message: 'Only Admins can create users' });
    }

    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ message: 'Email, username and password are required' });
    }

    const allowedRoles = ['Customer', 'Admin', 'Seller'];
    const isRoleValid = allowedRoles.includes(role);
    const assignedRole = isRoleValid ? role : 'Customer';

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      username,
      password: hashedPwd,
      role: assignedRole,
      firstName,
      lastName,
      phone,
    });

    if (addresses?.length) {
      const addressDocs = await Address.insertMany(
        addresses.map((add) => ({ ...add, user: user._id }))
      );
      user.addresses = addressDocs.map((add) => add._id);
    }

    await user.save();

    res
      .status(201)
      .json({ message: `User '${user.username}' created successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
};

// GET USERS
export const getUsers = async (req, res) => {
  try {
    // 1. Authentication check (middleware should attach req.user)
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: No user info provided' });
    }

    // 2. Authorization check: Only Admin can access this
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }

    // 3. Optional filtering by role from query string
    const { role } = req.query;
    const allowedRoles = ['Customer', 'Admin', 'Seller'];

    const filter = {};
    if (role && allowedRoles.includes(role)) {
      filter.role = role;
    }

    // 4. Query the database
    const users = await User.find(filter).select('-password');

    // 5. Check if users were found
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // 6. Return result
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET USER
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ID input
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 2. Authentication check
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: Token required' });
    }

    // 3. Authorization check
    const isAdmin = req.user.role === 'Admin';
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // 4. Fetch user (excluding password)
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 5. Return user
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error while getting a user' });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  // GET THE ID OF THE USER BY REQ.PARAMS.ID
  const { id } = req.params;
  const updates = req.body;

  try {
    // ID CHECKING IF ITS VALID OR NOT
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // CHECKING USER BY ITS ROLE
    if (!req.user || !req.user?.id || !req.user?.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isAdmin = req.user?.role === 'Admin';
    const isSelf = req.user.id === id;

    // AUTHORIZATION: ONLY ADMIN OR USER THEMSELVES CAN UPDATE
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    // CONTROL UPDATE, CONTROL UNAUTHORIZED FIELDS (LIKE ROLE UPDATE BY NON-ADMIN)
    const allowedFields = ['username', 'email', 'password', 'addresses'];

    if (updates.role && !isAdmin) {
      return res.status(403).json({ message: 'Only admins can update roles' });
    }

    // FILTER OUT FIELDS : THAT ARE NOT ALLOWED TO UPDATE BY NON-ADMIN
    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key) || (key === 'role' && isAdmin)) {
        filteredUpdates[key] = updates[key];
      }
    }

    // IF PASSWORD IS BEING UPDATED THE HASH IT
    if (filteredUpdates.password) {
      filteredUpdates.password = await bcrypt.hash(
        filteredUpdates.password,
        10
      );
    }

    // FINNALY : UPDATE THS USER
    const newUser = await User.findByIdAndUpdate(id, filteredUpdates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!newUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res
      .status(200)
      .json({ message: 'User updated successfully', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error while updating a user' });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  // GET THE ID OF THE USER BY REQ.PARAMS.ID
  const { id } = req.params;

  try {
    // ID CHECKING IF ITS VALID OR NOT
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // CHECK AUTHENTICATIN
    if (!req.user?.id || !req.user?.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isAdmin = req.user.role === 'Admin';
    const isSelf = req.user.id === id;

    // AUTHORIZATION CHECK
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    // 4. Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // DELETE THE USER
    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: `User with ID ${id} deleted successfully` });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: err.messasge || 'Error while deleting a user' });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};