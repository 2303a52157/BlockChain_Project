# Blockchain-Based Student Skill Verification System

## Folder structure
```
contracts/SkillVerification.sol   Solidity smart contract
test/SkillVerification.test.js    Hardhat tests (5 planned test cases + revoke)
scripts/deploy.js                 Deploy script
backend/                          Node.js + Express + MongoDB + ethers.js
frontend/                         React (Vite) – student / admin / recruiter screens
```

## Run it
```bash
# 1. Contract
npm install
npx hardhat test
npx hardhat node                      # terminal 1 (local chain)
npm run deploy:local                  # terminal 2 -> prints CONTRACT_ADDRESS

# 2. Backend
cd backend && npm install
cp .env.example .env                  # fill CONTRACT_ADDRESS + ADMIN_PRIVATE_KEY
                                      # (hardhat node prints account #0 key; it is the contract owner/admin)
node src/seedAdmin.js                 # creates admin@sru.edu
npm start

# 3. Frontend
cd ../frontend && npm install && npm run dev
```
Make sure MongoDB is running locally.

## Demo flow
Student uploads PDF -> Admin approves (hash goes on-chain) -> Recruiter uploads same PDF + ID -> Verified.
Edit the PDF and upload again -> Not verified.
