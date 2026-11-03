const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')
const { getMessaging } = require('firebase-admin/messaging');
const generateUniqueId = require('generate-unique-id');
const firebaseadmin = require('../config/firebase.js');
const userModel = require('../model/user.model.js');

exports.hashUserPassword = (password) => {
    return bcrypt.hash(password, 12)
}


exports.DeleteImage = (filepath) => {
    try {
        if (!filepath || typeof filepath !== 'string') return;

        let cleanPath = filepath;

        if (/^https?:\/\//i.test(filepath)) {
            cleanPath = new URL(filepath).pathname;
        }

        cleanPath = decodeURIComponent(cleanPath.split('?')[0]);

        if (!cleanPath.startsWith('/uploads/')) return;

        const uploadRoot = path.resolve(process.cwd(), 'src', 'uploads');
        const deletePath = path.resolve(process.cwd(), 'src', cleanPath.slice(1));

        if (!deletePath.startsWith(uploadRoot + path.sep)) return;

        if (fs.existsSync(deletePath) && fs.statSync(deletePath).isFile()) {
            fs.unlinkSync(deletePath);
            console.log('Deleted image:', deletePath);
        }

        return cleanPath
    } catch (error) {
        console.log('Image delete error:', error);
    }
};



exports.GenerateOTP = () => {
    return generateUniqueId({ length: 6, useLetters: false, useNumbers: true })
}

exports.GenerateSKU = () => {
    return `SKU-${generateUniqueId({ length: 8, useLetters: true, useNumbers: true }).toUpperCase()}`;
};


exports.sendNotification = async (fids, title, body) => {
    try {

        if (!Array.isArray(fids) || fids.length === 0) {
            return;
        }

        if (!firebaseadmin) {
            console.warn("[Firebase] Warning: Admin SDK is not initialized, skipping notification.");
            return;
        }

        const res = await getMessaging(firebaseadmin).sendEachForMulticast({
            fids: fids,
            notification: {
                title: "Hello!",
                body: "This is a test notification.",
            },
        });


        // Invalid / expired tokens
        const invalidTokens = [];

        res.responses.forEach((response, index) => {


            if (!response.success) {
                const errorCode = response.error?.code;
                if (errorCode === "messaging/registration-token-not-registered" || errorCode === "messaging/invalid-registration-token") {
                    invalidTokens.push(fids[index]);
                }
            }
        });



        if (invalidTokens && invalidTokens.length) {
            await userModel.updateMany(
                { deviceToken: { $in: invalidTokens } },
                { $pull: { deviceToken: { $in: invalidTokens } } }
            );
        }
        return {
            res,
            invalidTokens
        }

    } catch (error) {
        console.log("FCM Error:", error);
    }
};
