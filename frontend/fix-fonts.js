const fs = require('fs');
const path = require('path');

const dir = 'd:/Accounting_java/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let changedFiles = 0;

files.forEach(file => {
    const filePath = path.join(dir, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    
    // Target h1, h2, h3, h4, h5, h6
    content = content.replace(/<(h[1-6])([^>]*)className="([^"]+)"([^>]*)>/g, (match, tag, before, className, after) => {
        let newClass = className
            .replace(/\bfont-black\b/g, 'font-bold')
            .replace(/\buppercase\b/g, '')
            .replace(/\bitalic\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        return `<${tag}${before}className="${newClass}"${after}>`;
    });

    // Target specific span inside headers (usually highlighted words)
    content = content.replace(/<span([^>]*)className="([^"]+)"([^>]*)>/g, (match, before, className, after) => {
        if (className.includes('text-primary') || 
            className.includes('text-emerald-500') || 
            className.includes('text-orange-500') || 
            className.includes('text-red-500') || 
            className.includes('text-purple-500') ||
            className.includes('text-amber-500')) {
            let newClass = className
                .replace(/\bfont-black\b/g, 'font-bold')
                .replace(/\buppercase\b/g, '')
                .replace(/\bitalic\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            return `<span${before}className="${newClass}"${after}>`;
        }
        return match;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Successfully updated ${changedFiles} files.`);
