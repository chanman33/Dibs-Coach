#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const APP_DIR = path.join(process.cwd(), 'app/dashboard');
const DYNAMIC_EXPORT = 'export const dynamic = \'force-dynamic\';\n';

async function walkDirectory(dir) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      await walkDirectory(filePath);
    } else if (file === 'page.tsx' || file === 'page.jsx' || file === 'page.ts' || file === 'page.js') {
      await processPageFile(filePath);
    }
  }
}

async function processPageFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    
    // Skip files that don't use headers or request
    if (!content.includes('headers') && !content.includes('request.url') && 
        !content.includes('cookies') && !content.includes('auth()')) {
      console.log(`⏩ Skipping (no dynamic imports): ${filePath}`);
      return;
    }
    
    // Check if dynamic export is already present
    if (!content.includes('export const dynamic')) {
      // Insert dynamic export at the beginning of the file, after any imports
      const lines = content.split('\n');
      let importEndIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].trim() === '') {
          importEndIndex = i + 1;
        } else {
          break;
        }
      }
      
      // Insert the dynamic export after imports
      lines.splice(importEndIndex, 0, DYNAMIC_EXPORT);
      content = lines.join('\n');
      
      // Write updated content back to file
      await writeFile(filePath, content);
      console.log(`✅ Added dynamic export to: ${filePath}`);
    } else {
      console.log(`⏩ Dynamic export already exists in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error);
  }
}

// Start processing page files
console.log('Adding dynamic exports to dashboard pages...');
walkDirectory(APP_DIR)
  .then(() => console.log('✅ All dashboard pages processed successfully!'))
  .catch(error => console.error('❌ Error:', error)); 