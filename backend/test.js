import dotenv from 'dotenv';
dotenv.config();

console.log("Mongo URI:", process.env.MONGO_URI);
console.log("Gemini Key:", process.env.GEMINI_API_KEY);

if (process.env.MONGO_URI === 'your_mongodb_uri') {
  console.log('ERROR: MONGO_URI is still the placeholder.');
}
