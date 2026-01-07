import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadAndCache, saveCache } from './src/fileHandler.js';
import { Trie } from './src/trie.js';
import { parseCMUDict, parseWordList, countSyllables } from './src/dictionary.js';
import { rhymes, nearRhymes } from './src/rhymes.js';
import { alliteration } from './src/alliteration.js';
import { parseArgs, displayUsage, processWord, processFile } from './src/cli.js';
import { CONFIG } from './src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// if we already have cached data then load it
function loadCache() {
  const dataDir = path.join(__dirname, 'data');
  const wordToPhonemeCache = path.join(dataDir, CONFIG.CACHE.WORD_TO_PHONEME);
  const forwardTrieCache = path.join(dataDir, CONFIG.CACHE.FORWARD_TRIE);
  const reverseTrieCache = path.join(dataDir, CONFIG.CACHE.REVERSE_TRIE);
  
  // All three cache files must exist
  if (fs.existsSync(wordToPhonemeCache) && 
      fs.existsSync(forwardTrieCache) && 
      fs.existsSync(reverseTrieCache)) {
    
    console.log('Loading cached data structures...');
    
    const wordToPhonemeData = JSON.parse(fs.readFileSync(wordToPhonemeCache, 'utf-8'));
    const wordToPhoneme = new Map(wordToPhonemeData);
    
    const forwardTrieData = JSON.parse(fs.readFileSync(forwardTrieCache, 'utf-8'));
    const forwardTrie = Trie.fromJSON(forwardTrieData);
    
    const reverseTrieData = JSON.parse(fs.readFileSync(reverseTrieCache, 'utf-8'));
    const reverseTrie = Trie.fromJSON(reverseTrieData);
    
    console.log('Cache loaded successfully!');
    return { wordToPhoneme, forwardTrie, reverseTrie };
  }
  
  return null;
}
async function main() {
  try {
    const options = parseArgs();
    
    // if theres no mode quit
    if (!options.mode) {
      console.log('PoetJs');
      displayUsage();
      return;
    }
    
    // validate at least one option
    if (!options.rhymes && !options.alliteration) {
      console.error('\nError: Please specify at least one option (-r for rhymes, -a for alliteration)\n');
      displayUsage();
      return;
    }
    
    console.log('Starting PoetJs');
    
    const cached = loadCache();
    
    let wordToPhoneme, forwardTrie, reverseTrie;
    
    if (cached) {
      ({ wordToPhoneme, forwardTrie, reverseTrie } = cached);
    } else {
      // no cache, build data
      console.log('No Cache Found\nBuilding Data, Will Take A Moment...');
      
      const wordlistPath = await downloadAndCache(
        'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt',
        'wordlist.txt'
      );
      
      const cmudictPath = await downloadAndCache(
        'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict',
        'cmudict.dict'
      );
      
      const cmuDict = parseCMUDict(cmudictPath);
      const wordList = parseWordList(wordlistPath);
      wordToPhoneme = new Map();
      let matchCount = 0;
      
      for (const word of wordList) {
        if (cmuDict.has(word)) {
          wordToPhoneme.set(word, cmuDict.get(word));
          matchCount++;
        }
      }
      
      forwardTrie = new Trie();
      
      for (const [word, phonemes] of wordToPhoneme.entries()) {
        forwardTrie.insert(phonemes, word);
      }
      
      reverseTrie = new Trie();
      
      for (const [word, phonemes] of wordToPhoneme.entries()) {
        const reversedPhonemes = [...phonemes].reverse();
        reverseTrie.insert(reversedPhonemes, word);
      }
      
      saveCache(wordToPhoneme, forwardTrie, reverseTrie);
    }
    
    
    if (options.mode === 'word') {
      processWord(options.input, options, wordToPhoneme, forwardTrie, reverseTrie);
    } else if (options.mode === 'file') {
      processFile(options.input, options, wordToPhoneme, forwardTrie, reverseTrie);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

main();

