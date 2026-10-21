import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use BootSplash's existing SVG renderer without adding another dependency.
const require = createRequire(import.meta.url);
const bootsplashRequire = createRequire(
  require.resolve('react-native-bootsplash/package.json'),
);
const sharp = bootsplashRequire('sharp');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(
  resolve(root, 'assets/app-icon/brand-mark.svg'),
  'utf8',
);
const paths = [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)].map(
  match => match[1],
);
if (paths.length !== 3)
  throw new Error('Expected the three supplied cutlery paths');
const productionColor = source.match(
  /<rect\b[^>]*\bfill="(#[\da-f]{6})"/i,
)?.[1];
if (!productionColor)
  throw new Error('Expected a solid brand background color');
const developmentColor = '#B91C1C';
const mark = paths.map(path => `<path d="${path}" fill="white"/>`).join('\n');

async function write(path, contents) {
  const destination = resolve(root, path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}

function artwork(color, round = false) {
  // Native launchers apply their own masks; iOS artwork must be opaque and square.
  const background = round
    ? `<circle cx="17" cy="17" r="17" fill="${color}"/>`
    : `<rect width="34" height="34" fill="${color}"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 34 34">${background}${mark}</svg>`,
  );
}

async function png(path, color, size, round = false) {
  let render = sharp(artwork(color, round)).resize(size, size);
  if (!round) render = render.removeAlpha();
  await write(path, await render.png().toBuffer());
}

const iphone = [
  [20, '2x'],
  [20, '3x'],
  [29, '2x'],
  [29, '3x'],
  [40, '2x'],
  [40, '3x'],
  [60, '2x'],
  [60, '3x'],
];
const ipad = [
  [20, '1x'],
  [20, '2x'],
  [29, '1x'],
  [29, '2x'],
  [40, '1x'],
  [40, '2x'],
  [76, '1x'],
  [76, '2x'],
  [83.5, '2x'],
];
for (const [name, color] of [
  ['AppIcon', productionColor],
  ['AppIconDev', developmentColor],
]) {
  const directory = `ios/RestoFlow/Images.xcassets/${name}.appiconset`;
  const images = [
    ...iphone.map(([size, scale]) => ({ idiom: 'iphone', size, scale })),
    ...ipad.map(([size, scale]) => ({ idiom: 'ipad', size, scale })),
    { idiom: 'ios-marketing', size: 1024, scale: '1x' },
  ].map(({ idiom, size, scale }) => ({
    idiom,
    size: `${size}x${size}`,
    scale,
    filename: `icon-${size * Number.parseInt(scale, 10)}.png`,
  }));
  for (const size of new Set(
    images.map(entry => Number(entry.filename.match(/[\d]+/)[0])),
  )) {
    await png(`${directory}/icon-${size}.png`, color, size);
  }
  await write(
    `${directory}/Contents.json`,
    JSON.stringify(
      {
        images,
        info: { author: 'xcode', version: 1 },
      },
      null,
      2,
    ) + '\n',
  );
}

const android = 'android/app/src';
for (const [sourceSet, color] of [
  ['main', productionColor],
  ['development', developmentColor],
]) {
  for (const [density, size] of Object.entries({
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  })) {
    const directory = `${android}/${sourceSet}/res/mipmap-${density}`;
    await png(`${directory}/ic_launcher.png`, color, size);
    await png(`${directory}/ic_launcher_round.png`, color, size, true);
  }
  await write(
    `${android}/${sourceSet}/res/values/ic_launcher_colors.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${color}</color>\n</resources>\n`,
  );
}

// The 54-unit viewport leaves room for adaptive masks and launcher motion.
await write(
  `${android}/main/res/drawable/ic_launcher_foreground.xml`,
  `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="54" android:viewportHeight="54">
    <group android:translateX="10" android:translateY="10">
${paths
  .map(
    path =>
      `        <path android:fillColor="#FFFFFF" android:pathData="${path}"/>`,
  )
  .join('\n')}
    </group>
</vector>
`,
);
for (const version of [26, 33]) {
  const monochrome =
    version >= 33
      ? '    <monochrome android:drawable="@drawable/ic_launcher_foreground"/>\n'
      : '';
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
${monochrome}</adaptive-icon>
`;
  for (const name of ['ic_launcher', 'ic_launcher_round']) {
    await write(
      `${android}/main/res/mipmap-anydpi-v${version}/${name}.xml`,
      xml,
    );
  }
}
console.log(
  'Generated green production and red development app icons for iOS and Android.',
);
