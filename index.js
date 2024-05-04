import dotenv from "dotenv";
import { ethers } from "ethers";
import * as fs from "node:fs";

const env = dotenv.config()?.parsed;

const alchemyProvider = new ethers.AlchemyProvider(
  "sepolia",
  env.ALCHEMY_API_KEY
);

// load wallet from mnemonic
const choose_wallet = (process.env?.wallet == undefined) ? env?.MNEMONIC : env?.[`MNEMONIC${process.env?.wallet}`];
const wallet = ethers.Wallet.fromPhrase(choose_wallet);
const { address: wallet_address, privateKey } = wallet;

console.log(`Your wallet address: ${wallet_address}`);

// read the abi file from contract
const abi = fs.readFileSync("contract_abi.txt", "utf8");

const mint = async () => {
  console.log("Minting Token");
  const signer = new ethers.Wallet(privateKey, alchemyProvider);
  const parallel_contract = new ethers.Contract(
    env.CONTRACT_ADDRESS,
    abi,
    wallet_address
  );
  const contractWithSigner = await parallel_contract.connect(signer);

  try {
    const tx = await contractWithSigner.mint(wallet_address);
    await tx.wait();
    console.log("Transaction confirmed! Token successfully claimed!");
  } catch (err) {
    console.log("Error:" + err.message);
  }
};

// random minting timeout to avoid suspicion
const min_timeout = 1000;
const max_timeout = 2000;

const rand = () => {
  let res = Math.random() * (max_timeout - min_timeout) + min_timeout;
  console.log(`random time: ${res}`);
  return res;
};

const start = async () => {
  setTimeout(async () => {
    await mint();
    start();
  }, rand());
};

start();
