const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const emojisToRemove = [
  '👨‍⚕️', '👩‍⚕️', '🏥', '📅', '💊', '🩺', '📊', '👤', '🔔', '💬', '📭', '💡', '⏰', '💰', '🏆', '⚠️', '✅', '❌', '⏳', '✨', '📌', '🔄', '↗', '✓', '👥', '👨‍👩‍👧‍👦', '🏥', '📅', '📋', '💳', '⚙️', '🚪'
];

const emojisToReplace = {
  '⭐': '★',
  '🟢': '●',
  '🔴': '●',
  '🟡': '●'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  emojisToRemove.forEach(emoji => {
    // Escape emoji for regex if needed, or just use string replace
    const regex = new RegExp(emoji, 'g');
    content = content.replace(regex, '');
  });

  Object.entries(emojisToReplace).forEach(([emoji, replacement]) => {
    const regex = new RegExp(emoji, 'g');
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      processFile(filePath);
    }
  }
}

walkDir(srcDir);
console.log('Emoji removal complete.');
