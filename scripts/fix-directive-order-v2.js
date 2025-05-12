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
    
    // Check if this is a route handler file
    const isRouteHandler = filePath.endsWith('route.ts') || 
                          filePath.endsWith('route.js') || 
                          filePath.endsWith('route.tsx') || 
                          filePath.endsWith('route.jsx');
    
    // Check for "use client" or 'use server' directives
    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
    const hasUseServer = content.includes('"use server"') || content.includes("'use server'");
    
    if (hasUseClient) {
      // Extract the directive
      const directive = content.includes('"use client"') ? '"use client"' : "'use client'";
      
      // Remove the directive from its current position
      content = content.replace(new RegExp(`${directive}[\\r\\n;]*`), '');
      
      // Add the directive at the very top
      content = `${directive}\n\n${content.trim()}\n`;
      modified = true;
      
      // Write the modified content back to the file
      await writeFile(filePath, content);
      console.log(`✅ Fixed "use client" directive in: ${filePath}`);
    } else if (hasUseServer) {
      // For route handlers, remove 'use server' directive completely
      if (isRouteHandler) {
        const directive = content.includes('"use server"') ? '"use server"' : "'use server'";
        content = content.replace(new RegExp(`${directive}[\\r\\n;]*`), '');
        modified = true;
        await writeFile(filePath, content);
        console.log(`✅ Removed "use server" directive from route handler: ${filePath}`);
      } else {
        // For other files, move 'use server' to the top
        const directive = content.includes('"use server"') ? '"use server"' : "'use server'";
        content = content.replace(new RegExp(`${directive}[\\r\\n;]*`), '');
        content = `${directive}\n\n${content.trim()}\n`;
        modified = true;
        await writeFile(filePath, content);
        console.log(`✅ Fixed "use server" directive in: ${filePath}`);
      }
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