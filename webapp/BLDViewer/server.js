// server.js
// where your node app starts

// init project
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("webMain"));

//was trying to implement all this via a python script--however have to figure out authentication for that
const {google} = require('googleapis');
const healthcare = google.healthcare('v1');
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
// When specifying the output file, use an extension like ".multipart."
// Then, parse the downloaded multipart file to get each individual
// DICOM file.
const fileName = 'study_file.multipart';

const cloudRegion = 'us-west2';
const projectId = 'liversegmentationwebapp';
const datasetId = 'DICOM_data';
const dicomStoreId = 'testing_data';

const dicomWebStoreInstance = async () => {
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
  //const dcmFile = 
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = 'studies';
  // Use a stream because other types of reads overwrite the client's HTTP
  // headers and cause storeInstances to fail.
  const binaryData = fs.createReadStream(dcmFile);
  const request = {
    parent,
    dicomWebPath,
    requestBody: binaryData,
  };

  const instance = await healthcare.projects.locations.datasets.dicomStores.storeInstances(
    request
  );
  console.log('Stored DICOM instance:\n', JSON.stringify(instance.data));
};


const dicomWebSearchForInstances = async () => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({
    auth,
    headers: {Accept: 'application/dicom+json,multipart/related'},
  });

  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = 'instances';
  const request = {parent, dicomWebPath};

  const instances = await healthcare.projects.locations.datasets.dicomStores.searchForInstances(
    request
  );
  //FIXME: will have to send this data back to the frontend for display
  console.log(`Found ${instances.data.length} instances:`);
  console.log(JSON.stringify(instances.data));
};



const dicomWebRetrieveStudy = async (studyUid) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({
    auth,
    headers: {
      Accept: 'multipart/related; type=application/dicom; transfer-syntax=*',
    },
    responseType: 'arraybuffer',
  });

  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${studyUid}`;
  const request = {parent, dicomWebPath};

  const study = await healthcare.projects.locations.datasets.dicomStores.studies.retrieveStudy(
    request
  );

  const fileBytes = Buffer.from(study.data);

  await writeFile(fileName, fileBytes);
  console.log(
    `Retrieved study and saved to ${fileName} in current directory`
  );
};


const dicomWebDeleteStudy = async (studyUid) => {
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
};

//dicomWebDeleteStudy();



// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/webMain/index.html`);
});


//FIXME: for all three of these functions I may need to directly write the async fucntion here instead of writing it elsewhere and calling it here
app.get("/store", (request, response) => {
  dicomWebStoreInstance();
});

app.get("/retrieve", (request, response) => {
  //FIXME: we can store the information of the study we want to retrieve in request and pass it to the function
  dicomWebRetrieveStudy();
});

app.get("/search", (request, response) => {
  //FIXME: we'l need to pass the JSON information back through response
  dicomWebSearchForInstances();
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