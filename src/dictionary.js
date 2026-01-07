import fs from 'fs';

// oarse cmu format: WORD PHONEME PHONEME PHONEME ...
// for simplicity only pick one pronunciation in case there is multiple
export function parseCMUDict(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const dict = new Map();
  
  for (const line of lines) {
    // skip comment lines
    if (line.startsWith(';;;') || line.trim() === '') continue;
    
    // whitepace split so the first part is word and rest are phonemes
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    
    let word = parts[0];
    // remove variants e.g TEXT(2) -> TEXT
    word = word.replace(/\(\d+\)$/, '');
    word = word.toLowerCase();
    
    const phonemes = parts.slice(1);
    
    // only save the first pronunciation we see
    if (!dict.has(word)) {
      dict.set(word, phonemes);
    }
  }
  
  return dict;
}

export function parseWordList(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n')
    .map(word => word.trim().toLowerCase())
    .filter(word => word.length > 0);  // Remove empty lines
}

// count syllables, based on vowels
export function countSyllables(word, wordToPhoneme) {
  word = word.toLowerCase();
  
  if (!wordToPhoneme.has(word)) {
    return 0;
  }
  
  const phonemes = wordToPhoneme.get(word);
  // regex to match phonemes ending in 0, 1, 2 because vowels have theyre stress marked at the end
  return phonemes.filter(p => /[012]$/.test(p)).length;
}

export function getPhrasePhonemes(phrase, wordToPhoneme) {
  const words = phrase.toLowerCase().split(/\s+/);
  const allPhonemes = [];
  
  // concat phonemes for each word
  for (const word of words) {
    if (!wordToPhoneme.has(word)) {
      return null;
    }
    allPhonemes.push(...wordToPhoneme.get(word));
  }
  
  return allPhonemes;
}
