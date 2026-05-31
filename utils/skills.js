import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getSkillFile(skillName) {
    const allSkills = getAllSkills();
    if (skillName in allSkills) {
        return allSkills[skillName];
    } else {
        throw new Error(`Skill "${skillName}" not found.`);
    }
}

export function getAllSkills() {
    const skillsDir = path.resolve(__dirname, '..', 'prompts', 'skills');
    const skillFiles = fs.readdirSync(skillsDir).filter(file => file.endsWith('.md'));
    const skills = {};
    for (const file of skillFiles) {
        const skillName = path.basename(file, '.md');
        skills[skillName] = fs.readFileSync(path.join(skillsDir, file), 'utf8');
    }
    return skills;
}
