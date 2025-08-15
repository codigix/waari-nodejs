// dompdf-config.js

const path = require("path");
const os = require("os");

module.exports = {
  showWarnings: false, // Throw an error on warnings
  publicPath: null, // Override if needed
  convertEntities: true, // Convert HTML entities

  options: {
    // Directories for fonts
    fontDir: path.join(__dirname, "storage/fonts"),
    fontCache: path.join(__dirname, "storage/fonts"),

    // Temp folder for processing
    tempDir: os.tmpdir(),

    // Root folder for security restrictions
    chroot: path.resolve(__dirname),

    // Allowed protocols for assets
    allowedProtocols: {
      "file://": { rules: [] },
      "http://": { rules: [] },
      "https://": { rules: [] }
    },

    logOutputFile: null,
    enableFontSubsetting: true,
    pdfBackend: "CPDF", // CPDF, PDFLib, GD, auto
    defaultMediaType: "screen",
    defaultPaperSize: "A4",
    defaultPaperWidth: 381, // mm
    defaultPaperHeight: 660.4, // mm
    defaultPaperOrientation: "portrait",
    dpi: 96,
    enablePhp: false, // Node.js won't use this, kept for parity
    enableJavascript: true,
    enableRemote: true,
    fontHeightRatio: 1.1,
    enableHtml5Parser: true
  }
};
