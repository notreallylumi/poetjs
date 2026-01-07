import fs from 'fs';
import { rhymes } from './rhymes.js';
import { alliteration } from './alliteration.js';

// pretty cli
export function parseArgs() {
  const args = process.argv.slice(2);
  
  const options = {
    mode: null, 
    input: null,
    rhymes: false,
    alliteration: false,
    multiWord: false,
    multiSyllable: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-f':
        options.mode = 'file';
        options.input = args[++i];
        break;
      case '-w':
        options.mode = 'word';
        options.input = args[++i];
        break;
      case '-r':
        options.rhymes = true;
        break;
      case '-a':
        options.alliteration = true;
        break;
      case '-mw':
        options.multiWord = true;
        break;
      case '-ms':
        options.multiSyllable = true;
        break;
      default:
        console.log(`Unknown option: ${args[i]}`);
    }
  }
  
  return options;
}

export function displayUsage() {
  console.log('\nPoetJs Usage\n');
  console.log('Modes:');
  console.log('-f <filename> File mode: analyze last word of each line');
  console.log('-w <word> Word mode: analyze a single word\n');
  console.log('Options:');
  console.log('-r  Show rhymes');
  console.log('-a  Show alliterations');
  console.log('-mw Multi-word mode: rhyme last 2 words together');
  console.log('-ms Multi-syllable mode: prioritize matching more syllables\n');
}

export function processWord(word, options, wordToPhoneme, forwardTrie, reverseTrie) {
  console.log(`\n> ${word}`);
  
  // if ryhmes show ryhmes
  if (options.rhymes) {
    const rhymeList = rhymes(word, wordToPhoneme, reverseTrie, options.multiSyllable);
    if (rhymeList.length > 0) {
      console.log(`Rhymes: ${rhymeList.join(', ')}`);
    } else {
      console.log(`Rhymes: none found`);
    }
  }
  
  // if alliteration show alliteration
  if (options.alliteration) {
    const alliterationList = alliteration(word, wordToPhoneme, forwardTrie);
    if (alliterationList.length > 0) {
      console.log(`Alliteration: ${alliterationList.join(', ')}`);
    } else {
      console.log(`Alliteration: none found`);
    }
  }
}

// reads a text file and calls process word on the last word of each line
export function processFile(filename, options, wordToPhoneme, forwardTrie, reverseTrie) {
  try {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    for (const line of lines) {
      const words = line.trim().split(/\s+/);
      if (words.length === 0) continue;
      let targetText;
      
      // last 2 words in multi word mode
      if (options.multiWord && words.length >= 2) {
        // remove punctuation
        const lastWord = words[words.length - 1].replace(/[.,!?;:"'-]/g, '').toLowerCase();
        const secondLastWord = words[words.length - 2].replace(/[.,!?;:"'-]/g, '').toLowerCase();
        targetText = `${secondLastWord} ${lastWord}`;
      } 
      else {
        targetText = words[words.length - 1].replace(/[.,!?;:"'-]/g, '').toLowerCase();
      }
      
      if (targetText.trim().length === 0) continue;
      
      processWord(targetText, options, wordToPhoneme, forwardTrie, reverseTrie);
    }
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
  }
}
