import React, { useState, useRef } from "react";
import axios from "axios";

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [convert, setConvert] = useState("");
  const [download, setDownload] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setConvert("");
    setDownload("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setConvert("Please select a file to convert");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL;

      const response = await axios.post(`${API}/convertFile`, formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const downloadName = selectedFile.name.replace(/\.[^/.]+$/, ".pdf");

      link.href = url;
      link.setAttribute("download", downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      fileInputRef.current.value = null;
      setSelectedFile(null);
      setConvert("✅ File converted successfully!");
      setDownload(`📥 Download started: ${downloadName}`);
    } catch (error) {
      console.error("Error converting file:", error);
      setConvert("❌ Something went wrong during conversion.");
      setDownload("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-home">
      <div className="center-home">
        <div className="heading-home">
          <h1>File to PDF</h1>
          <p>
            Easily convert DOCX, PNG, or JPEG files to PDF format online, <br />
            without having to install any software.
          </p>
        </div>
        <div className="form-home">
          <input
            type="file"
            accept=".docx,.png,.jpeg,.jpg"
            onChange={handleFileChange}
            className="hidden"
            id="FileInput"
            ref={fileInputRef}
          />
          <label htmlFor="FileInput" className="home-label">
            {selectedFile ? selectedFile.name : "Choose a file"}
          </label>
          <button
            onClick={handleSubmit}
            className="home-button"
            disabled={!selectedFile || loading}
          >
            {loading ? "Converting..." : "Convert File"}
          </button>

          {loading && <div className="spinner"></div>}

          {convert && <p style={{ marginTop: "10px", color: "green" }}>{convert}</p>}
          {download && <p style={{ fontSize: "14px", color: "#ccc" }}>{download}</p>}
        </div>
      </div>
    </div>
  );
};

export default Home;
