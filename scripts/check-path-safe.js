#!/usr/bin/env node

/**
 * Path Safety Check for iOS Builds
 * 
 * This script checks if the current working directory contains characters
 * that are known to cause issues with iOS builds and Xcode scripts.
 * 
 * Problematic characters: spaces, &, (), {}, [], !, #, $, ', ", \
 */

const path = require('path');
const chalk = require('chalk');

// Get the current working directory
const cwd = process.cwd();

// Define problematic characters that break iOS builds
const problematicChars = [
  ' ',  // space
  '&',  // ampersand
  '(',  // left parenthesis
  ')',  // right parenthesis
  '{',  // left brace
  '}',  // right brace
  '[',  // left bracket
  ']',  // right bracket
  '!',  // exclamation
  '#',  // hash
  '$',  // dollar
  "'",  // single quote
  '"',  // double quote
  '\\'  // backslash
];

// Check if the path contains any problematic characters
const hasProblematicChars = problematicChars.some(char => cwd.includes(char));

if (hasProblematicChars) {
  console.error(chalk.red('\n❌ Path Safety Check Failed!\n'));
  console.error(chalk.yellow('The current project path contains characters that will cause iOS build failures:'));
  console.error(chalk.cyan(`  ${cwd}\n`));
  
  // Highlight problematic characters
  const highlightedPath = cwd.split('').map(char => {
    if (problematicChars.includes(char)) {
      return chalk.red.bold(char);
    }
    return char;
  }).join('');
  
  console.error('Problematic characters found: ' + highlightedPath + '\n');
  
  console.error(chalk.yellow('iOS builds require paths without these characters:'));
  console.error('  • Spaces');
  console.error('  • Special characters: & ( ) { } [ ] ! # $ \' " \\\n');
  
  console.error(chalk.green('Solution:'));
  console.error('  Move your project to a path without special characters.');
  console.error('  For example: /Users/YourName/Projects/LeafAndBarrel\n');
  
  process.exit(1);
}

// Path is safe
console.log(chalk.green('✅ Path safety check passed!'));
console.log(chalk.gray(`Project path: ${cwd}`));