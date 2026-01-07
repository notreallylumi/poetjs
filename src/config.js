export const CONFIG = {
  MAX_RESULTS: 10,
  SCORING: {
    FINAL_PHONEME: 3,
    ADDITIONAL_MATCH: 1,
    STRESSED_VOWEL: 2,
    LENGTH_PENALTY: 0.3
  },
  
  MULTI_SYLLABLE: {
    SYLLABLE_MATCH_BONUS: 2
  },
  NEAR_RHYME: {
    VOWEL_MATCH: 2,
    CONSONANT_MATCH: 1, 
    MIN_SCORE: 2
  },
  CACHE: {
    WORD_TO_PHONEME: 'word_to_phoneme.json',
    FORWARD_TRIE: 'forward_trie.json',
    REVERSE_TRIE: 'reverse_trie.json'
  }
};
