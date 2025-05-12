#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
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
      } else if (
        file.endsWith('.ts') || 
        file.endsWith('.tsx') || 
        file.endsWith('.js') || 
        file.endsWith('.jsx')
      ) {
        await processFile(filePath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error);
  }
}

async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    
    // Check for "use client" or 'use server' directives
    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
    const hasUseServer = content.includes('"use server"') || content.includes("'use server'");
    
    if (hasUseClient || hasUseServer) {
      // Extract the directive
      let directive;
      if (hasUseClient) {
        directive = content.includes('"use client"') ? '"use client"' : "'use client'";
      } else {
        directive = content.includes('"use server"') ? '"use server"' : "'use server'";
      }
      
      // Remove the directive from its current position
      content = content.replace(new RegExp(`${directive}[\\r\\n;]*`), '');
      
      // Add the directive at the very top
      content = `${directive}\n\n${content.trim()}\n`;
      modified = true;
      
      // Write the modified content back to the file
      await writeFile(filePath, content);
      console.log(`✅ Fixed directive order in: ${filePath}`);
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error);
    return false;
  }
}

// Start processing files
console.log('Fixing directive order in files...');
walkDirectory(APP_DIR)
  .then(() => console.log('✅ All files processed successfully!'))
  .catch(error => console.error('❌ Error:', error)); 