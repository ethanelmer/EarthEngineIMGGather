///////////////////IMPORTS START///////////////////
var rectangle = 
    /* color: #d63000 */
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
    LANDSAT7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_RT"),
    Copernicus = ee.ImageCollection("COPERNICUS/S1_GRD"),
    NAIP = ee.ImageCollection("USDA/NAIP/DOQQ"),
    Sentinel = ee.ImageCollection("COPERNICUS/S2");
///////////////////IMPORTS END///////////////////


var dataSource = Sentinel
gatherImages(dataSource,rectangle)

function gatherImages(dataSource, rectangle){
  //For loop to iterate through every photo in the library.
  //counter = the year the data starts
  //counter <= the end year
  // counter += by the amount of years between pictures 
  for(var counter = 2020; counter<=2023 ; counter = counter + 1){
    var filterStartDate = counter + '-01-01'
    var filterEndDate = counter + '-12-31'
    
    //RawIMG 
    var rawIMGMedianName = 'RawIMG'+counter
    var rawIMGMedian = ee.ImageCollection(dataSource).filterDate(filterStartDate, filterEndDate).filterBounds(rectangle).median();
    var rawIMG10perc = ee.ImageCollection(dataSource).filterDate(filterStartDate, filterEndDate).reduce(ee.Reducer.percentile([10]));
    //downloadIMG(rawIMGMedian, rawIMGMedianName)
    //Map.addLayer(rawIMGMedian.clip(rectangle), null, 'RawIMGMedian'+counter)
    
    //NDVI IMG 
    // var ndviParams = {min: -1, max: 0.5, palette: ['blue', 'white', 'green']}
    // var ndviIMG = ndviConversion(rawIMGMedian, rectangle, counter)
    // var ndviName = 'NDVI'+counter
    // downloadIMG(ndviIMG, ndviName)
    // Map.addLayer(ndviIMG.clip(rectangle), ndviParams, ndviName)
    
    //BandsIMGMedian 
    // var ndviIMGMedian = ndviBandMedian(rawIMGMedian, rectangle, counter).clip(rectangle)
    // var addedBandsMedian = rawIMG10perc.addBands(ndviIMGMedian, ['NDVI'] )
    // var bandsIMGMedian = ee.ImageCollection(addedBandsMedian).select('NDVI').median()
    // var bandsIMGMedianName = 'BandsIMGMedian'+counter
    // downloadIMG(bandsIMGMedian,bandsIMGMedianName)
    
    //BandsIMG10p 
    var ndviIMG10perc = ndviBand10perc(rawIMG10perc, rectangle, counter).clip(rectangle)
    var addedBands10perc = rawIMGMedian.addBands(ndviIMG10perc, ['NDVI'] )
    var bandsIMG10p = ee.ImageCollection(addedBands10perc).select('NDVI').median()
    var bandsIMG10pName = 'BandsIMG10p'+counter
    downloadIMG(bandsIMG10p,bandsIMG10pName)
    
    //MaskedIMG 
    // var maskedIMG = dataSource.filterDate(filterStartDate, filterEndDate).map(maskQuality)
    // var maskedIMGName = 'MaskedIMG' + counter
    // downloadIMG(maskedIMG, maskedIMGName)
    // Map.addLayer(maskedIMG, null, maskedIMGName)
    
  }
}

function downloadIMG(image, name){
      Export.image.toDrive({image: image, 
                      folder: 'Mariotti',
                      description: "SentinelTerre1"+name, 
                      crs: 'EPSG:4326',
             region: rectangle,
        maxPixels: 1e13,
       scale:'10' 
    });
}

function ndviConversion(rawIMG, rectangle, counter){
  var ndviName = 'ndviIMG'+counter
  //(NIR - RED) / (NIR + RED)
  //Red is R for NAIP
  //NIR is N for NAIP
  var red = rawIMG.select('B3')
  var nir = rawIMG.select('B4')
  var ndviIMG = nir.subtract(red).divide(nir.add(red))
  return ndviIMG 
}

function ndviBand10perc(rawIMG, rectangle, counter){
  var ndviName = 'ndviIMG'+counter
  //(NIR - RED) / (NIR + RED)
  //Red is B4_p10 for Sentinel
  //NIR is B8_p10 for Sentinel
  var ndvi = rawIMG.normalizedDifference(['B8_p10', 'B4_p10']).rename('NDVI');
  var img = rawIMG.addBands(ndvi);
  return img 
}

function ndviBandMedian(rawIMG, rectangle, counter){
  var ndviName = 'ndviIMG'+counter
  //(NIR - RED) / (NIR + RED)
  //Red is B4 for Sentinel
  //NIR is B8 for Sentinel
  var ndvi = rawIMG.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var img = rawIMG.addBands(ndvi);
  return img 
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
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
}
