import multer from 'multer';
import path from 'path';
import fs from 'fs';
import AppError from '../utils/AppError.js';

// Đường dẫn thư mục lưu trữ file
const UPLOAD_DIR = path.resolve('uploads');

// Tự động tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình vị trí lưu trữ và tên file trên đĩa cứng
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Làm sạch tên file gốc
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `attachment-${uniqueSuffix}-${baseName}${ext}`);
  }
});

// Danh sách MIME types an toàn được phép tải lên
const ALLOWED_MIME_TYPES = [
  // Hình ảnh
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Tài liệu
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  // Nén
  'application/zip',
  'application/x-zip-compressed'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) || ext === '.xlsx' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Định dạng file "${file.mimetype}" không được hỗ trợ! Chỉ chấp nhận: Hình ảnh (JPG, PNG, WEBP), PDF, Word, Excel, TXT, ZIP.`,
        400
      ),
      false
    );
  }
};

// Khởi tạo multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Tối đa 5MB theo yêu cầu Level 3
  }
});

export default upload;
