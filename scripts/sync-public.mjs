import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

const publicFiles = ['manifest.json'];

const publicIssuerHtmlTemplatePath = path.join(rootDir, 'scripts', 'public-issuer.template.html');
const publicIssuerScriptTemplatePath = path.join(rootDir, 'scripts', 'public-issuer.template.js');

async function ensureCleanDir(targetDir) {
    await fs.rm(targetDir, { recursive: true, force: true });
    await fs.mkdir(targetDir, { recursive: true });
}

async function copyFileIntoPublic(relativePath, destinationRelativePath = relativePath) {
    const sourcePath = path.join(rootDir, relativePath);
    const destinationPath = path.join(publicDir, destinationRelativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
}

async function writePublicIndexHtml() {
    const template = await fs.readFile(publicIssuerHtmlTemplatePath, 'utf8');
    await fs.writeFile(path.join(publicDir, 'index.html'), template, 'utf8');
}

async function writePublicScript() {
    const template = await fs.readFile(publicIssuerScriptTemplatePath, 'utf8');
    await fs.writeFile(path.join(publicDir, 'script.js'), `${template.trimEnd()}\n`, 'utf8');
}

async function main() {
    await ensureCleanDir(publicDir);

    for (const file of publicFiles) {
        await copyFileIntoPublic(file);
    }

    await writePublicIndexHtml();
    await writePublicScript();
    await copyFileIntoPublic('icon-192.png');
    await copyFileIntoPublic('icon-512.png');
    await copyFileIntoPublic('icon-192.png', 'icon-192-v20260428-app-refresh-1.png');
    await copyFileIntoPublic('icon-512.png', 'icon-512-v20260428-app-refresh-1.png');

    console.log('Public shell synced to', publicDir);
}

main().catch(error => {
    console.error('Failed to sync public shell:', error);
    process.exitCode = 1;
});
