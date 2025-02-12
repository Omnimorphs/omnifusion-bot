require('dotenv').config();

const axios = require('axios');
const tweet = require('./tweet');
const discord = require("./discord");
const { ethers } = require('ethers');
const { db } = require('./db');

const processDelayMS = parseInt(process.env.PROCESS_DELAY);

const baseUri = process.env.BASE_URI;

const abi = ['event Fused(address sender, uint fusedId, uint burnedId, bytes32 fusionReceiptIPFSHash)'];

const address = process.env.CONTRACT_ADDRESS;

const provider = new ethers.providers.InfuraProvider(process.env.CONTRACT_NETWORK, process.env.INFURA_APIKEY);

const contract = new ethers.Contract(address, abi, provider);

const setLatestBlockNumber = (blockNumber) => {
  db.json.latestBlockHash = blockNumber;
  db.save();
}

/**
 *
 * @param {{getBlock: () => any, blockHash: string, args: {sender: string, fusedId: any, burnedId: any, fusionReceiptIPFSHash: string}}[]} events
 * @return {Promise<void>}
 */
const setBlock = async (events) => {
  if (events.length === 0) {
    return;
  }

  if (!db.json.blocks) {
    db.json.blocks = {};
  }

  if (db.json.blocks[events[0].blockHash]) {
    return;
  }

  const block = await events[0].getBlock();

  const timestamp = block.timestamp;

  db.json.blocks[block.hash] = {
    events: events.map(event => ({
      sender: event.args.sender,
      fusedId: event.args.fusedId.toNumber(),
      burnedId: event.args.burnedId.toNumber()
    })),
    timestamp,
    hash: block.hash,
    posted: false
  }

  db.save();
}

const filterUnPosted = () => {
  const now = Date.now() / 1000;

  return Object.values(db.json.blocks || []).filter(block => (!block.posted && block.timestamp - processDelayMS < now));
}

/**
 *
 * @param {{sender: string, fusedId: number, burnedId: number}} event
 */
const prepareFusion = async event => ({
  toBurn: event.burnedId,
  toFuse: event.fusedId,
  sender: event.sender,
  imageUrl: (await axios.get(`${baseUri}/${event.fusedId}`)).data.image
})


const postEvents = async () => {
  const unPosted = filterUnPosted();

  for await (const block of unPosted) {
    for await (const event of block.events) {
      try {
        const payload = await prepareFusion(event);
        await tweet.tweet(payload)
        await discord.send(payload);
        console.log(`Successfully posted #${payload.toFuse} and #${payload.toBurn} to Discord!`);
      } catch (e) {
        console.error(e);
        return;
      }
    }
    block.posted = true;
    db.save();
  }
}

const main = () => {
  setInterval(async () => {
    const events = await contract.queryFilter('Fused', db.json.latestBlockHash || undefined);

    if (events.length === 0) {
      return;
    }

    setLatestBlockNumber(events[events.length - 1].blockNumber);

    const blockEvents = {};

    for (const event of events) {
      if (blockEvents[event.blockHash]) {
        blockEvents[event.blockHash].push(event);
      } else {
        blockEvents[event.blockHash] = [event];
      }
    }

    Object.values(blockEvents).forEach(setBlock);

    try {
      await postEvents();
    } catch (e) {
      console.log(e);
    }

  }, processDelayMS);
}

main();

