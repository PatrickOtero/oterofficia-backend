const fs = require("fs");
const path = require("path");

const { openApiDocument } = require("../dist/src/docs/openapi");

const outputDirectory = path.resolve(__dirname, "../docs/api");
const outputPath = path.resolve(outputDirectory, "oterofficia.openapi.json");

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI exportado em ${outputPath}`);
