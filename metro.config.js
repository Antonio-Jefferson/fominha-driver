const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : [config.resolver.blockList].filter(Boolean);
config.resolver.blockList = [
  ...defaultBlockList,
  /.*\.(test|spec)\.[jt]sx?$/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
