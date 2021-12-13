const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { ethers } = require('ethers');
const tweet = require('./tweet');
const {db} = require('db');
const discord = require("./discord");

const processDelaySeconds = 600;

const baseUri = process.env.BASE_URI;

const abi = ['event Fused(address sender, uint fusedId, uint burnedId, bytes32 fusionReceiptIPFSHash)'];

const address = process.env.CONTRACT_ADDRESS;

const provider = ethers.getDefaultProvider(process.env.CONTRACT_NETWORK);

const contract = new ethers.Contract(address, abi, provider);

const setLatestBlockHash = (blockHash) => {
  db.json.latestBlockHash = blockHash;
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

  const block = await events[0].getBlock();

  if (db.json.blocks[block.hash]) {
    return;
  }

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
  const now = Date.now();

  return Object.values(db.json.blocks).filter(block => !block.posted && block.timestamp - processDelaySeconds >= now);
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
      const payload = await prepareFusion(event);
      await tweet.tweet(payload)
      await discord.send(payload);
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

    setLatestBlockHash(events[events.length - 1].blockHash);

    const blockEvents = {};

    for (const event of events) {
      if (blockEvents[event.blockHash]) {
        blockEvents[event.blockHash].push(event);
      } else {
        blockEvents[event.blockHash] = [event];
      }
    }

    Object.values(blockEvents).forEach(setBlock);

    await postEvents();

  }, processDelaySeconds);
}


