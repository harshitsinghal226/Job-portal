import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}-${unique}${ext}`;
    cb(null, filename);
  },
});

const uploadJobApplication = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, true);
  }
}).single("resume");

const uploadJobApplicationWithDebug = (req, res, next) => {
  uploadJobApplication(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed"
      });
    }
    next();
  });
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed!"));
    }
  }
}).single("image");

const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files allowed!"));
    }
  }
}).single("resume");

const uploadImageWithDebug = (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed"
      });
    }
    next();
  });
};

const upload = uploadImage;

export { upload, uploadImage, uploadPDF, uploadJobApplication, uploadJobApplicationWithDebug, uploadImageWithDebug };
export default upload;
