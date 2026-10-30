const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Textul Bibliei se livrează ca asset (nu în bundle-ul JS) și se încarcă la cerere.
config.resolver.assetExts.push('bible');

module.exports = withNativeWind(config, { input: './global.css' });
