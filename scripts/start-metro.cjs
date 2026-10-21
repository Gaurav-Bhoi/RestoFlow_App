const { existsSync } = require('node:fs');

// VS Code's Snap terminal exports GTK paths for its bundled desktop runtime.
// DevTools runs outside that runtime and needs the host's libraries and schemas.
if (process.platform === 'linux') {
  const isSnapPath = value => /(^|\/)snap\//.test(value);

  if (
    isSnapPath(process.env.GSETTINGS_SCHEMA_DIR || '') &&
    existsSync('/usr/share/glib-2.0/schemas/gschemas.compiled')
  ) {
    process.env.GSETTINGS_SCHEMA_DIR = '/usr/share/glib-2.0/schemas';
  }

  for (const name of ['GSETTINGS_SCHEMA_PATH', 'GTK_PATH', 'XDG_DATA_DIRS']) {
    const original = process.env[name];
    if (!original || !original.split(':').some(isSnapPath)) {
      continue;
    }

    const hostPaths = original.split(':').filter(value => !isSnapPath(value));
    if (hostPaths.length > 0) {
      process.env[name] = hostPaths.join(':');
    } else {
      delete process.env[name];
    }
  }
}

// Run in this process so Metro keeps normal terminal input and signal handling.
process.argv.splice(2, 0, 'start');
require('@react-native-community/cli').run('react-native');
