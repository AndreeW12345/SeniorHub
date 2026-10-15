import { register } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

register('./save-user-profile-alias-resolver.mjs', pathToFileURL(`${__dirname}/`));
