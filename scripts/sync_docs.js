const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

// Sync backend/.env.example to backend/ENV_SETUP.md
function syncEnvSetup() {
    console.log('Syncing backend ENV_SETUP.md...');
    const envExamplePath = path.join(ROOT_DIR, 'backend', '.env.example');
    const envSetupPath = path.join(ROOT_DIR, 'backend', 'ENV_SETUP.md');

    if (!fs.existsSync(envExamplePath) || !fs.existsSync(envSetupPath)) {
        console.warn('Missing backend/.env.example or backend/ENV_SETUP.md. Skipping.');
        return;
    }

    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    let setupContent = fs.readFileSync(envSetupPath, 'utf8');

    const regex = /<!-- AUTO-GENERATED-START: ENV -->[\s\S]*<!-- AUTO-GENERATED-END: ENV -->/;
    const replacement = `<!-- AUTO-GENERATED-START: ENV -->\n${envContent}\n<!-- AUTO-GENERATED-END: ENV -->`;

    if (regex.test(setupContent)) {
        setupContent = setupContent.replace(regex, replacement);
        fs.writeFileSync(envSetupPath, setupContent, 'utf8');
        console.log('Updated backend/ENV_SETUP.md with latest .env.example');
    } else {
        console.warn('Could not find AUTO-GENERATED-START: ENV in backend/ENV_SETUP.md');
    }
}

// Sync frontend/src directory structure to frontend/README_FRONTEND.md
function syncFrontendStructure() {
    console.log('Syncing frontend README_FRONTEND.md...');
    const readmeFrontendPath = path.join(ROOT_DIR, 'frontend', 'README_FRONTEND.md');
    const frontendSrcPath = path.join(ROOT_DIR, 'frontend', 'src');

    if (!fs.existsSync(readmeFrontendPath) || !fs.existsSync(frontendSrcPath)) {
        console.warn('Missing frontend/README_FRONTEND.md or frontend/src. Skipping.');
        return;
    }

    let setupContent = fs.readFileSync(readmeFrontendPath, 'utf8');
    
    try {
        // Use tree command in windows or find in linux
        let treeOutput = '';
        if (process.platform === 'win32') {
            treeOutput = execSync(`tree /A "${frontendSrcPath}"`, { encoding: 'utf8' });
        } else {
            treeOutput = execSync(`find "${frontendSrcPath}" -type d | sed -e "s/[^-][^\\/]*\\// |/g" -e "s/|\\([^ ]\\)/|-\\1/"`, { encoding: 'utf8' });
        }

        const replacementStr = `<!-- AUTO-GENERATED-START: FOLDER_TREE -->\n\`\`\`\n${treeOutput.trim()}\n\`\`\`\n<!-- AUTO-GENERATED-END: FOLDER_TREE -->`;
        
        const regex = /<!-- AUTO-GENERATED-START: FOLDER_TREE -->[\s\S]*<!-- AUTO-GENERATED-END: FOLDER_TREE -->/;
        if (regex.test(setupContent)) {
            setupContent = setupContent.replace(regex, replacementStr);
            fs.writeFileSync(readmeFrontendPath, setupContent, 'utf8');
            console.log('Updated frontend/README_FRONTEND.md with latest folder structure');
        } else {
            console.warn('Could not find AUTO-GENERATED-START: FOLDER_TREE in frontend/README_FRONTEND.md');
        }
    } catch (e) {
        console.error('Failed to generate tree output:', e.message);
    }
}

function main() {
    console.log('Starting sync process...');
    syncEnvSetup();
    syncFrontendStructure();
    console.log('Sync process completed.');
}

main();
