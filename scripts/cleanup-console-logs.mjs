import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to keep console.log (essential server logs)
const KEEP_LOGS_IN = [
    'server.js',  // Keep server startup logs
    'seed.js'     // Keep seed script logs
];

function removeConsoleLogs(filePath) {
    const fileName = path.basename(filePath);

    // Skip if this file should keep its logs
    if (KEEP_LOGS_IN.includes(fileName)) {
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove console.log statements (including multiline)
    // Matches: console.log(...); including nested parentheses
    content = content.replace(/console\.log\([^;]*\);?\s*/g, '');

    // Remove standalone console.error, console.warn if needed
    // content = content.replace(/console\.(error|warn)\([^;]*\);?\s*/g, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

function processDirectory(dir, excludeDirs = ['node_modules', 'dist', '.git']) {
    const files = fs.readdirSync(dir);
    let count = 0;

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                count += processDirectory(filePath, excludeDirs);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            if (removeConsoleLogs(filePath)) {
                console.log(`✅ Cleaned: ${filePath.replace(dir, '')}`);
                count++;
            }
        }
    });

    return count;
}

// Process Backend
console.log('🧹 Cleaning Backend files...\n');
const backendPath = path.join(__dirname, '../Backend');
const backendCount = processDirectory(backendPath);

// Process Frontend
console.log('\n🧹 Cleaning Frontend files...\n');
const frontendPath = path.join(__dirname, '../Frontend/src');
const frontendCount = processDirectory(frontendPath);

console.log(`\n✨ Cleanup complete!`);
console.log(`📊 Backend: ${backendCount} files cleaned`);
console.log(`📊 Frontend: ${frontendCount} files cleaned`);
console.log(`\n✅ Kept essential logs in: ${KEEP_LOGS_IN.join(', ')}`);
