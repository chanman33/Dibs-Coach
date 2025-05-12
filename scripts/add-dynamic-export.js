#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const API_DIR = path.join(process.cwd(), 'app/api');
const DYNAMIC_EXPORT = 'export const dynamic = \'force-dynamic\';\n';

async function walkDirectory(dir) {
  const files = await readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory()) {
      await walkDirectory(filePath);
    } else if (file === 'route.ts' || file === 'route.js') {
      await processRouteFile(filePath);
    }
  }
}

async function processRouteFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    
    // Check if dynamic export is already present
    if (!content.includes('export const dynamic')) {
      // Insert dynamic export at the beginning of the file, after any imports
      const lines = content.split('\n');
      let importEndIndex = 0;
      let inMultilineImport = false;
      
      // Process imports, tracking multi-line imports
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (inMultilineImport) {
          // Find the end of the multi-line import
          if (line.includes('}') && line.includes('from')) {
            inMultilineImport = false;
            importEndIndex = i + 1;
          } else if (line.includes('}')) {
            // Handles case where closing bracket is on its own line or there's another statement after it
            if (i + 1 < lines.length && lines[i + 1].trim().startsWith('from')) {
              importEndIndex = i + 2; // Include the 'from' line
            } else {
              importEndIndex = i + 1;
            }
            inMultilineImport = false;
          }
        } else if (line.startsWith('import ')) {
          if ((line.includes('{') && !line.includes('}')) || 
              (line.includes('{') && line.includes('}') && !line.includes('from'))) {
            // Start of a multi-line import
            inMultilineImport = true;
          } else {
            // Single-line import
            importEndIndex = i + 1;
          }
        } else if (!line.startsWith('import ') && line !== '' && !line.startsWith('//')) {
          // First non-import, non-empty, non-comment line
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

// Start processing API routes
console.log('Adding dynamic exports to API routes...');
walkDirectory(API_DIR)
  .then(() => console.log('✅ All API routes processed successfully!'))
  .catch(error => console.error('❌ Error:', error)); 