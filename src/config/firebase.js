const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");

let firebaseadmin = null;

try {
  const serviceAccount = JSON.parse(process.env.FIERBASESDK);

  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  firebaseadmin = getApps().length? getApp(): initializeApp({credential: cert(serviceAccount),});

  console.log("Firebase Admin Connected Successfully");
} catch (error) {
  console.error("Firebase Admin Error:", error.message);
}

module.exports = firebaseadmin;