const fs = require('fs');
const path = require('path');

const backendEndpoints = new Set();
const frontendEndpoints = new Set();

const controllerDir = path.join(__dirname, '..', '..', 'src', 'main', 'java', 'com', 'accounting', 'app', 'controller');
const classMappingRe = /@RequestMapping\("([^"]+)"\)/;
const methodMappingRe = /@(Get|Post|Put|Delete)Mapping\((?:value\s*=\s*)?"([^"]*)"(?:.*)?\)/;

function walk(dir, callback, extReg) {
    if(!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if(isDirectory) {
            walk(dirPath, callback, extReg);
        } else if (extReg.test(f)){
            callback(dirPath);
        }
    });
}

walk(controllerDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let basePath = "";
    let classMatch = content.match(classMappingRe);
    if(classMatch) basePath = classMatch[1];
    
    let lines = content.split('\n');
    lines.forEach(line => {
        let methodMatch = line.match(methodMappingRe);
        if(methodMatch) {
            let method = methodMatch[1].toUpperCase();
            let subPath = methodMatch[2];
            if(subPath === "/") subPath = "";
            let fullPath = (basePath + subPath).replace(/^\/|\/$/g, '');
            fullPath = fullPath.replace(/\{[^}]+\}/g, '{}');
            backendEndpoints.add(`${method} /${fullPath}`);
            return;
        }
        
        let trimmed = line.trim();
        if(trimmed.startsWith('@GetMapping') && !trimmed.includes('"')) {
            backendEndpoints.add(`GET /${basePath.replace(/^\/|\/$/g, '')}`);
        } else if(trimmed.startsWith('@PostMapping') && !trimmed.includes('"')) {
            backendEndpoints.add(`POST /${basePath.replace(/^\/|\/$/g, '')}`);
        } else if(trimmed.startsWith('@PutMapping') && !trimmed.includes('"')) {
            backendEndpoints.add(`PUT /${basePath.replace(/^\/|\/$/g, '')}`);
        } else if(trimmed.startsWith('@DeleteMapping') && !trimmed.includes('"')) {
            backendEndpoints.add(`DELETE /${basePath.replace(/^\/|\/$/g, '')}`);
        }
    });
}, /\.java$/);

const frontendDir = path.join(__dirname, '..', '..', 'frontend', 'src');
const axiosRe = /axios\.(get|post|put|delete)\s*\(\s*([`'"])(.*?)(?:\?[^`'"]*)?\2/g;

walk(frontendDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.split('\n');
    lines.forEach((line, i) => {
        let match;
        while ((match = axiosRe.exec(line)) !== null) {
            let method = match[1].toUpperCase();
            let url = match[3];
            
            url = url.split('?')[0];
            url = url.replace(/\$\{[^}]+\}/g, '{}'); // match ${...}
            
            url = url.replace(/^\/|\/$/g, '');
            if(!url.startsWith('api/')) {
                if(!line.includes('baseUrl')) {
                    console.log(`Warning: Non-standard url found in ${filePath}:${i+1} -> ${url}`);
                }
                continue;
            }
            frontendEndpoints.add(`${method} /${url}`);
        }
    });
}, /\.(tsx|ts)$/);

console.log("----- BACKEND ENDPOINTS -----");
Array.from(backendEndpoints).sort().forEach(ep => console.log(ep));

console.log("\n----- FRONTEND ENDPOINTS -----");
Array.from(frontendEndpoints).sort().forEach(ep => console.log(ep));

console.log("\n----- MISSING IN BACKEND -----");
Array.from(frontendEndpoints).sort().forEach(ep => {
    if(!backendEndpoints.has(ep)) {
        console.log(`!!! NOT IN BACKEND: ${ep}`);
    }
});
