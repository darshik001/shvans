const { DeleteImage } = require("../helper/helper")



exports.CustomeError = (code, message) => {
    let error = new Error(message)
    error.statuscode = code
    return error
}


exports.GlobelErrorHandaling = async (error, req, res, next) => {
    console.log(error)

    if (req.file) {
        DeleteImage(`/uploads/${req.file.fieldname}/${req.file.filename}`)
    }

    if (req.files) {
        req.files.forEach(file => {
            DeleteImage(`/uploads/${file.fieldname}/${file.filename}`)
        });
    }



    


    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];

        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });

    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(422).json({
            success: false,
            message: "You can upload a maximum of 5 files."
        })
    }

    if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "INVALID TOKEN"
        });
    }




    if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
            success: false,
            message: "Firebase session expired. Please login again."
        });
    }

    // Invalid Firebase Token
    if (error.code === "auth/argument-error" || error.code === "auth/invalid-id-token") {
        return res.status(401).json({
            success: false,
            message: "Invalid Firebase ID Token."
        });
    }

    const statusCode = error.statuscode || error.statusCode || error.status || 500;
    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error"
    });
}

