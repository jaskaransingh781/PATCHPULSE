import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// Import Routes
import issueRoute from './routes/issueRoute.js';
import adminRoute from './routes/adminRoute.js';
import analyticsRoute from './routes/analyticsRoute.js';
import { initSocket } from './socket.js';

import mongoose from 'mongoose';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ [DATABASE] MongoDB Connected Successfully!'))
  .catch((err) => console.error('❌ [DATABASE] MongoDB Connection Error:', err.message));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json());

// Serve uploads directory statically so frontend can access images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api/issues', issueRoute);
app.use('/api/admin', adminRoute);
app.use('/api/analytics', analyticsRoute);

app.get('/', (req, res) => res.send('PatchPulse API Running'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
