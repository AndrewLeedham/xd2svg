module.exports = function (inputFile, outputFile) {
  'use strict';

  const [fs, unzip, tmp] = [
    require('fs'),
    require('extract-zip'),
    require('tmp')
  ];

  const artBoardConverter = require('../lib/artboardConverter.js');
  const manifestParser = require('../lib/manifestParser');

  let directory = tmp.dirSync({
    unsafeCleanup: true
  });

  unzip(inputFile, {dir: directory.name}, function (error) {
    if (error) throw error;

    let json = fs.readFileSync(`${directory.name}/manifest`, 'utf-8');

    let manifest = JSON.parse(json);

    let manifestInfo = manifestParser(manifest);

    let convertedArtboards = [];

    manifestInfo.artboards.forEach(artboardItem => {
      let json = fs.readFileSync(`${directory.name}/artwork/${artboardItem.path}/graphics/graphicContent.agc`, 'utf-8');

      let artboard = JSON.parse(json);

      let artboardInfo = {
        title: artboardItem.name,
        x: artboardItem['uxdesign#bounds'].x,
        y: artboardItem['uxdesign#bounds'].y,
        width: artboardItem['uxdesign#bounds'].width,
        height: artboardItem['uxdesign#bounds'].height,
        viewport: artboardItem['uxdesign#viewport']
      };

      let contentOfArtboard = artBoardConverter(artboard, artboardInfo).join('');

      convertedArtboards.push(contentOfArtboard);
    });

    let totalSvg = `<?xml version="1.0" standalone="no"?>
    <svg xmlns="http://www.w3.org/2000/svg"
         id="${manifestInfo.id}"
         version="1.1">
      ${convertedArtboards.join('')}
    </svg>`;

    directory.removeCallback();

    fs.writeFile(outputFile, totalSvg, 'utf-8');
  });

};