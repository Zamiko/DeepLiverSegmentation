// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// http://expressjs.com/en/starter/static-files.html
app.use(express.static(`${__dirname}/webMain`));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/webMain/index.html`);
});

//This code is all for:
//importing DICOM instances from the cloud storage to the DICOM store, which we are using for more permanent storage
//exporting DICOM instances from the DICOM store to the cloud storage, this will allow us to access DICOM studies sent from a PACS
const { google } = require("googleapis");
const healthcare = google.healthcare("v1");
//const sleep = require("../sleep");--this dependency was causing issues
const sleep = require('util').promisify(setTimeout);

//Variables needed
//Should we also move auth here?
const cloudRegion = "us-west2";
const projectId = "liversegmentationwebapp";
const datasetId = "DICOM_data";
//TODO(?): I was planning we have two stores, one for the data Roger's given us, and then when we submit the project it should be a new/clean datastore? or we can just not bother lol
const dicomStoreId = "testing_data";
//FIXME: uhh idk if we should give this a directory
const gcsUri = "liver_segmentation";
const name = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;

const importDicomInstance = async () => {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  google.options({ auth });

  const request = {
    name,
    resource: {
      // The location of the DICOM instances in Cloud Storage
      gcsSource: {
        uri: `gs://${gcsUri}`
      }
    }
  };

  const operation = await healthcare.projects.locations.datasets.dicomStores.import(
    request
  );
  const operationName = operation.data.name;

  const operationRequest = { name: operationName };

  // Wait fifteen seconds for the LRO to finish.
  await sleep(15000);

  // Check the LRO's status
  const operationStatus = await healthcare.projects.locations.datasets.operations.get(
    operationRequest
  );

  const { data } = operationStatus;

  if (data.error === undefined) {
    console.log("Successfully imported DICOM instances");
  } else {
    console.log("Encountered errors. Sample error:");
    console.log(
      "Resource on which error occured:",
      data.error.details[0]["sampleErrors"][0]["resource"]
    );
    console.log(
      "Error code:",
      data.error.details[0]["sampleErrors"][0]["error"]["code"]
    );
    console.log(
      "Error message:",
      data.error.details[0]["sampleErrors"][0]["error"]["message"]
    );
  }
};

//I believe after calling this command there will no longer be any files stored in the cloud storage directory we're using
app.get("/unloadDataStore", (request, response) => {
  importDicomInstance();
  console.log("unloaded Data Store");
});

const exportDicomInstance = async () => {
  //FIXME: need to change this so that it doesn't request permission? maybe get it to use a service account
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  google.options({ auth });
  const request = {
    name,
    resource: {
      gcsDestination: {
        // The destination location of the DICOM instances in Cloud Storage
        uriPrefix: `gs://${gcsUri}`,
        // The format to use for the output files, per the MIME types supported in the DICOM spec
        mimeType: "application/dicom"
      }
    }
  };

  await healthcare.projects.locations.datasets.dicomStores.export(request);
  console.log(`Exported DICOM instances to ${gcsUri}`);
};
//TODO: there is (in beta) a filter file suggestion that allows us to only import a few files (ie a study) rather than everything in the Datastore this might be good to look at
app.get("/loadDataStore", (request, response) => {
  exportDicomInstance();
  console.log("loaded Data Store");
});
//End of data store manipulation

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
