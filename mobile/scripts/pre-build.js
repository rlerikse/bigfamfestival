// filepath: e:\repos\bigfamfestival\mobile\scripts\pre-build.js
import fs from 'fs';

const base64Data = process.env.GOOGLE_SERVICES_JSON;

if (!base64Data) {
  console.error('Error: GOOGLE_SERVICES_JSON environment variable is not set.');
  process.exit(1);
}

const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
fs.writeFileSync('google-services.json', decodedData);

// eslint-disable-next-line
console.log('google-services.json file has been created.');