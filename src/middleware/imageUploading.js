const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = file.fieldname || 'images';
    const uploadPath = path.join(process.cwd(), 'src', 'uploads', folderName);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  },
});

const UploadImage = multer({ storage: storage });

module.exports = UploadImage
