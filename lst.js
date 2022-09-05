////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////TEMPERATURE///////////////////////////////////////////

// Import hourly predicted temperature image collection for northern winter
// solstice. Note that predictions extend for 384 hours; limit the collection
// to the first 24 hours.
var tempCol = ee.ImageCollection('NOAA/GFS0P25')
  .filterDate('2021-12-22', '2021-12-23')
  .limit(24)
  .select('temperature_2m_above_ground');

// Define visualization arguments to control the stretch and color gradient
// of the data.
var visArgs = {
  min: -40.0,
  max: 35.0,
  palette: ['blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};

// Convert each image to an RGB visualization image by mapping the visualize
// function over the image collection using the arguments defined previously.
var tempColVis = tempCol.map(function(img) {
  return img.visualize(visArgs);
});

// Import country features and filter to South American countries.
var southAmCol = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filterMetadata('wld_rgn', 'equals', 'South America');

// Define animation region (South America with buffer).
var southAmAoi = ee.Geometry.Rectangle({
  coords: [-103.6, -58.8, -18.4, 17.4], geodesic: false});

// Define an empty image to paint features to.
var empty = ee.Image().byte();

// Paint country feature edges to the empty image.
var southAmOutline = empty
  .paint({featureCollection: southAmCol, color: 1, width: 1})
  // Convert to an RGB visualization image; set line color to black.
  .visualize({palette: '000000'});

// Map a blend operation over the temperature collection to overlay the country
// border outline image on all collection images.
var tempColOutline = tempColVis.map(function(img) {
  return img.blend(southAmOutline);
});  

// Define animation arguments.
var videoArgs = {
  dimensions: 768,
  region: southAmAoi,
  framesPerSecond: 7,
  crs: 'EPSG:3857'
};

// Display the animation.
print(ui.Thumbnail(tempColOutline, videoArgs));
  
//////////////////
// Define an empty image to paint features to.
var empty = ee.Image().byte();

// Paint country feature edges to the empty image.
var southAmOutline = empty
  .paint({featureCollection: southAmCol, color: 1, width: 1})
  // Convert to an RGB visualization image; set line color to black.
  .visualize({palette: '000000'});

// Map a blend operation over the temperature collection to overlay the country
// border outline image on all collection images.
var tempColOutline = tempColVis.map(function(img) {
  return img.blend(southAmOutline);
  
  
  
});

// Define a partially opaque grey RGB image to dull the underlying image when
// blended as an overlay.
var dullLayer = ee.Image.constant(175).visualize({
  opacity: 0.6, min: 0, max: 255, forceRgbOutput: true});

// Map a two-part blending operation over the country outline temperature
// collection for final styling.
var finalVisCol = tempColOutline.map(function(img) {
  return img
    // Blend the dulling layer with the given country outline temperature image.
    .blend(dullLayer)
    // Blend a clipped copy of the country outline temperature image with the
    // dulled background image.
    .blend(img.clipToCollection(southAmCol));
});

// Define animation arguments.
var videoArgs = {
  dimensions: 768,
  region: southAmAoi,
  framesPerSecond: 7,
  crs: 'EPSG:3857'
};

// Display the animation.
print(ui.Thumbnail(finalVisCol, videoArgs));


///OVERLAY DEM

// Define a hillshade layer from SRTM digital elevation model.
var hillshade = ee.Terrain.hillshade(ee.Image('USGS/SRTMGL1_003')
  // Exaggerate the elevation to increase contrast in hillshade.
  .multiply(100))
  // Clip the DEM by South American boundary to clean boundary between
  // land and ocean.
  .clipToCollection(southAmCol);

// Map a blend operation over the temperature collection to overlay a partially
// opaque temperature layer on the hillshade layer.
var finalVisCol = tempColVis.map(function(img) {
  return hillshade
    .blend(img.clipToCollection(southAmCol).visualize({opacity: 0.6}));
});

// Define animation arguments.
var videoArgs = {
  dimensions: 768,
  region: southAmAoi,
  framesPerSecond: 7,
  crs: 'EPSG:3857'
};

// Display the animation.
print(ui.Thumbnail(finalVisCol, videoArgs));
