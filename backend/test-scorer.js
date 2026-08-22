const { scoreHeuristics } = require('./layers/heuristicScorer');
const { normalizeText } = require('./utils/normalizer');

// LEGITIMATE MESSAGES (Must score < 20 / SAFE)
const legitSuite = [
  "Dear Customer, your Swiggy Instamart order has been delivered.",
  "Your Swiggy OTP for login is 549210. Do not share this with anyone. Swiggy employees will never ask for your OTP.",
  "Bank will never ask for your OTP, PIN or CVV. Do not share it with anyone.",
  "SBI Alert: Dear customer, please note that we will never ask you to tell us your PIN or password.",
  "Your salary of Rs 45,000 has been credited to your HDFC bank account.",
  "Reminder: Your electricity bill of Rs 1,450 is due on 24th Oct. Please pay immediately to avoid late fees.",
  "Your Amazon package is out for delivery. Our delivery partner will contact you shortly.",
  "Dear team, please send the Q3 report immediately so we can review it.",
  "Do not tell your card number to anyone calling from customer support. We do not ask for it.",
  "Your flight booking is confirmed. Your PNR is XYZ123.",
  "Your Zomato delivery executive is arriving in 5 mins.",
  "ICICI Bank: Rs 500 debited from A/C XX123. If not done by you, block your card immediately.",
  "Your subscription will be cancelled if you do not renew today.",
  "Welcome to the department. Please reach out to the HR team for your orientation.",
  "HDFC Bank: Do not share your banking password or OTP with anyone to stay safe from fraud.",
  "OTP for login is 99281. Pls don't share with anyone.",
  "You have successfully paid Rs 150 for your electricity bill via PhonePe.",
  "Your KYC update was successful.",
  "Your Axis Bank credit card ending in 9982 is dispatched.",
  "Maa, main ghar pahunch gaya. Khana kha liya hai. Chinta mat karna."
];

// ADVERSARIAL/SCAM MESSAGES (Must score >= 20, preferably >= 40 for SCAM)
const adversarialSuite = [
  "Dear SBI User, your NetBanking is blocked. Update PAN on sbi-kyc-pan.co.in to unblock immediately.",
  "Electricity power disconnected at 9:30 PM due to unpaid bill. Call officer: 8877665544.",
  "FedEx: Your parcel is detained by customs. Press 1 to speak with Narcotics Bureau.",
  "This is CBI officer. You are under digital arrest for illegal bank transaction.",
  "Pls send advance payment of Rs 500 to confirm your booking.",
  "Download our QuickSupport apk to fix your bank account.",
  "Share your OTP with our customer support team to receive your lottery money.",
  "Yor bnk acount will be suspnded. share pin jaldi.", // Evasion typo testing
  "callng frm cstmr sport. tel ur card number imdtly", // Deep phonetic evasion
  "You won a lottery of 50,00,000. Send registration fee to claim."
];

console.log("==================================================");
console.log("      HEURISTIC SCORER STRESS TEST RESULTS        ");
console.log("==================================================");

let falsePositives = 0;
let falseNegatives = 0;

console.log("\n--- LEGITIMATE SUITE (Target: SAFE) ---");
legitSuite.forEach(text => {
  const normalized = normalizeText(text);
  const result = scoreHeuristics(normalized, { urls: [] });
  const verdict = result.classification.verdict;
  
  if (verdict !== 'SAFE') {
    falsePositives++;
    console.log(`[FAIL] FP: ${verdict} | Score: ${result.totalScore} | Text: "${text}"`);
    console.log("       Breakdown:", result.breakdown);
  } else {
    // console.log(`[PASS] SAFE | Score: ${result.totalScore}`);
  }
});

console.log("\n--- ADVERSARIAL SUITE (Target: SUSPICIOUS/SCAM) ---");
adversarialSuite.forEach(text => {
  const normalized = normalizeText(text);
  const result = scoreHeuristics(normalized, { urls: [] });
  const verdict = result.classification.verdict;
  
  if (verdict === 'SAFE') {
    falseNegatives++;
    console.log(`[FAIL] FN: SAFE | Score: ${result.totalScore} | Text: "${text}"`);
  } else {
    // console.log(`[PASS] ${verdict} | Score: ${result.totalScore} | Text: "${text}"`);
  }
});

console.log("\n==================================================");
console.log(`False Positives (Legit marked as Scam/Suspicious): ${falsePositives} / ${legitSuite.length}`);
console.log(`False Negatives (Scam marked as Safe): ${falseNegatives} / ${adversarialSuite.length}`);
console.log("==================================================");

if (falsePositives > 0 || falseNegatives > 0) {
  process.exit(1);
} else {
  console.log("All tests passed flawlessly. The taxonomy is stable.");
  process.exit(0);
}
