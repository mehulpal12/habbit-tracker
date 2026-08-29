const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const vapidKeys = webpush.generateVAPIDKeys();

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

if (!envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
  fs.appendFileSync(envPath, `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"\nVAPID_PRIVATE_KEY="${vapidKeys.privateKey}"\n`);
  console.log('Successfully appended VAPID keys to .env');
} else {
  console.log('VAPID keys already exist in .env');
}
