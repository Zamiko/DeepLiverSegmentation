// server.js
const express = require("express");
const app = express();
const fs = require("fs");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("webMain"));
app.use(express.json());

//was trying to implement all this via a python script--however have to figure out authentication for that
const { google } = require('googleapis');
const { resolve } = require("path");
const healthcare = google.healthcare('v1');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const cloudRegion = 'us-west2';
const projectId = 'liversegmentationwebapp';
const datasetId = 'DICOM_data';
const dicomStoreId = 'testing_data';
const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;


function setRetrieveOptions(auth) {
  google.options({
    auth,
    headers: {
      Accept: 'application/dicom; transfer-syntax=*',
    },
    responseType: 'arraybuffer',
  });
}

function deletePreviousDICOMs() {
  const fileFolder = "webMain/dicoms/";
  fs.readdir(fileFolder, async (err, files) => {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }
    files.forEach(async (file, index) => {
      filePath = fileFolder + "/" + file;
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(error);
      }
    });
  });
}

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
  fileFolder = "webMain/11-13-2003-threephaseabdomen-49621/5.000000-arterial-92922/"
  fs.readdir(fileFolder, async (err, files) => {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }

    files.forEach(async (file, index) => {
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

async function writeSOPInstance(studyInstanceUid, seriesInstanceUid,
  sopInstanceUid) {
  // const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${studyInstanceUid}/series/${seriesInstanceUid}/instances/${sopInstanceUid}`;
  const instanceReq = { parent, dicomWebPath };
  const instance = await healthcare.projects.locations.datasets.dicomStores.studies.series.instances.retrieveInstance(
    instanceReq
  );
  const fileBytes = Buffer.from(instance.data);
  const fileName = "webMain/dicoms/" + sopInstanceUid + ".dcm";
  await writeFile(fileName, fileBytes);
  return 1;
}

app.post("/retrieve", async (req, res) => {
  console.log("Beginning retrieve");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // Search options setting
  google.options({
    auth,
    // 00200032 ID for Image Postion Patient in CT DICOM
    params: { includefield: '00200032' },
    headers: { Accept: 'application/dicom+json, multipart/related' },
  });

  const { StudyInstanceUID, SeriesInstanceUID } = req.body;
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
  let SOPInstances = [];
  seriesInstances.data.forEach((instance, index) => {
    SOPInstances.push(instance);
  });

  SOPInstances.sort((a, b) => {
    if (a[`00200032`].Value[2] < b[`00200032`].Value[2]) return 1;
    if (a[`00200032`].Value[2] == b[`00200032`].Value[2]) return 0;
    return -1;
  });

  var writingPromises = [];
  deletePreviousDICOMs();
  setRetrieveOptions(auth);
  SOPInstances.forEach((SOPInstance) => {
    writingPromises.push(writeSOPInstance(StudyInstanceUID, SeriesInstanceUID,
      SOPInstance[`00080018`].Value[0]));
  });

  // Delay response resolutions
  console.log(writingPromises.length);
  Promise.all(writingPromises)
    .then(values => {
      console.log(values);
      var instanceIDs = [];
      SOPInstances.forEach(SOPInstance => {
        instanceIDs.push(SOPInstance[`00080018`].Value[0]);
      });
      var instances = {
        "instanceIDs": instanceIDs,
      }
      console.log("finished");
      res.json(instances);
      res.status(200);
    })
    .catch(err => {
      console.log("failed");
      res.status(404);
      console.error(err);
    });
});

app.get("/search", async (req, res) => {
  console.log("Beginning study search");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // console.log()
  google.options({
    auth,
    headers: { Accept: 'application/dicom+json,multipart/related' },
  });

  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = 'studies';
  const request = { parent, dicomWebPath };

  const instances = await healthcare.projects.locations.datasets.dicomStores
    .searchForStudies(
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
  google.options({
    auth,
    params: { includefield: 'all' },
    headers: { Accept: 'application/dicom+json,multipart/related' },
  });
  const { StudyUID } = req.body;
  console.log("retrieving from " + StudyUID);
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${StudyUID}/series`;
  const request = { parent, dicomWebPath };

  const instances = await healthcare.projects.locations.datasets.dicomStores.searchForSeries(
    request
  );
  console.log(`Found ${instances.data.length} instances:`);
  console.log(JSON.stringify(instances.data));
  res.json(instances.data);
  res.status(200);
});

app.post("/loadSeg", async (req, res) => {
  console.log("Beginning Segmentation Search");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // Search options setting
  google.options({
    auth,
    params: { includefield: 'all' },
    headers: { Accept: 'application/dicom+json, multipart/related' },
  });

  const { StudyInstanceUID, MatchingSeriesInstanceUID } = req.body;
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${StudyInstanceUID}/instances`;
  const request = { parent, dicomWebPath };

  const studySegInstances = await healthcare.projects.locations.datasets.dicomStores.studies.series.searchForInstances(
    request
  ).catch(error => {
    console.log(error);
    res.status(404);
  });
  console.log(`Found ${studySegInstances.data.length} instances:`);

  let segInstances = [];
  studySegInstances.data.forEach((instance) => {
    if (instance[`00081115`]) {
      if (instance[`00081115`].Value[0][`0020000E`].Value[0] == MatchingSeriesInstanceUID) {
        segInstances.push(instance);
      }
    }
  });

  let numSegs = {
    "numSegs": segInstances.length,
  }
  if (segInstances.length) {
    const chosenSeg = segInstances[0];
    setRetrieveOptions(auth);
    numSegs.segSOPInstanceUID = chosenSeg[`00080018`].Value[0];
    writeSOPInstance(StudyInstanceUID, chosenSeg[`0020000E`].Value[0],
      chosenSeg[`00080018`].Value[0]).then(resolve => {
        res.json(numSegs);
        res.status(200);
      });
  } else {
    res.json(numSegs);
    res.status(200);
  }
});

//need to get uID through the request
app.get("/delete", async (req, res) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({ auth });
  var StudyInstanceUID = "1.2.124.113532.192.70.134.138.20051021.154305.4450732";
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${StudyInstanceUID}`;
  const request = { parent, dicomWebPath };

  await healthcare.projects.locations.datasets.dicomStores.studies.delete(
    request
  );
  console.log('Deleted DICOM study');
});

//this will be used to save segmentation files locally
app.post("/saveSeg", (req, res) => {
  console.log(req.body);
  const { objectUrl } = req.body;
  console.log("Saving " + objectUrl);
  filePlace = "/dicoms/";
  filePlace + `${objectUrl}`
  console.log(" to " + filePlace);
  fs.writeFile(filePlace, objectUrl, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log("Data written successfully");
  });
});

//check for invalid function calls
app.all("*", function (request, response) {
  response.status(404);
  response.sendFile(`${__dirname}/webMain/404.html`);
});

// helper function that prevents html/css/script malice
const cleanseString = function (string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

