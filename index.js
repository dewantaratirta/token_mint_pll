import dotenv from "dotenv";
import { ethers, formatEther } from "ethers";
import * as fs from "node:fs";
import chalk from "chalk";
import { exit } from "node:process";

const env = dotenv.config()?.parsed;

// config
const MINIMUM_BALANCE = 0.5; // Eth
const EXIT_ON_LOW_BALANCE = true; // exit when reach minimum balance

const alchemyProvider = new ethers.AlchemyProvider(
  "sepolia",
  env.ALCHEMY_API_KEY
);

// load wallet from mnemonic
const choose_wallet =
  process.env?.wallet == undefined
    ? env?.MNEMONIC
    : env?.[`MNEMONIC${process.env?.wallet}`];
const wallet = ethers.Wallet.fromPhrase(choose_wallet);
const { address: wallet_address, privateKey } = wallet;

const getBalance = async () => {
  let balance = await alchemyProvider.getBalance(wallet_address);
  return parseFloat(formatEther(balance)).toFixed(4);
};

var current_balance = await getBalance();

console.log(`Your wallet address:` + chalk.blue(wallet_address));
console.log(`Your balance is: ` + chalk.yellow(current_balance + " ETH"));
console.log(`===========================================================`);

// read the abi file from contract
const abi = fs.readFileSync("contract_abi.txt", "utf8");

var mint_count = 1;
const mint = async () => {
  console.log(`Minting Token ` + chalk.green("x" + mint_count));
  const signer = new ethers.Wallet(privateKey, alchemyProvider);
  const parallel_contract = new ethers.Contract(
    env.CONTRACT_ADDRESS,
    abi,
    wallet_address
  );
  const contractWithSigner = await parallel_contract.connect(signer);

  mint_count++;
  try {
    const tx = await contractWithSigner.mint(wallet_address);
    await tx.wait();
    console.log("Transaction confirmed! Token successfully claimed!");
    if (mint_count % 5 == 0) {
      current_balance = await getBalance();
      if (current_balance < MINIMUM_BALANCE) {
        console.log(chalk.red("    WARNING !!!"));
        console.log(
          `Low balance, current balance is: ` +
            chalk.red(current_balance + " ETH")
        );
        console.log("Exit program");
        if (EXIT_ON_LOW_BALANCE) exit();
      } else {
        console.log(
          `Your balance is: ` + chalk.yellow(current_balance + " ETH")
        );
      }
    }
  } catch (err) {
    console.log("Error:" + err.message);
  }
};

// random minting timeout to avoid suspicion
const min_timeout = 1000;
const max_timeout = 10000;

const rand = () => {
  let res = parseInt(Math.random() * (max_timeout - min_timeout) + min_timeout);
  return res;
};

const start = async () => {
  setTimeout(async () => {
    await mint();
    start();
  }, rand());
};

start();
