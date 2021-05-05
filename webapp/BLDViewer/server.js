// server.js
const express = require("express");
const app = express();
const fs = require("fs");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("webMain"));
app.use(express.json());

//was trying to implement all this via a python script--however have to figure out authentication for that
const {google} = require('googleapis');
const healthcare = google.healthcare('v1');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);


const cloudRegion = 'us-west2';
const projectId = 'liversegmentationwebapp';
const datasetId = 'DICOM_data';
const dicomStoreId = 'testing_data';

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/webMain/index.html`);
});


app.get("/store", async (req, res) => {
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    google.options({
      auth,
      headers: {
        'Content-Type': 'application/dicom',
        Accept: 'application/dicom+json',
      },
    });
    //Ideally I think we should aim to only have one study held locally (per user???) so we can just link from that location 
    fileFolder = "webMain/dicoms/"
    fs.readdir(fileFolder, async (err, files) => {
      if (err) {
        console.error("Could not list the directory.", err);
        process.exit(1);
      }
    
      files.forEach(async(file, index) => {
        const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
        const dicomWebPath = 'studies';
        // Use a stream because other types of reads overwrite the client's HTTP
        // headers and cause storeInstances to fail.
        filePath = fileFolder + "/" + file
        const binaryData = fs.createReadStream(filePath);
        const request = {
          parent,
          dicomWebPath,
          requestBody: binaryData,
        };
  
        const instance = await healthcare.projects.locations.datasets.dicomStores.storeInstances(
        request
        );
        console.log('Stored DICOM instance:\n', JSON.stringify(instance.data));
      });
    });
  }
);

app.post("/retrieve", async (req, res) => {
  console.log("Beginning retrieve");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // Search options setting
  google.options({
    auth,
    headers: {
      Accept: 'application/dicom+json, multipart/related'
    },
  });

  const { StudyInstanceUID, SeriesInstanceUID } = req.body;
  console.log(req.body);
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances`;
  const request = { parent, dicomWebPath };

  const seriesInstances = await healthcare.projects.locations.datasets.dicomStores.studies.series.searchForInstances(
    request
  ).catch(error => {
    console.log(error);
    res.status(404);
  });

  console.log(`Found ${seriesInstances.data.length} instances:`);

  var SOPInstanceUIDs = [];
  seriesInstances.data.forEach(instance => {
    console.log(instance);
    SOPInstanceUIDs.push(instance[`00080018`].Value[0]);
  });
  setRetrieveOptions(auth);

  SOPInstanceUIDs.forEach(async (SOPInstanceUID, index) => {
    const dicomWebPath = `studies/${StudyInstanceUID}/series/${SeriesInstanceUID}/instances/${SOPInstanceUID}`;
    const instanceReq = { parent, dicomWebPath };

    const instance = await healthcare.projects.locations.datasets.dicomStores.studies.series.instances.retrieveInstance(
      instanceReq
    );
    const fileBytes = Buffer.from(instance.data);
    const fileName = "webMain/dicoms/"+ (index + 1) + ".dcm";
    await writeFile(fileName, fileBytes);
  })
  res.status(200);
  res.json(JSON.stringify(seriesInstances.data.length));
});

app.get("/search", async (req, res) => {
  console.log("Beginning study search");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  console.log()
  google.options({
    auth,
    headers: {Accept: 'application/dicom+json,multipart/related'},
  });

  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = 'studies';
  const request = {parent, dicomWebPath};

  const instances = await healthcare.projects.locations.datasets.dicomStores.searchForStudies(
    request
  );
  console.log(`Found ${instances.data.length} instances:`);
  console.log(JSON.stringify(instances.data));
  res.json(instances.data);
  res.status(200);
});

app.post("/searchSeries", async (req, res) => {
  console.log("Beginning study search");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  console.log()
  google.options({
    auth,
    headers: {Accept: 'application/dicom+json,multipart/related'},
  });
  const {StudyUID} = req.body;
  console.log("retrieving from " + StudyUID);
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${StudyUID}/series`;
  const request = {parent, dicomWebPath};

  const instances = await healthcare.projects.locations.datasets.dicomStores.searchForSeries(
    request
  );
  console.log(`Found ${instances.data.length} instances:`);
  console.log(JSON.stringify(instances.data));
  res.json(instances.data);
  res.status(200);
});

//need to get uID through the request
app.get("/delete", async (req, res) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({auth});

  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${studyUid}`;
  const request = {parent, dicomWebPath};

  await healthcare.projects.locations.datasets.dicomStores.studies.delete(
    request
  );
  console.log('Deleted DICOM study');
});
//this will be used to save segmentation files locally
app.post("/saveSeg", (req, res)=>{
  console.log(req.body);
  const {objectUrl} = req.body;
  console.log("Saving " + objectUrl);
  filePlace = "/dicoms/";
  filePlace + `${objectUrl}`
  console.log(" to " + filePlace);
  fs.writeFile(filePlace, objectUrl, function(err) {
    if (err) {
       return console.error(err);
    }
    console.log("Data written successfully");
 });
});

//check for invalid function calls
app.all("*", function(request, response) {
  response.status(404);
  response.sendFile(`${__dirname}/webMain/404.html`);
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

function setRetrieveOptions(auth) {
  google.options({
    auth,
    headers:  {
      Accept: 'application/dicom; transfer-syntax=*',
    },
    responseType: 'arraybuffer',
  });
}