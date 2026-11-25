import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const PHOTO_EXT_RE = /\.(jpe?g|png|webp)$/i;

function scanMuseumPhotos(rootDir: string): string[] {
  const photosDir = path.resolve(rootDir, 'public/museum/photos');
  if (!fs.existsSync(photosDir)) return [];
  return fs
    .readdirSync(photosDir)
    .filter((f) => PHOTO_EXT_RE.test(f))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function museumManifestPlugin(): Plugin {
  const virtualId = 'virtual:museum-photos';
  const resolvedId = '\0' + virtualId;
  let rootDir = __dirname;

  const writeManifest = () => {
    const photos = scanMuseumPhotos(rootDir);
    const outPath = path.resolve(rootDir, 'public/museum/photos-manifest.json');
    fs.mkdirSync(path.dirname(outPath), {recursive: true});
    fs.writeFileSync(outPath, JSON.stringify({photos}, null, 2));
    return photos;
  };

  return {
    name: 'museum-photos-manifest',
    configResolved(config) {
      rootDir = config.root;
    },
    buildStart() {
      writeManifest();
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) {
        const photos = writeManifest();
        return `export default ${JSON.stringify(photos)};`;
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || './',
    plugins: [
      react(),
      tailwindcss(),
      museumManifestPlugin(),
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three-core';
            if (id.includes('node_modules/@react-three')) return 'r3f-core';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
