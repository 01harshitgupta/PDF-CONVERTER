const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const CloudConvert = require("cloudconvert");

dotenv.config();

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

app.post("/convertFile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const inputFilePath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputName = path.basename(req.file.originalname, ext) + ".pdf";

    const job = await cloudConvert.jobs.create({
      tasks: {
        import_my_file: {
          operation: "import/upload",
        },
        convert_my_file: {
          operation: "convert",
          input: "import_my_file",
          output_format: "pdf",
        },
        export_my_file: {
          operation: "export/url",
          input: "convert_my_file",
        },
      },
    });

    const uploadTask = job.tasks.filter(
      (task) => task.name === "import_my_file"
    )[0];

    await cloudConvert.tasks.upload(uploadTask, fs.createReadStream(inputFilePath));

    const completedJob = await cloudConvert.jobs.wait(job.id);

    const exportTask = completedJob.tasks.filter(
      (task) => task.operation === "export/url"
    )[0];

    const fileUrl = exportTask.result.files[0].url;

    // Stream download
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    res.set({
      "Content-Disposition": `attachment; filename="${outputName}"`,
      "Content-Type": "application/pdf",
    });

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Conversion failed:", error);
    res.status(500).send("Conversion failed.");
  }
});

app.get("/", (req, res) => {
  res.send(" CloudConvert PDF Converter Backend is Running!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
