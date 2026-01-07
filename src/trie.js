// represents a single phoneme
class TrieNode {
  constructor() {
    // map of phoneme -> trie node
    this.children = new Map();
    this.isEndOfWord = false;
    this.word = null;
  }
  
  // serialise data to json
  toJSON() {
    return {
      children: Array.from(this.children.entries()),
      isEndOfWord: this.isEndOfWord,
      word: this.word
    };
  }
  
  // deserialize from json
  static fromJSON(json) {
    const node = new TrieNode();
    node.isEndOfWord = json.isEndOfWord;
    node.word = json.word;
    node.children = new Map(
      json.children.map(([key, value]) => [key, TrieNode.fromJSON(value)])
    );
    return node;
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
  }
  
  // insert phoneme sequence, examplt cat = K AE1 T, this turns into root -> K -> AE1 -> T [marked as end of a word] 
  insert(sequence, originalWord = null) {
    let node = this.root;
    for (const item of sequence) {
      if (!node.children.has(item)) {
        node.children.set(item, new TrieNode());
      }
      node = node.children.get(item);
    }
    node.isEndOfWord = true;
    node.word = originalWord || sequence.join(' ');
  }
  
  // searches tree and checks if sequence exists as a word, returns false if ti doesnt exist or if its just a prefix
  search(sequence) {
    let node = this.root;
    for (const item of sequence) {
      if (!node.children.has(item)) {
        return false; // doesnt exist
      }
      node = node.children.get(item);
    }
    return node.isEndOfWord;
  }
  
  // basically the same as search but prefix's return true as well
  startsWith(prefix) {
    let node = this.root;
    
    for (const item of prefix) {
      if (!node.children.has(item)) {
        return false;
      }
      node = node.children.get(item);
    }
    
    return true;
  }
  
  // recursively gets all words in a subtree
  getAllWords(node = this.root, words = []) {
    // base case, if we found a word add it to the list
    if (node.isEndOfWord) {
      words.push(node.word);
    }
    
    // recursively call on every child
    for (const child of node.children.values()) {
      this.getAllWords(child, words);
    }
    
    return words;
  }
  
  // get words with specifix prefix
  // simple ryhming example using reversed trie
  // prefix T A C finds words cat, bat, hat when reversed
  getWordsWithPrefix(prefix) {
    let node = this.root;
    for (const item of prefix) {
      if (!node.children.has(item)) {
        return [];
      }
      node = node.children.get(item);
    }
    
    return this.getAllWords(node);
  }
  
  // serialise to json
  toJSON() {
    return {
      root: this.root.toJSON()
    };
  }
  
  // deserialize from json
  static fromJSON(json) {
    const trie = new Trie();
    trie.root = TrieNode.fromJSON(json.root);
    return trie;
  }
}
