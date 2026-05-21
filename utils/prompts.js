/* 
easy gateway to get MD files from ../prompts 
 */

import fs from 'fs';
import path from 'path';

export function getPrompts() {
    const promptsDir = path.join(process.cwd(), 'prompts');
    const promptFiles = fs.readdirSync(promptsDir).filter(file => file.endsWith('.md'));

    const prompts = {};
    for (const file of promptFiles) {
        const filePath = path.join(promptsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const promptName = path.basename(file, '.md');
        prompts[promptName] = content;
    }
    return prompts;
}