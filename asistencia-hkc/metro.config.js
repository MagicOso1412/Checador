const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// expo-sqlite en web usa wa-sqlite (SQLite compilado a WebAssembly). Metro no
// sabe resolver archivos .wasm por defecto ("Unable to resolve module
// ./wa-sqlite/wa-sqlite.wasm"), y el navegador necesita las cabeceras
// COOP/COEP para poder usar SharedArrayBuffer (lo que wa-sqlite requiere).
// Ver https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
config.resolver.assetExts.push("wasm");

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return middleware(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
