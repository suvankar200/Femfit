import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    cycleLength:    { type: Number, required: true },
    periodDuration: { type: Number, required: true },
    lastPeriodDate: { type: String, required: true },
  },
  { timestamps: true }
);

const Cycle = mongoose.models.Cycle || mongoose.model('Cycle', cycleSchema);

export const findByUserId = async (userId) =>
  Cycle.findOne({ userId }).lean();

export const upsertCycle = async (userId, { cycleLength, periodDuration, lastPeriodDate }) => {
  const cycle = await Cycle.findOneAndUpdate(
    { userId },
    { cycleLength, periodDuration, lastPeriodDate },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return cycle;
};
