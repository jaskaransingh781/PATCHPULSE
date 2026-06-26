import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['SystemAdmin', 'Dispatcher', 'Inspector'],
        default: 'Inspector'
    }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
