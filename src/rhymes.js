import { CONFIG } from './config.js';
import { getPhrasePhonemes, countSyllables } from './dictionary.js';

// reverse the phonemes so cat -> tac (i know its letters not phonemes)
// search reversed trie for all words prefixed with this (this gets all words ending with this)
// score each candidate
export function rhymes(word, wordToPhoneme, reverseTrie, multiSyllable = false) {
  word = word.toLowerCase();
  
  // if its multiple words then combine the phonemes
  const phonemes = word.includes(' ') 
    ? getPhrasePhonemes(word, wordToPhoneme)
    : wordToPhoneme.get(word);
  
  if (!phonemes) {
    console.log(`Word/phrase "${word}" not found in dictionary`);
    return [];
  }
  
  const reversedPhonemes = [...phonemes].reverse();
  const rhymingWords = reverseTrie.getWordsWithPrefix(reversedPhonemes);
  const filtered = rhymingWords.filter(w => w !== word); // remove the original word
  
  // score ryhmes
  const scored = filtered.map(rhymeWord => {
    const rhymePhonemes = wordToPhoneme.get(rhymeWord);
    const score = multiSyllable 
      ? scoreMultiSyllableRhyme(phonemes, rhymePhonemes, word, rhymeWord, wordToPhoneme)
      : scoreRhyme(phonemes, rhymePhonemes);
    return { word: rhymeWord, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  const perfectRhymes = scored.slice(0, CONFIG.MAX_RESULTS).map(item => item.word);
  
  // if we cant fine enough perfect ryhmes then fill the list with near ryhmes
  if (perfectRhymes.length < CONFIG.MAX_RESULTS) {
    const needed = CONFIG.MAX_RESULTS - perfectRhymes.length;
    const slantRhymeResults = nearRhymes(
      word, 
      wordToPhoneme, 
      reverseTrie, 
      needed, 
      new Set(perfectRhymes)  // Exclude words we already found
    );
    return [...perfectRhymes, ...slantRhymeResults];
  }
  
  return perfectRhymes;
}

function scoreRhyme(originalPhonemes, rhymePhonemes) {
  let score = 0;
  
  // helper functions
  const isStressedVowel = (phoneme) => /[AEIOU].*1$/.test(phoneme);
  const getVowelBase = (phoneme) => phoneme.replace(/[012]$/, '');
  
  // minimum requirement is that the final phoneme matches
  if (originalPhonemes[originalPhonemes.length - 1] === 
      rhymePhonemes[rhymePhonemes.length - 1]) {
    score += CONFIG.SCORING.FINAL_PHONEME;
  }
  
  // count additional matching phonemes working backwards and add points
  const minLen = Math.min(originalPhonemes.length, rhymePhonemes.length);
  for (let i = 1; i < minLen; i++) {
    const origIdx = originalPhonemes.length - 1 - i;
    const rhymeIdx = rhymePhonemes.length - 1 - i;
    
    if (originalPhonemes[origIdx] === rhymePhonemes[rhymeIdx]) {
      score += CONFIG.SCORING.ADDITIONAL_MATCH; 
    } else {
      break; 
    }
  }
  
  // more points if the stress of the vowel matches
  const origStressed = originalPhonemes.filter(isStressedVowel);
  const rhymeStressed = rhymePhonemes.filter(isStressedVowel);
  
  if (origStressed.length > 0 && rhymeStressed.length > 0) {
    const origVowel = getVowelBase(origStressed[origStressed.length - 1]);
    const rhymeVowel = getVowelBase(rhymeStressed[rhymeStressed.length - 1]);
    
    if (origVowel === rhymeVowel) {
      score += CONFIG.SCORING.STRESSED_VOWEL;  
    }
  }
  
  // lose points for larger difference in length
  const lengthDiff = Math.abs(originalPhonemes.length - rhymePhonemes.length);
  score -= lengthDiff * CONFIG.SCORING.LENGTH_PENALTY; 
  
  return score;
}

// special ranking for multi_syllable ryhmes
// counts ALL consecutive matches not just near the end, more points for matching syllable, and more lenient with length diff
function scoreMultiSyllableRhyme(originalPhonemes, rhymePhonemes, originalWord, rhymeWord, wordToPhoneme) {
  let score = 0;
  
  const isStressedVowel = (phoneme) => /[AEIOU].*1$/.test(phoneme);
  const getVowelBase = (phoneme) => phoneme.replace(/[012]$/, '');
  
  // points for same syllable count so beautiful would match with dutiful instead of just full
  const origSyllables = countSyllables(originalWord, wordToPhoneme);
  const rhymeSyllables = countSyllables(rhymeWord, wordToPhoneme);
  
  if (origSyllables === rhymeSyllables && origSyllables > 1) {
    score += CONFIG.MULTI_SYLLABLE.SYLLABLE_MATCH_BONUS * origSyllables;
  }
  
  const minLen = Math.min(originalPhonemes.length, rhymePhonemes.length);
  let matchingPhonemes = 0;
  
  for (let i = 0; i < minLen; i++) {
    const origIdx = originalPhonemes.length - 1 - i;
    const rhymeIdx = rhymePhonemes.length - 1 - i;
    
    if (originalPhonemes[origIdx] === rhymePhonemes[rhymeIdx]) {
      matchingPhonemes++;
      score += CONFIG.SCORING.ADDITIONAL_MATCH;
    } else {
      break;
    }
  }
  
  if (originalPhonemes[originalPhonemes.length - 1] === 
      rhymePhonemes[rhymePhonemes.length - 1]) {
    score += CONFIG.SCORING.FINAL_PHONEME;
  }
  
  const origStressed = originalPhonemes.filter(isStressedVowel);
  const rhymeStressed = rhymePhonemes.filter(isStressedVowel);
  
  if (origStressed.length > 0 && rhymeStressed.length > 0) {
    const origVowel = getVowelBase(origStressed[origStressed.length - 1]);
    const rhymeVowel = getVowelBase(rhymeStressed[rhymeStressed.length - 1]);
    
    if (origVowel === rhymeVowel) {
      score += CONFIG.SCORING.STRESSED_VOWEL;
    }
  }
  
  const lengthDiff = Math.abs(originalPhonemes.length - rhymePhonemes.length);
  score -= lengthDiff * (CONFIG.SCORING.LENGTH_PENALTY * 0.5); // lose less points for length diff
  
  return score;
}

export function nearRhymes(word, wordToPhoneme, reverseTrie, limit = CONFIG.MAX_RESULTS, excludeWords = new Set()) {
  word = word.toLowerCase();
  
  if (!wordToPhoneme.has(word)) {
    console.log(`Word "${word}" not found in dictionary`);
    return [];
  }
  
  const phonemes = wordToPhoneme.get(word);
  const reversedPhonemes = [...phonemes].reverse();
  
  // shorter prefix to get more options, were less picky
  const minPrefixLen = Math.min(2, reversedPhonemes.length);
  const prefix = reversedPhonemes.slice(0, minPrefixLen);
  const candidates = reverseTrie.getWordsWithPrefix(prefix);
  
  // exclude words we already have
  const filtered = candidates.filter(w => w !== word && !excludeWords.has(w));
  
  const scored = filtered.map(candidateWord => {
    const candidatePhonemes = wordToPhoneme.get(candidateWord);
    const score = scoreNearRhyme(phonemes, candidatePhonemes);
    return { word: candidateWord, score };
  });
  
  // were less picky but theres still a min
  const nearRhymeResults = scored.filter(item => item.score >= CONFIG.NEAR_RHYME.MIN_SCORE);
  nearRhymeResults.sort((a, b) => b.score - a.score);
  
  return nearRhymeResults.slice(0, limit).map(item => item.word);
}

// scores based on how similary vowel and consonants sounds are
function scoreNearRhyme(originalPhonemes, candidatePhonemes) {
  let score = 0;
  
  const isVowel = (phoneme) => /^[AEIOU]/.test(phoneme);
  const getVowelBase = (phoneme) => phoneme.replace(/[012]$/, '');
  const getConsonantBase = (phoneme) => phoneme.replace(/[012]$/, '');
  
  const compareLen = Math.min(3, originalPhonemes.length, candidatePhonemes.length);
  
  for (let i = 0; i < compareLen; i++) {
    const origIdx = originalPhonemes.length - 1 - i;
    const candIdx = candidatePhonemes.length - 1 - i;
    const origPhoneme = originalPhonemes[origIdx];
    const candPhoneme = candidatePhonemes[candIdx];
    
    // assonance match
    if (isVowel(origPhoneme) && isVowel(candPhoneme)) {
      if (getVowelBase(origPhoneme) === getVowelBase(candPhoneme)) {
        score += CONFIG.NEAR_RHYME.VOWEL_MATCH;
      }
    } 
    // consonant match
    else if (!isVowel(origPhoneme) && !isVowel(candPhoneme)) {
      if (getConsonantBase(origPhoneme) === getConsonantBase(candPhoneme)) {
        score += CONFIG.NEAR_RHYME.CONSONANT_MATCH;
      }
    }
  }
  
  return score;
}
