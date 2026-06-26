import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (issueId, action, actorId) => {
    try {
        const lastLog = await AuditLog.findOne().sort({ _id: -1 });
        const previousHash = lastLog ? lastLog.currentHash : '0';
        
        const timestamp = new Date();
        
        const dataToHash = `${previousHash}${issueId}${action}${actorId}${timestamp.toISOString()}`;
        const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        
        const newLog = new AuditLog({
            issueId,
            action,
            actorId,
            timestamp,
            previousHash,
            currentHash
        });
        
        await newLog.save();
        return newLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
        throw error;
    }
};
