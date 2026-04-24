import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true },
    language:    { type: String, default: 'en' },
    dateOfBirth: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export const findByEmail = async (email) =>
  User.findOne({ email: email.toLowerCase().trim() }).lean();

export const findById = async (id) =>
  User.findById(id).lean();

export const createUser = async ({ name, email, password, language = 'en' }) => {
  const user = await User.create({ name, email, password, language });
  return user.toObject();
};

export const updateProfile = async (id, { name, dateOfBirth }) => {
  const updated = await User.findByIdAndUpdate(
    id,
    { ...(name && { name }), ...(dateOfBirth !== undefined && { dateOfBirth }) },
    { new: true }
  ).lean();
  return updated;
};
