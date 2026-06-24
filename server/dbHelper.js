const fs = require('fs');
const path = require('path');

// Static references to force Vercel Node File Trace to bundle these JSON files
try {
  require.resolve('./data/products.json');
  require.resolve('./data/users.json');
  require.resolve('./data/orders.json');
  require.resolve('./data/coupons.json');
} catch (e) {
  // Ignored in local environments where paths might resolve differently
}

// Resolve the data directory dynamically
let DATA_DIR = path.join(__dirname, 'data');

// Fallback search for Vercel/bundling environments where __dirname might be flattened
if (!fs.existsSync(path.join(DATA_DIR, 'products.json'))) {
  const potentialPaths = [
    path.join(process.cwd(), 'server', 'data'),
    path.join(process.cwd(), 'data'),
    path.join(__dirname, '..', 'server', 'data'),
    path.join(__dirname, '..', 'data')
  ];
  for (const p of potentialPaths) {
    if (fs.existsSync(path.join(p, 'products.json'))) {
      DATA_DIR = p;
      break;
    }
  }
}

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
