import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    preferences: {
        keywords: [String],
        locations: [String]
    }
});

export default mongoose.model('User', userSchema);
