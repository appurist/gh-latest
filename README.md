# github-latest
A quick little utility to download the latest release of a given project from GitHub.

Note: It does not use project versions or tags, it uses the publish date and will download the latest.

### To Build
To build the tool with yarn:
```
yarn install
yarn build
```
This will produce an executable named `latest` (or `latest.exe` on Windows).

### Usage
```
latest owner project [zip|tar [ outfile]]
```
The default is to download the zip file, and the output filename (`outfile`) is either `latest.zip` or `latest.tar.gz`, depending on the format requested.

For example, to download the zip for the latest release of this project:
```
latest appurist github-latest
```
This will download the latest release as `latest.zip`.

To download the tarball for the latest release of this project:
```
latest appurist github-latest tar
```
This will download the latest release as `latest.tar.gz`.

It is also possible to specify the download file (or path):
```
latest appurist github-latest zip outfile.zip
```
This will download the latest zip release as `outfile.zip`.
