require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testVision() {
  try {
    const API_KEY = process.env.GEMINI_API_KEY_1;
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    // Create a dummy 1x1 transparent PNG base64
    const dummyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    const prompt = "What is in this image?";
    const image = {
      inlineData: {
        data: dummyImageBase64,
        mimeType: "image/png"
      }
    };
    
    console.log("Sending vision request to gemini-3.6-flash...");
    const result = await model.generateContent([prompt, image]);
    console.log("SUCCESS:", result.response.text());
  } catch (err) {
    console.error("VISION ERROR:", err.message);
  }
}

testVision();
