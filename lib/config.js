// BamboojamVilla OS — Config
// Reads from BAMBOOJAM_CONFIG (JSON env var) or local config.json

function getConfig() {
  if (process.env.BAMBOOJAM_CONFIG) {
    try { return JSON.parse(process.env.BAMBOOJAM_CONFIG); } catch (e) {}
  }
  try { return require('../config.json'); } catch (e) {}
  return { databases: {} };
}

export function getDB(key) {
  return getConfig().databases?.[key] || null;
}

export function getNotionToken() {
  return process.env.NOTION_TOKEN || '';
}
