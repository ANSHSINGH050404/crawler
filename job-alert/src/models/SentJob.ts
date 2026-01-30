import mongoose from 'mongoose';

const sentJobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    sentAt: { type: Date, default: Date.now }
});

export default mongoose.model('SentJob', sentJobSchema);
