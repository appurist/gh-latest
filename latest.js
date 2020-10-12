const path = require('path')
const fs = require('fs')  
const axios = require('axios')

const FILENAME = 'latest.zip';

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
      console.log(`${rel.tag_name} "${rel.name}": ${rel[downloadField]}`)
    }

    console.log(`Downloading latest ${format} for ${latest.tag_name}...`)
    await downloadFile(latest[downloadField], fn);
  }
  catch (err) {
    console.error('Error: '+err.message);
    process.exit(1);
  }
  return fn;
}

let owner = process.argv[2];
let project = process.argv[3];
let format =  process.argv[4] || 'zip';
let outfile =  process.argv[5] || format == 'tar' ? 'latest.tar.gz' : 'latest.zip';

if (process.argv.length < 4) {
  console.error("Usage: latest owner project [zip|tar [ outfile]]");
  console.error("  e.g. latest appurist github-latest zip latest.zip");
  process.exit(1);
}

downloadLatest(owner, project, format, outfile).then((fn)=> {
  console.log("Download complete:", fn);
})
