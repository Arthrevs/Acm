require('dotenv').config();
const { runPipeline } = require('./services/pipeline');

async function test() {
  try {
    const res = await runPipeline("Urgent! Pay 5000 rs advance now or account blocked. Click bit.ly/123");
    console.log("SUCCESS:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("PIPELINE ERROR:", err.message, err.stack);
  }
}
test();
