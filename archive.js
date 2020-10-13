const fs = require('fs')
const path = require('path')
const yauzl = require('yauzl')

function unzip(pn, altTopFolder) {
  let topFolder = undefined;
  let nFiles = 0;
  let nFolders = 0;
  yauzl.open(pn, {lazyEntries: true}, function(err, zipfile) {
    if (err) {
      console.log(err.message);
      process.exit(1);
    }
    zipfile.readEntry();
    zipfile.on("end", function() {
      console.log(`${nFolders} folders, ${nFiles} files created.`)
    });
    zipfile.on("entry", function(entry) {
      if (/\/$/.test(entry.fileName)) {
        let folderToCreate;
        // First test to see if this is the first folder, and if specified, store that
        if (altTopFolder && !topFolder) {
          topFolder = entry.fileName;
        }

        // Directory file names end with '/'.
        // Note that entries for directories themselves are optional.
        // An entry's fileName implicitly requires its parent directories to exist.
        if (entry.fileName.startsWith(topFolder)) {
          folderToCreate = path.join(altTopFolder, entry.fileName.slice(topFolder.length));
        } else {
          folderToCreate = entry.fileName;
        }
        console.log(folderToCreate);
        try {
          fs.mkdirSync(folderToCreate);
          nFolders++;
        }
        catch (err) {
          console.error(`Unzip error: `+err.message);
          process.exit(1);
        }
        zipfile.readEntry();
      } else {
        // file entry
        let fileToCreate;
        if (topFolder && entry.fileName.startsWith(topFolder)) {
          fileToCreate = path.join(altTopFolder, entry.fileName.slice(topFolder.length));
        } else {
          fileToCreate = entry.fileName;
        }
        console.log(fileToCreate);
        const writer = fs.createWriteStream(fileToCreate)
        zipfile.openReadStream(entry, function(err, readStream) {
          if (err) {
            console.log(err.message);
            process.exit(1);
          }
          readStream.on("end", function() {
            nFiles++;
            zipfile.readEntry();
          });
          readStream.pipe(writer);
        });
      }
    });
  });
}

module.exports = { unzip }