import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    issueId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Issue'
    },
    action: {
        type: String,
        required: true
    },
    actorId: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    previousHash: {
        type: String,
        required: true
    },
    currentHash: {
        type: String,
        required: true
    }
});

export default mongoose.model('AuditLog', auditLogSchema);
