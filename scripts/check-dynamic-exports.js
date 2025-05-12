#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

const APP_DIR = path.join(process.cwd(), 'app');

async function walkDirectory(dir) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        await walkDirectory(filePath);
      } else if (file === 'route.ts' || file === 'route.js' || 
                file === 'page.tsx' || file === 'page.jsx' || 
                file === 'page.ts' || file === 'page.js') {
        await checkFile(filePath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error);
  }
}

async function checkFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inImportStatement = false;
    let importStartLine = -1;
    let potentialIssue = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're starting an import statement
      if (line.startsWith('import ') && line.includes('{') && !line.includes('}')) {
        inImportStatement = true;
        importStartLine = i;
      }
      
      // Check if we're ending an import statement
      if (inImportStatement && line.includes('}')) {
        inImportStatement = false;
      }
      
      // Check for dynamic export within an import statement
      if (inImportStatement && line.includes('export const dynamic')) {
        potentialIssue = true;
        console.log(`⚠️ Potential issue at line ${i+1} in ${filePath}`);
        console.log(`  Import started at line ${importStartLine+1}`);
        console.log(`  ${lines[importStartLine]}`);
        console.log(`  Issue at line:`);
        console.log(`  ${line}`);
        console.log('');
      }
    }
    
    if (!potentialIssue) {
      // Check for "} from" followed immediately by "export const dynamic"
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].includes('} from') && lines[i+1].trim().startsWith('export const dynamic')) {
          const nextImportLine = lines.slice(i+2).findIndex(line => line.trim().startsWith('import '));
          if (nextImportLine !== -1) {
            console.log(`⚠️ Potential export before imports completed at line ${i+2} in ${filePath}`);
            console.log(`  ${lines[i]}`);
            console.log(`  ${lines[i+1]}`);
            console.log(`  Next import at line ${i+2+nextImportLine+1}:`);
            console.log(`  ${lines[i+2+nextImportLine]}`);
            console.log('');
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error checking file ${filePath}:`, error);
  }
}

// Start checking files
console.log('Checking for dynamic export issues...');
walkDirectory(APP_DIR)
  .then(() => console.log('✅ All files checked!'))
  .catch(error => console.error('❌ Error:', error)); 