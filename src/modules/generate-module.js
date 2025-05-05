const fs = require('fs');
const path = require('path');

// Helper function to recursively replace content in files
const replaceContentInFile = (filePath, oldName, newName) => {
  let fileContent = fs.readFileSync(filePath, 'utf8');
  fileContent = fileContent.replace(new RegExp(oldName, 'g'), newName);
  fs.writeFileSync(filePath, fileContent, 'utf8');
};

// Helper function to copy and rename a file or folder
const copyFile = (source, destination) => {
  const stat = fs.lstatSync(source);
  
  if (stat.isDirectory()) {
    // Create directory
    fs.mkdirSync(destination);
    const files = fs.readdirSync(source);
    files.forEach(file => {
      copyFile(path.join(source, file), path.join(destination, file));
    });
  } else if (stat.isFile()) {
    // Copy file and rename it
    fs.copyFileSync(source, destination);
  }
};

// Main function to generate a new module
const generateModule = (moduleName, destinationFolder = '') => {
  // Default to the current directory if no destination folder is provided
  const outputDir = destinationFolder || __dirname;

  const demoFolderPath = path.join(__dirname, 'demo');
  const newModuleFolderPath = path.join(outputDir, moduleName);

  // Step 1: Copy the entire demo folder to the new module
  copyFile(demoFolderPath, newModuleFolderPath);

  // Step 2: Rename files in the new module folder
  const files = fs.readdirSync(newModuleFolderPath);

  files.forEach(file => {
    const oldFilePath = path.join(newModuleFolderPath, file);
    const newFilePath = path.join(newModuleFolderPath, file.replace('demo', moduleName));

    fs.renameSync(oldFilePath, newFilePath);
  });

  // Step 3: Replace 'demo' references with the new module name
  files.forEach(file => {
    const filePath = path.join(newModuleFolderPath, file);
    replaceContentInFile(filePath, 'Demo', moduleName);
  });

  console.log(`Module ${moduleName} has been created in ${outputDir}`);
};

// Get the module name and optional destination folder from command-line arguments
const moduleName = process.argv[2];
const destinationFolder = process.argv[3];

if (!moduleName) {
  console.log('Please provide a module name.');
} else {
  generateModule(moduleName, destinationFolder);
}