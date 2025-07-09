const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const docxToPdf = require('docx-pdf');
const PDFDocument = require('pdfkit'); // ✅ use pdfkit

const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

app.post('/convertFile', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputName = path.basename(req.file.originalname, ext) + '.pdf';
    const outputPath = path.join(__dirname, 'files', outputName);

    // DOCX to PDF
    if (ext === '.docx') {
      docxToPdf(req.file.path, outputPath, err => {
        if (err) return res.status(500).send('DOCX conversion failed.');
        return res.download(outputPath);
      });

    // Image to PDF
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.image(req.file.path, {
        fit: [500, 700],
        align: 'center',
        valign: 'center'
      });

      doc.end();

      stream.on('finish', () => {
        return res.download(outputPath);
      });

      stream.on('error', (err) => {
        console.error('PDFKit Stream Error:', err);
        return res.status(500).send('PDF conversion failed.');
      });

    } else {
      return res.status(400).send('Unsupported file type. Only .docx, .jpeg, .png allowed.');
    }

  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error.');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
