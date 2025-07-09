const express = require("express");
const multer = require("multer");
const cors = require("cors");
const dotenv = require("dotenv");
const CloudConvert = require("cloudconvert");

dotenv.config();

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Use memory storage (no disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/convertFile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const originalName = req.file.originalname;
    const extension = originalName.split(".").pop();
    const outputName = originalName.replace(/\.[^/.]+$/, ".pdf");

    console.log("Step 1: Creating CloudConvert job...");
    const job = await cloudConvert.jobs.create({
      tasks: {
        import_file: {
          operation: "import/upload",
        },
        convert_file: {
          operation: "convert",
          input: "import_file",
          output_format: "pdf",
        },
        export_file: {
          operation: "export/url",
          input: "convert_file",
        },
      },
    });

    const uploadTask = job.tasks.find((task) => task.name === "import_file");

    console.log("Step 2: Uploading file to CloudConvert...");
    await cloudConvert.tasks.upload(uploadTask, req.file.buffer, originalName);

    console.log("Step 3: Waiting for conversion to complete...");
    const completedJob = await cloudConvert.jobs.wait(job.id);

    const exportTask = completedJob.tasks.find(
      (task) => task.operation === "export/url"
    );
    const fileUrl = exportTask.result.files[0].url;

    console.log("Step 4: Downloading converted file from CloudConvert...");
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    res.set({
      "Content-Disposition": `attachment; filename="${outputName}"`,
      "Content-Type": "application/pdf",
    });

    res.send(Buffer.from(buffer));
    console.log(" Conversion and download complete.");

  } catch (error) {
    console.error(" Conversion failed:", error.message);
    res.status(500).send("Conversion failed.");
  }
});

app.get("/", (req, res) => {
  res.send(" CloudConvert PDF Converter Backend is Running!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
