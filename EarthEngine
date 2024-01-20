var NAIP = ee.ImageCollection("USDA/NAIP/DOQQ"),
    rectangle = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-90.27851593366323, 29.145247771109734],
          [-90.27851593366323, 29.09947237596133],
          [-90.22937786451038, 29.09947237596133],
          [-90.22937786451038, 29.145247771109734]]], null, false),
    LANDSAT7 = ee.ImageCollection("LANDSAT/LE07/C02/T1_RT");

//Body Code

var dataSource = NAIP
gatherImages(dataSource,rectangle)

function gatherImages(dataSource, rectangle){
  //For loop to iterate through every photo in the library.
  //counter = the year the data starts
  //counter <= the end year
  // counter += by the amount of years between pictures 
  for(var counter = 2013; counter<=2021 ; counter = counter + 2){
    var filterStartDate = counter + '-01-01'
    var filterEndDate = counter + '-12-31'
    var rawIMGName = 'RawIMG'+counter
    var rawIMG = ee.ImageCollection(dataSource).filterDate(filterStartDate, filterEndDate).filterBounds(rectangle).mean();
    Map.addLayer(rawIMG.clip(rectangle), null, rawIMGName)
    //downloadIMG(rawIMG)
    ndviConversion(rawIMG, rectangle, counter)
  }
}

function ndviConversion(rawIMG, rectangle, counter){
  var ndviName = 'ndviIMG'+counter
  //(NIR - RED) / (NIR + RED)
  //Red is R for NAIP
  //NIR is N for NAIP
  var red = rawIMG.select('R')
  var nir = rawIMG.select('N')
  var ndviIMG = nir.subtract(red).divide(nir.add(red))
  var ndviParams = {min: -1, max: 0.5, palette: ['blue', 'white', 'green']}
  //downloadIMG(ndviIMG)
  Map.addLayer(ndviIMG.clip(rectangle), ndviParams, ndviName)
}

function downloadIMG(image){
      Export.image.toDrive({image: imagesNDVI1, 
                      folder: 'Mariotti',
                      description: 'MANGROVES_TERRES1_2017', 
                      crs: 'EPSG:4326',
             region: rectangle,
        maxPixels: 1e13,
       scale:'1' 
    });
}
