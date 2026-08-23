const fs = require("fs");
const path = require("path");

function readJSON(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function writeJSON(fileName, data) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  readJSON,
  writeJSON
};