// fetches needed files from the internet
// cache files locally
// loading & saving processed data

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { CONFIG } from './config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fetches file from url and saves it locally
export async function downloadAndCache(url, filename = null) {

  // create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!filename) return;
  
  const filePath = path.join(dataDir, filename);
  
  // check cache
  if (fs.existsSync(filePath)) return filePath;
  
  
  return new Promise((resolve, reject) => {
	// choose protocol based on url	  
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadAndCache(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
      }
      
      // not ok response
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
	  // response -> file 		
      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filePath);
      });
      
      // error handling
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// load already processed data
export function loadCache() {
  const dataDir = path.join(__dirname, '..', 'data');
  const { CACHE } = import('./config.js');
  
  const wordToPhonemeCache = path.join(dataDir, CACHE.WORD_TO_PHONEME);
  const forwardTrieCache = path.join(dataDir, CACHE.FORWARD_TRIE);
  const reverseTrieCache = path.join(dataDir, CACHE.REVERSE_TRIE);
  
  if (fs.existsSync(wordToPhonemeCache) && 
      fs.existsSync(forwardTrieCache) && 
      fs.existsSync(reverseTrieCache)) {
    return {
      wordToPhonemeCache,
      forwardTrieCache,
      reverseTrieCache
    };
  }
  
  // no cache found so you have to process data yourself
  return null;
}

// save processed data to cache
export function saveCache(wordToPhoneme, forwardTrie, reverseTrie) {
  const dataDir = path.join(__dirname, '..', 'data');
  const { CACHE } = CONFIG;
  
  // map to array for json serialization
  const wordToPhonemeData = Array.from(wordToPhoneme.entries());
  fs.writeFileSync(
    path.join(dataDir, CACHE.WORD_TO_PHONEME),
    JSON.stringify(wordToPhonemeData)
  );
  
  fs.writeFileSync(
    path.join(dataDir, CACHE.FORWARD_TRIE),
    JSON.stringify(forwardTrie.toJSON())
  );
  
  fs.writeFileSync(
    path.join(dataDir, CACHE.REVERSE_TRIE),
    JSON.stringify(reverseTrie.toJSON())
  );
  
}
