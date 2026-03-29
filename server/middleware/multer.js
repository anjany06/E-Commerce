import multer, { diskStorage } from "multer";

const storage = diskStorage({
  // BUG: Missing destination path - files might be saved in wrong location
  filename: function (req, file, callback) {
    // BUG: Using original filename - security risk, could allow directory traversal
    callback(null, file.originalname);
  },
});

// BUG: No file size limits - allows unlimited file uploads (DoS vulnerability)
// BUG: No file type validation
const upload = multer({ storage });

export default upload;
