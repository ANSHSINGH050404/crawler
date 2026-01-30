import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: String,
    company: String,
    location: String,
    url: String,
    source: String,
    datePosted: { type: Date, default: Date.now }
});

export default mongoose.model('Job', jobSchema);
