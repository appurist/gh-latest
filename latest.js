const fs = require('fs')  
const axios = require('axios')
const package = require('./package.json')
const archive = require('./archive.js')

const UNZIP_FOLDER = 'latest-unzipped';

let verbose = false;
let showall = false;
let unzip = false;

function usage() {
  console.log("latest "+package.version);
  console.log("Usage: latest [-avxXh?] owner project [tar|zip|unzip|asset [ outfile]]");
  console.log(" e.g.: latest -x appurist github-latest zip latest.zip");
  console.log("   or: latest appurist github-latest asset   (list assets)");
  console.log("   or: latest appurist github-latest asset latest.exe   (download latest.exe)");
  console.log("Options are:");
  console.log("    -a all: display all release versions/tags (no download)");
  console.log("    -x expand: (unzip) the zip file after download");
  console.log("    -X expand verbose: unzip and show files");
  console.log("    -v version: show version info");
  console.log("    -h or -? help: show this usage syntax");
  process.exit(1);
}

function MB(bytes) {  // 2 places after the decimal
  return Number.parseFloat(bytes / (1024*1024)).toFixed(2);
}

async function fetchReleases(owner, project) {
  let url = `https://api.github.com/repos/${owner}/${project}/releases`;
  const response = await axios({ url, method: 'GET', responseType: 'json' })
  return response.data;
}

async function downloadFile(url, pn) {  
  const writer = fs.createWriteStream(pn)
  const response = await axios({ url, method: 'GET', responseType: 'stream' })
  response.data.pipe(writer)
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

async function downloadLatest(owner, project, format, fn) {
  try {
    let latest;
    let latestDate;
    let downloadField = `${format.toLowerCase()}ball_url`;

    let releases = await fetchReleases(owner, project);
    for (let rel of releases) {
      let published = new Date(rel.published_at);
      let relDate = published.valueOf();
      if (latestDate === undefined || relDate > latestDate) {
        latestDate = relDate;
        latest = rel;
      }
      if (showall) {
        console.log(`${rel.tag_name} "${rel.name}": ${rel[downloadField]}`)
      }
    }
    if (showall) {
      console.log(`If run without -a option, latest will download ${latest.tag_name} "${latest.name}".`)
      process.exit(0);
    }

    if (format === 'asset') {
      if (latest.assets) {
        if (!outfile) {
          console.log(`${latest.name} has ${latest.assets.length} assets:`)
        }
        for (let asset of latest.assets) {
          let url = asset.browser_download_url;
          if (outfile) {
            if (outfile === asset.name) {
              console.log(`Downloading ${format} for: ${latest.tag_name} "${latest.name}" ...`)
              await downloadFile(url, outfile);
              return outfile;
            }
          } else {
            //console.log(`${asset.size} bytes: '${asset.name}' has url: ${url}`);
            console.log(`${MB(asset.size)} MB ${asset.name}`);
          }
        }
        if (outfile) {
          // we shouldn't get here.
          console.error(`Could not find asset '${outfile}' in ${latest.name}.`);
          process.exit(1);
        }
      } else {
        console.error('There are no assets.');
      }
      process.exit(0);
    } else {
      console.log(`Downloading ${format} for: ${latest.tag_name} "${latest.name}" ...`)
      await downloadFile(latest[downloadField], fn);
    }
  }
  catch (err) {
    console.error('Error: '+err.message);
    process.exit(1);
  }
  return fn;
}

let first = 2;
if ((process.argv[first] === '-v') || (process.argv[first] === '--version')) {
  console.log("latest "+package.version);
  process.exit(0);
}

if (process.argv.length >= 4) {
  while (process.argv[first].startsWith('-')) {
    for (let opt of process.argv[first]) {
      switch(opt) {
        case '-': break;  // ignore
        case 'a': showall = true; break;
        case 'h': usage(); break;
        case '?': usage(); break;
        case 'x': unzip = true; break;
        case 'X': unzip = true; verbose = true; break;
        case 'v': 
          console.log("latest "+package.version);
          break;
        default:
          console.log(`Error: Unrecognized option '${opt}'.`);
          process.exit(1);
      }
    }
    first++;
  }
} else {
  usage();
}

let owner = process.argv[first];
let project = process.argv[first+1];
let format =  process.argv[first+2] || 'zip';
let outfile = process.argv[first+3];

if ((format !== 'asset') && !outfile) {
  outfile = (format == 'tar' ? 'latest.tar.gz' : 'latest.zip');
}

if (format === 'asset') {
  unzip = false;
}

if (format === 'unzip') {
  format = 'zip';
  unzip = true;
}

if (unzip && (format !== 'zip')) {
  console.error("Expand (unzip) option only currently supports zip files.");
  process.exit(1);
}

downloadLatest(owner, project, format, outfile).then((fn)=> {
  console.log("Download complete:", fn);
  if (unzip) {
    archive.unzip(fn, UNZIP_FOLDER, verbose);
  }
})
