const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');

const stlStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/stl-files')),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/product-images')),
  filename:    (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const stlFilter = (req, file, cb) => {
  const ok = ['.stl','.pdf','.jpg','.jpeg'].includes(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only .stl, .pdf, .jpg, .jpeg files allowed'));
};

const imageFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed'));
};

const uploadStl   = multer({ storage: stlStorage,   fileFilter: stlFilter,   limits: { fileSize: 50*1024*1024 } });
const uploadImage = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 50*1024*1024 } });

module.exports = { uploadStl, uploadImage };
