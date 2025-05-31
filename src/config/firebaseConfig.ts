import admin from 'firebase-admin';
import path from 'path';
// Initialize Firebase Admin SDK . test test
import serviceAccount from './firebaseSDK.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;