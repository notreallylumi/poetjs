

import { CONFIG } from './config.js';

// basically just matches prefix with the trie
export function alliteration(word, wordToPhoneme, forwardTrie, numPhonemes = 1) {
  word = word.toLowerCase();
  
  if (!wordToPhoneme.has(word)) {
    console.log(`Word "${word}" not found in dictionary`);
    return [];
  }
  
  const phonemes = wordToPhoneme.get(word);
  const prefixPhonemes = phonemes.slice(0, numPhonemes);
  const alliterativeWords = forwardTrie.getWordsWithPrefix(prefixPhonemes);
  return alliterativeWords
    .filter(w => w !== word)
    .slice(0, CONFIG.MAX_RESULTS);
}
