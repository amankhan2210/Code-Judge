const multer = require("multer")

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls"];
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return cb(new Error("Only XLSX and XLS files are allowed"))
    }
    cb(null, true)
  }
})
module.exports = upload
    