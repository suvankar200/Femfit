import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, required: true },
    answers: { type: mongoose.Schema.Types.Mixed },
    result:  { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Index for fast user+type queries
assessmentSchema.index({ userId: 1, type: 1, createdAt: -1 });

const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);

export const saveAssessment = async (userId, type, answers, result) => {
  const record = await Assessment.create({ userId, type, answers, result });
  return record.toObject();
};

export const getAssessmentsByUser = async (userId, type = null) => {
  const query = { userId };
  if (type) query.type = type;
  return Assessment.find(query).sort({ createdAt: -1 }).lean();
};

export const getLatestAssessments = async (userId) => {
  const all = await Assessment.find({ userId }).sort({ createdAt: -1 }).lean();
  const latest = {};
  for (const a of all) {
    if (!latest[a.type]) latest[a.type] = a;
  }
  return latest;
};
