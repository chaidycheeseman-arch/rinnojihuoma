import fs from 'fs/promises';
import path from 'path';
import { syncRuntimeBundle } from './sync-runtime-bundle.mjs';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'client-public');
const backendBase = 'https://rinno520.netlify.app';

const rootFiles = [
    'index.html',
    'script.js',
    'style.css',
    'manifest.json',
    'sw.js',
    'icon-192.png',
    'icon-512.png'
];

const rootDirs = [
    'app',
    'vendor'
];

async function ensureCleanDir(dirPath) {
    await fs.rm(dirPath, { recursive: true, force: true });
    await fs.mkdir(dirPath, { recursive: true });
}

async function copyRootFiles() {
    await Promise.all(
        rootFiles.map(fileName => fs.copyFile(
            path.join(rootDir, fileName),
            path.join(outputDir, fileName)
        ))
    );
}

async function copyRootDirs() {
    await Promise.all(
        rootDirs.map(dirName => fs.cp(
            path.join(rootDir, dirName),
            path.join(outputDir, dirName),
            { recursive: true }
        ))
    );
}

async function patchIndexHtml() {
    const indexPath = path.join(outputDir, 'index.html');
    const original = await fs.readFile(indexPath, 'utf8');
    const next = original.replace(
        /<meta name="rinno-license-api-base" content="[^"]*">/,
        `<meta name="rinno-license-api-base" content="${backendBase}">`
    );
    await fs.writeFile(indexPath, next, 'utf8');
}

async function addVersionedIcons() {
    await fs.copyFile(
        path.join(outputDir, 'icon-192.png'),
        path.join(outputDir, 'icon-192-v20260428-app-refresh-1.png')
    );
    await fs.copyFile(
        path.join(outputDir, 'icon-512.png'),
        path.join(outputDir, 'icon-512-v20260428-app-refresh-1.png')
    );
}

async function main() {
    await syncRuntimeBundle();
    await ensureCleanDir(outputDir);
    await copyRootFiles();
    await copyRootDirs();
    await patchIndexHtml();
    await addVersionedIcons();
    console.log(`User client built to ${outputDir}`);
    console.log(`License API base: ${backendBase}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
