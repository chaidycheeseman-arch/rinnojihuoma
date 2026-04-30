import fs from 'fs/promises';
import path from 'path';
import { syncRuntimeBundle } from './sync-runtime-bundle.mjs';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const issuerDir = path.join(publicDir, 'issuer');
const issuerHtmlTemplatePath = path.join(rootDir, 'scripts', 'public-issuer.template.html');
const issuerScriptTemplatePath = path.join(rootDir, 'scripts', 'public-issuer.template.js');

const appRootFiles = [
    'index.html',
    'script.js',
    'style.css',
    'manifest.json',
    'sw.js',
    'icon-192.png',
    'icon-512.png'
];

const appRootDirs = [
    'app',
    'vendor'
];

const versionedIconCopies = [
    ['icon-192.png', 'icon-192-v20260428-app-refresh-1.png'],
    ['icon-512.png', 'icon-512-v20260428-app-refresh-1.png']
];

async function ensureCleanDir(targetDir) {
    await fs.rm(targetDir, { recursive: true, force: true });
    await fs.mkdir(targetDir, { recursive: true });
}

async function copyFileIntoDir(targetDir, relativePath, destinationRelativePath = relativePath) {
    const sourcePath = path.join(rootDir, relativePath);
    const destinationPath = path.join(targetDir, destinationRelativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(sourcePath, destinationPath);
}

async function copyAppShell() {
    await Promise.all(
        appRootFiles.map(fileName => copyFileIntoDir(publicDir, fileName))
    );

    await Promise.all(
        appRootDirs.map(dirName => fs.cp(
            path.join(rootDir, dirName),
            path.join(publicDir, dirName),
            { recursive: true }
        ))
    );

    await Promise.all(
        versionedIconCopies.map(([sourceName, destinationName]) => copyFileIntoDir(publicDir, sourceName, destinationName))
    );
}

async function copyIssuerShell() {
    await fs.mkdir(issuerDir, { recursive: true });

    const [issuerHtml, issuerScript] = await Promise.all([
        fs.readFile(issuerHtmlTemplatePath, 'utf8'),
        fs.readFile(issuerScriptTemplatePath, 'utf8')
    ]);

    await Promise.all([
        fs.writeFile(path.join(issuerDir, 'index.html'), issuerHtml, 'utf8'),
        fs.writeFile(path.join(issuerDir, 'script.js'), `${issuerScript.trimEnd()}\n`, 'utf8'),
        copyFileIntoDir(issuerDir, 'icon-192.png'),
        copyFileIntoDir(issuerDir, 'icon-512.png')
    ]);

    await Promise.all(
        versionedIconCopies.map(([sourceName, destinationName]) => copyFileIntoDir(issuerDir, sourceName, destinationName))
    );
}

async function main() {
    await syncRuntimeBundle();
    await ensureCleanDir(publicDir);
    await copyAppShell();
    await copyIssuerShell();

    console.log(`Netlify site built to ${publicDir}`);
    console.log('App root: /');
    console.log('Issuer console: /issuer/');
}

main().catch(error => {
    console.error('Failed to build Netlify site:', error);
    process.exitCode = 1;
});
