import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Issue from './models/Issue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const issues = await Issue.find().sort({ createdAt: -1 }).limit(5);
    console.log("Latest 5 issues:");
    issues.forEach(i => {
      console.log(`- ID: ${i._id}`);
      console.log(`  Location: ${JSON.stringify(i.location)}`);
      console.log(`  MediaURL: ${i.mediaUrl}`);
      console.log(`  Category: ${i.category}, Status: ${i.status}, Upvotes: ${i.upvotes}`);
      console.log(`  Desc: ${i.aiDescription}`);
      console.log('---');
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkDb();
