import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {zipSync, unzipSync} from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'app');
const output = path.join(root, '..', 'mole-manor-xhs.zip');
const allowed = new Set(['.html','.css','.js','.png','.jpg','.jpeg','.gif','.webp','.svg','.woff','.woff2','.json']);
const sha = data => createHash('sha256').update(data).digest('hex');
async function filesIn(directory, prefix = '') {
  const entries = await fs.readdir(directory, {withFileTypes:true}), result = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error('Symlink is not permitted: ' + entry.name);
    const relative = prefix + entry.name;
    if (!/^[A-Za-z0-9_./-]+$/.test(relative)) throw new Error('ASCII-safe names required: ' + relative);
    if (entry.isDirectory()) result.push(...await filesIn(path.join(directory, entry.name), relative + '/'));
    else if (entry.isFile()) {
      if (!allowed.has(path.extname(entry.name).toLowerCase()) || ['.DS_Store','Thumbs.db'].includes(entry.name)) throw new Error('File is outside package whitelist: ' + relative);
      result.push(relative);
    }
  }
  return result.sort();
}
const names = await filesIn(app);
if (!names.includes('index.html') || names.filter(name => name.endsWith('.html')).length !== 1) throw new Error('Package needs exactly one root index.html');
names.splice(names.indexOf('index.html'), 1);
names.unshift('index.html');
const files = {};
for (const name of names) files[name] = new Uint8Array(await fs.readFile(path.join(app, name)));
const archive = zipSync(files, {level:9, mtime:new Date('2026-09-14T00:00:00Z')});
const unpacked = unzipSync(archive);
if (Object.keys(unpacked).length !== names.length) throw new Error('Zip entry count mismatch');
for (const name of names) {
  if (!unpacked[name] || !Buffer.from(files[name]).equals(Buffer.from(unpacked[name]))) throw new Error('Zip byte mismatch: ' + name);
}
let backup = null;
try {
  await fs.access(output);
  const backupDir = path.join(root, 'backups');
  await fs.mkdir(backupDir, {recursive:true});
  backup = path.join(backupDir, 'mole-manor-xhs-' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip');
  await fs.copyFile(output, backup, 1);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const temporary = output + '.tmp';
await fs.writeFile(temporary, archive);
await fs.rename(temporary, output);
const written = await fs.readFile(output);
if (sha(written) !== sha(archive)) throw new Error('Written archive checksum mismatch');
const report = {
  generatedAt:new Date().toISOString(), command:'npm run package',
  sourceDirectory:app, output, backup, bytes:written.length, sha256:sha(written),
  rootEntry:'index.html', entries:names.length, allTypesWhitelisted:true, allPathsAscii:true,
  fullUnzipIntegrity:true, byteForByteMatch:true,
  files:names.map(name=>({path:name,bytes:files[name].length,sha256:sha(files[name])}))
};
await fs.mkdir(path.join(root,'evidence'),{recursive:true});
await fs.writeFile(path.join(root, 'evidence/package.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
