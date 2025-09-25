// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// React Native Firebase needs to be transpiled
if (config.resolver) {
  config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs'];
}

module.exports = config;