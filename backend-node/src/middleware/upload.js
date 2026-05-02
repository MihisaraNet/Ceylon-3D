/**
 * upload.js — File Upload Middleware (Multer Configuration)
 *
 * Configures two Multer instances for handling file uploads:
 *
 *   1. uploadStl   — For STL/design files (.stl, .pdf, .jpg, .jpeg)
 *                    Saved to: uploads/stl-files/
 *                    Max size: 50 MB
 *                    Filename: UUID-originalname (ensures uniqueness)
 *
 *   2. uploadImage — For product images (any image/* MIME type)
 *                    Saved to: uploads/product-images/
 *                    Max size: 50 MB
 *                    Filename: UUID.ext (preserves extension only)
 *
 * Usage in routes:
 *   router.post('/stl', uploadStl.single('file'), handler);
 *   router.post('/product', uploadImage.single('image'), handler);
 *
 * @module middleware/upload
 * @requires multer
 * @requires path
 * @requires uuid
 */

const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

/* ── STL File Storage Configuration ───────────────────────── */
// Stores uploaded STL files in the `uploads/stl-files/` directory.
// Files are renamed with a UUID prefix to prevent naming collisions.
const stlStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/stl-files')),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});

/* ── Product Image Storage Configuration ──────────────────── */
// Stores uploaded product images in the `uploads/product-images/` directory.
// Only the file extension is preserved; the base name is replaced by a UUID.
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/product-images')),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

/* ── File Type Filters ────────────────────────────────────── */

/**
 * STL file filter: allows .stl, .pdf, .jpg, .jpeg extensions only.
 * Rejects other file types with an error message.
 */
const stlFilter = (req, file, cb) => {
  const ok = ['.stl','.pdf','.jpg','.jpeg'].includes(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only .stl, .pdf, .jpg, .jpeg files allowed'));
};

/**
 * Image file filter: allows any file with an image/* MIME type.
 * Rejects non-image files with an error message.
 */
const imageFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed'));
};

/* ── Multer Instances ─────────────────────────────────────── */
// Each instance combines storage, filter, and a 50 MB file size limit.
const uploadStl   = multer({ storage: stlStorage,   fileFilter: stlFilter,   limits: { fileSize: 50*1024*1024 } });
const uploadImage = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 50*1024*1024 } });

module.exports = { uploadStl, uploadImage };
