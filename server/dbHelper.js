const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

function getFilePath(fileName) {
  return path.join(DATA_DIR, fileName);
}

function readData(fileName) {
  const filePath = getFilePath(fileName);
  try {
    if (!fs.existsSync(filePath)) {
      // Initialize with empty array if file does not exist
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData || '[]');
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return [];
  }
}

function writeData(fileName, data) {
  const filePath = getFilePath(fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error);
    return false;
  }
}

module.exports = {
  readData,
  writeData
};
