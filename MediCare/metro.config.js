const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Adiciona suporte a arquivos .cjs
defaultConfig.resolver.sourceExts.push('cjs');

// Desativa o uso de package exports instável
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
