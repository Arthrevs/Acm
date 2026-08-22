require('dotenv').config({ path: './backend/.env' });
const { runPipeline } = require('./backend/services/pipeline');

async function test() {
  try {
    const res = await runPipeline("Urgent! Pay 5000 rs advance now or account blocked. Click bit.ly/123");
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("PIPELINE ERROR:");
    console.error(err);
  }
}
test();
