import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Issue from '../models/Issue.js'; 
import { protect } from '../middlewares/authMiddleware.js';
import { createAuditLog } from '../utils/ledger.js';
import { getIo } from '../socket.js';

const router = express.Router();

// Admin login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', {
                expiresIn: '30d',
            });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an issue's status to 'Resolved'
router.put('/issues/:id/resolve', protect, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (issue) {
            issue.status = 'Resolved';
            issue.resolvedAt = new Date();
            const updatedIssue = await issue.save();
            await createAuditLog(issue._id, 'RESOLVED', req.admin.id);
            getIo().emit('issue_updated', updatedIssue);
            res.json(updatedIssue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
