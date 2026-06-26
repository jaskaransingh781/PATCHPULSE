import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import Issue from '../models/Issue.js';
import rateLimit from 'express-rate-limit';
import { createAuditLog } from '../utils/ledger.js';
import { getIo } from '../socket.js';

const router = express.Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // Increased for development/testing
  message: { error: 'Too many reports created from this IP, please try again after an hour.' }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'patchpulse_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
const upload = multer({ storage: storage });

router.post('/report', reportLimiter, upload.single('image'), async (req, res) => {
  try {
    const { longitude, latitude, reporterNotes, wardOrDistrict } = req.body;
    const file = req.file;

    // 1. Validate Input
    if (!file || !longitude || !latitude) {
      return res.status(400).json({ error: 'Image, longitude, and latitude are required.' });
    }

    const fileUrl = file.path; // Cloudinary URL

    // Fetch the image buffer from Cloudinary URL via Axios
    const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(imageResponse.data, 'binary');

    // 2. Setup Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // 3. Prepare Image Data for Gemini
    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: imageResponse.headers['content-type']
      }
    };

    // Stage 1: Gatekeeper AI (Content Moderation)
    const gatekeeperPrompt = `Is this image a valid civic infrastructure issue (e.g., pothole, water leak, broken streetlight, graffiti, damaged sidewalk, downed tree)? Reply with true if it is a valid issue, or false if it is a selfie, meme, pet, or irrelevant image.`;
    
    const gatekeeperResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [imagePart, { text: gatekeeperPrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            isValid: { type: "BOOLEAN", description: "True if civic infrastructure issue, false otherwise" }
          },
          required: ["isValid"]
        }
      }
    });

    const gatekeeperResult = JSON.parse(gatekeeperResponse.text);

    if (!gatekeeperResult.isValid) {
      // Kept for audit purposes, but rejected as a report
      return res.status(400).json({ 
        error: 'Image rejected by moderation. Please upload a valid civic infrastructure issue.',
        auditUrl: fileUrl 
      });
    }

    // Stage 2: Geospatial Search for Duplicate Detection
    const nearbyIssues = await Issue.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: 50 // 50 meters
        }
      },
      status: { $in: ['Reported', 'Verified', 'In Progress'] }
    });

    // Stage 3: AI Duplicate Comparison
    if (nearbyIssues.length > 0) {
      for (const closestIssue of nearbyIssues) {
        try {
          let urlToFetch = closestIssue.mediaUrl;
          if (urlToFetch.startsWith('/')) {
            urlToFetch = `http://localhost:${process.env.PORT || 5000}${urlToFetch}`;
          }
          
          const existingImageResponse = await axios.get(urlToFetch, { responseType: 'arraybuffer' });
          const existingFileBuffer = Buffer.from(existingImageResponse.data, 'binary');
          
          const existingImagePart = {
            inlineData: {
              data: existingFileBuffer.toString('base64'),
              mimeType: existingImageResponse.headers['content-type'] || 'image/jpeg'
            }
          };

          const comparePrompt = `Look at these two images of civic infrastructure issues. Do they show the exact same physical issue/damage? Reply with true if they are the same issue, or false if they are distinct issues.`;
          
          const compareResponse = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: [{ role: 'user', parts: [existingImagePart, imagePart, { text: comparePrompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  isSameIssue: { type: "BOOLEAN", description: "True if both images show the exact same physical issue" }
                },
                required: ["isSameIssue"]
              }
            }
          });

          const compareResult = JSON.parse(compareResponse.text);

          if (compareResult.isSameIssue) {
            closestIssue.upvotes += 1;
            
            if (closestIssue.upvotes === 3) {
              closestIssue.severity = 'Critical';
              await createAuditLog(closestIssue._id, 'ESCALATED', 'SYSTEM');
            }
            
            await closestIssue.save();
            getIo().emit('issue_updated', closestIssue);
            
            return res.status(200).json({ 
              success: true, 
              message: 'Duplicate issue detected. Upvoted existing issue.',
              issue: closestIssue 
            });
          }
        } catch (err) {
          console.error("Duplicate Comparison Error for issue " + closestIssue._id + ":", err.message);
          // Continue to the next issue to see if it's a match
        }
      }
    }

    // Stage 4: Standard AI Triage
    const triagePrompt = `Act as an expert Civic Infrastructure Inspector. Analyze this image of a civic issue. Provide the category, a severity assessment, and a brief professional description of the damage.
${reporterNotes ? `The citizen provided the following dictated notes: "${reporterNotes}". If this is in a foreign language (like Hindi, Punjabi, etc.), translate it to English and use it to add precise location context or details to your professional description.` : ''}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [imagePart, { text: triagePrompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: { 
              type: "STRING", 
              description: "The type of issue (e.g., Sanitation, Infrastructure, Safety, Roadway)" 
            },
            severity: { 
              type: "STRING", 
              enum: ["Low", "Medium", "Critical"] 
            },
            aiDescription: { 
              type: "STRING", 
              description: "A brief, professional description of the damage" 
            }
          },
          required: ["category", "severity", "aiDescription"]
        }
      }
    });

    const aiResult = JSON.parse(response.text);

    // 5. Save to MongoDB
    const newIssue = new Issue({
      mediaUrl: fileUrl, // Now points to our Cloudinary URL
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      category: aiResult.category,
      severity: aiResult.severity,
      aiDescription: aiResult.aiDescription,
      reporterNotes: reporterNotes || '',
      wardOrDistrict: wardOrDistrict || ''
    });

    await newIssue.save();

    // Create an immutable audit log for issue creation
    await createAuditLog(newIssue._id, 'CREATED', 'SYSTEM');

    getIo().emit('new_issue', newIssue);

    return res.status(201).json({ success: true, issue: newIssue });

  } catch (error) {
    console.error('Triage Error:', error);
    return res.status(500).json({ error: 'Failed to process report', details: error.message });
  }
});

// Fetch all issues for the map
router.get('/', async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, issues });
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

router.put('/:id/upvote', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    issue.upvotes = (issue.upvotes || 0) + 1;
    
    if (issue.upvotes === 3) {
      issue.severity = 'Critical';
      // Create an immutable audit log for automatic escalation
      await createAuditLog(issue._id, 'ESCALATED', 'SYSTEM');
    }
    
    await issue.save();
    getIo().emit('issue_updated', issue);
    return res.status(200).json({ success: true, issue });
  } catch (error) {
    console.error('Upvote Error:', error);
    return res.status(500).json({ error: 'Failed to upvote issue' });
  }
});

export default router;
