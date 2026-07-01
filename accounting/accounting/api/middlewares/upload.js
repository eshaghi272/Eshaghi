import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// برای سازگاری با __dirname در ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.body.nationalCode}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

export default upload;
