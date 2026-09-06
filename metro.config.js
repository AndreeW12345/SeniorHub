const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const functionsRoot = path.resolve(__dirname, 'functions');
const escapedFunctionsRoot = functionsRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const existingBlockList = config.resolver.blockList;
const blockList = Array.isArray(existingBlockList)
  ? existingBlockList
  : existingBlockList
    ? [existingBlockList]
    : [];

config.resolver.blockList = [
  ...blockList,
  new RegExp(`^${escapedFunctionsRoot.replace(/\\/g, '\\\\')}([\\\\/].*)?$`),
];

module.exports = config;
