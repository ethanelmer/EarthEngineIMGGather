///////////////////IMPORTS START///////////////////
var rectangle = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-90.27868759504018, 29.14674702983323],
          [-90.27868759504018, 29.100972302151064],
          [-90.22954952588734, 29.100972302151064],
          [-90.22954952588734, 29.14674702983323]]], null, false),
    LANDSAT7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_RT");
///////////////////IMPORTS END///////////////////

var dataSource = LANDSAT7
gatherImages(dataSource,rectangle)

function gatherImages(dataSource, rectangle){
  //For loop to iterate through every photo in the library.
  //counter = the year the data starts
  //counter <= the end year
  // counter += by the amount of years between pictures 
  for(var counter = 2020; counter<=2023 ; counter = counter + 1){
    var filterStartDate = counter + '-01-01'
    var filterEndDate = counter + '-12-31'
    
    //RawIMG Stuff
    var rawIMGName = 'RawIMG'+counter
    var rawIMG = ee.ImageCollection(dataSource).filterDate(filterStartDate, filterEndDate).filterBounds(rectangle).median();
    //downloadIMG(rawIMG, rawIMGName)
    //Map.addLayer(rawIMG.clip(rectangle), null, 'RawIMG'+counter)
    
    //NDVI IMG Stuff
    //ndviConversion(rawIMG, rectangle, counter)
    
    //BandsIMG Stuff
    var bandsIMG = rawIMG.addBands(rawIMG, ['B1','B4'])
    var bandsIMGName = 'BandsIMG'+counter
    //dowloadIMG(bandsIMG,)
    
    //MaskedIMG Stuff
    var maskedIMG = dataSource.filterDate(filterStartDate, filterEndDate).map(maskQuality)
    var maskedIMGName = 'MaskedIMG' + counter
    downloadIMG(maskedIMG, maskedIMGName)
    //Map.addLayer(maskedIMG, null, 'maskedIMG'+counter)
    
  }
}

function downloadIMG(image, name){
      Export.image.toDrive({image: image, 
                      folder: 'Mariotti',
                      description: "MangrovesTerre1"+name, 
                      crs: 'EPSG:4326',
             region: rectangle,
        maxPixels: 1e13,
       scale:'30' 
    });
}

// A function to mask out cloudy pixels.
function maskQuality(image) {
  // Select the QA band.
  var QA = image.select('QA_PIXEL');
  // Get the internal_cloud_algorithm_flag bit.
  var internalQuality = getQABits(QA,3, 3, 'cloud');
  var internalQuality2 = getQABits(QA,8, 9, 'cloud confidence');
  var internalQuality3 = getQABits(QA,4,4, 'cloud shadow');
  var internalQuality4 = getQABits(QA,6,6, 'clear');
  var QA2 = image.select('QA');
  // Return an image masking out cloudy areas.
  return image.updateMask(internalQuality.eq(0))
  .updateMask(internalQuality2.eq(0))
  .updateMask(internalQuality3.eq(0))
  .updateMask(internalQuality4.eq(0))
}

// helper function to extract the QA bits
function getQABits(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
      pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    print(pattern)
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
}
