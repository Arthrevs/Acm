<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="120" alt="React Logo" />
  <h1>Vernacular Phishing Classifier</h1>
  <p><strong>A Multi-Agent AI Security Pipeline — Hackathon Build</strong></p>
</div>

---

## 🎯 What it is
A next-generation security tool designed to detect **vernacular phishing and smishing attempts** (Hinglish, regional dialects, OLX marketplace scams, KYC fraud). Traditional regex-based scanners fail against transliterated conversational text (e.g., *"paise bhej do"* or *"QR scan karo"*). This project solves that using a **Multi-Agent Consensus Pipeline** powered by Gemini AI.

## 🧠 How it works (The 4-Layer Architecture)

Instead of sending raw text directly to an LLM (which is slow and expensive), the system uses a highly deterministic 4-layer funnel:

1. 🧹 **Layer 1: Context Normalizer** — Strips out conversational filler ("Ok", "Haanji") and isolates high-risk chunks using a sliding window.
2. 🧮 **Layer 2: Heuristic Scorer** — Runs rapid, deterministic rule checks (URLs, QR mentions, urgency). If the score is low, it marks the message as SAFE instantly. If high, it triggers the AI.
3. 🤖 **Layer 3: Multi-Agent Consensus (The Core)**
   - **Agent 1 (The Paranoiac):** A strict threat extractor blind to nuance. Looks only for exploits.
   - **Agent 2 (The Context Arbiter):** A social analyst blind to threats. Looks only at power dynamics and trust patterns.
   - **Agent 3 (The Chief Judge):** Weighs the findings of Agent 1 and Agent 2 and renders a final verdict (Overrule, Strike, or Split).
4. 🛡️ **Layer 4: Verification Gate** — Cross-references extracted URLs against a domain blacklist and uses Levenshtein distance to detect typosquatting against known Indian brands (Paytm, SBI, etc.).

## 📁 Project Structure

```text
📦 project-root
 ┣ 📂 backend
 ┃ ┣ 📂 agents          # Multi-Agent Logic (Paranoiac, Context Arbiter, Chief Judge)
 ┃ ┣ 📂 layers          # Deterministic Layers (Normalizer, Heuristics, Verification)
 ┃ ┣ 📂 services        # Pipeline Orchestrator & LLM Integration (Key Rotation)
 ┃ ┣ 📂 utils           # Dictionary mapping and Regex Extractors
 ┃ ┣ 📜 index.js        # Express Server Entry Point
 ┃ ┗ 📜 .env            # Gemini API Keys
 ┣ 📂 frontend
 ┃ ┣ 📜 index.html      # Glassmorphism UI & Pipeline Tracker
 ┃ ┣ 📜 style.css       # Theming and Animations
 ┃ ┗ 📜 script.js       # API calls and DOM manipulation
 ┗ 📜 README.md         # You are here
```

## 🚀 Local Host Process

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) installed (v16 or higher recommended).
- Gemini API Keys (Get them from Google AI Studio).

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 2. Environment Variables
In the `backend` folder, create a `.env` file and add your Gemini API keys. The system uses round-robin key rotation to prevent rate-limiting during parallel agent execution:
```env
PORT=3000
GEMINI_API_KEY_1=your_api_key_here
GEMINI_API_KEY_2=your_second_key_here
GEMINI_API_KEY_3=your_third_key_here
```

### 3. Start the Server
Run the development server:
```bash
npm run dev
```

### 4. View the App
The Express backend automatically serves the vanilla frontend. Open your browser and navigate to:
👉 **http://localhost:3000**

---
*Built for the ACM Hackathon Problem 14.*
