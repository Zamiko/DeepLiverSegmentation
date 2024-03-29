// server.js
const express = require("express");
const app = express();
const fs = require("fs");
// need this for the blob saving
const multer = require('multer');
var zip = require('express-easy-zip');

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("webMain"));

const { google } = require('googleapis');
const healthcare = google.healthcare('v1');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const cloudRegion = 'us-west2';
const projectId = 'liversegmentationwebapp';
const datasetId = 'DICOM_data';
const dicomStoreId = 'testing_data';
const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/` +
  `${datasetId}/dicomStores/${dicomStoreId}`;

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
  const fileFolders = ["webMain/dicoms/", "webMain/seg/"];
  fileFolders.forEach(fileFolder => {
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
  })
}
//think this will link directly to the storage
const dcmStorage = multer.diskStorage({
  // Destination to store dicom     
  destination: function (req, file, cb) {
    cb(null, __dirname + "/webMain/upload/");
  },
  filename: (req, file, cb) => {
    //Fixme: need to add file name extension
    cb(null, file.originalname)
  }
});

const dcmUpload = multer({
  storage: dcmStorage,
  //limits
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(dcm)$/)) {
      // upload only dcm
      return cb(new Error('Please upload a dicom series'))
    }
    cb(undefined, true)
  }
})

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/webMain/index.html`);
});

app.post("/saveUpload", dcmUpload.array("newDICOM[]"), function (req, res) {
  console.log("files successfully uploaded");
  res.status(200).send({ message: "all good!" })
}, (error, req, res, next) => {
  console.log("files failed to upload");
  res.status(400).send({ error: error.message });
  console.log(error.message);
});

app.get('/launchMachine', (req, res) => {
  let dataToSend;
  const spawn = require("child_process").spawn;
  // TODO change back to python for deployment
  const python = spawn('python3', ['./SeriesToSeg.py']);
  // Send python stdout back to server
  python.stdout.on('data', function (data) {
    console.log('Pipe data from python script ...');
    dataToSend = data.toString();
  });
  // In close event we are sure that stream from child process is closed
  python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    console.log(dataToSend);
    // Once browser receives this, it can load created segmentation
  });
  res.status(200);
  res.send(dataToSend);
})

app.post("/saveSeg", dcmUpload.single("newSeg"), function (req, res) {
  console.log("seg successfully saved");
  res.status(200).send({ message: "all good!" })
}, (error, req, res, next) => {
  console.log("seg unsuccessfully saved");
  res.status(400).send({ error: error.message })
});

app.use(zip());
app.get('/zip', function (req, res, next) {
  const seriesPath = `${__dirname}/webMain/dicoms`;
  const segmentationPath = `${__dirname}/webmain/seg`;
  const nameString = 'bld-dicoms.zip';
  res.zip({
    files: [
      { path: segmentationPath, name: 'segmentation' },
      { path: seriesPath, name: 'series' }
    ],
    filename: nameString
  });
  res.status(200);
  console.log("All zipped");
});

// All functions below expect to recieve and return JSONs
app.use(express.json());

app.post("/upload", async (req, res) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const { studyInstanceUid, matchingSeriesInstanceUid } = req.body;
  const fileFolder = "webMain/upload/";

  deleteSegsForSeries(studyInstanceUid, matchingSeriesInstanceUid);
  google.options({
    auth,
    headers: {
      'Content-Type': 'application/dicom',
      Accept: 'application/dicom+json',
    },
  });
  fs.readdir(fileFolder, async (err, files) => {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }
    numFilesSaved = 1;
    files.forEach(async (file, index) => {
      const dicomWebPath = 'studies';
      // Use a stream because other types of reads overwrite the client's HTTP
      // headers and cause storeInstances to fail.
      const filePath = fileFolder + file;
      const binaryData = fs.createReadStream(filePath);
      const request = {
        parent,
        dicomWebPath,
        requestBody: binaryData,
      };

      const instance = await healthcare.projects.locations.datasets.dicomStores
        .storeInstances(
          request
        );

      console.log("Stored file number " + numFilesSaved);
      numFilesSaved += 1;
    });
  });
  res.status(200);
  console.log("Done storing");
});

async function writeSOPInstance(studyInstanceUid, seriesInstanceUid,
  sopInstanceUid, name) {
  const dicomWebPath = `studies/${studyInstanceUid}/series/` +
    `${seriesInstanceUid}/instances/${sopInstanceUid}`;
  const instanceReq = { parent, dicomWebPath };
  const instance = await healthcare.projects.locations.datasets.dicomStores
    .studies.series.instances.retrieveInstance(
      instanceReq
    );
  const fileBytes = Buffer.from(instance.data);
  let fileName = "webMain/dicoms/" + sopInstanceUid + ".dcm";
  if (name === "segmentation") {
    fileName = "webMain/seg/segmentation.dcm";
  }
  await writeFile(fileName, fileBytes);
  return 1;
}

app.post("/retrieve", async (req, res) => {
  console.log("Beginning retrieve");
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({
    auth,
    // 00200032 ID for Image Postion Patient in CT DICOM
    params: { includefield: '00200032' },
    headers: { Accept: 'application/dicom+json, multipart/related' },
  });

  const { studyInstanceUid, seriesInstanceUid } = req.body;
  const dicomWebPath = `studies/${studyInstanceUid}/series/` +
    `${seriesInstanceUid}/instances`;
  const request = { parent, dicomWebPath };
  const seriesInstances = await healthcare.projects.locations.datasets
    .dicomStores.studies.series.searchForInstances(
      request
    )
    .catch(error => {
      console.log(error);
      res.status(404);
    });
  console.log(`Found ${seriesInstances.data.length} instances`);
  let sopInstances = [];
  seriesInstances.data.forEach((instance, index) => {
    sopInstances.push(instance);
  });

  sopInstances.sort((a, b) => {
    if (a[`00200032`].Value[2] < b[`00200032`].Value[2]) return 1;
    if (a[`00200032`].Value[2] == b[`00200032`].Value[2]) return 0;
    return -1;
  });

  let writingPromises = [];
  deletePreviousDICOMs();
  setRetrieveOptions(auth);
  sopInstances.forEach((sopInstance) => {
    writingPromises.push(writeSOPInstance(studyInstanceUid, seriesInstanceUid,
      sopInstance[`00080018`].Value[0]));
  });

  // Delay response resolutions
  console.log(writingPromises.length);
  Promise.all(writingPromises)
    .then(values => {
      let instanceIds = [];
      sopInstances.forEach(sopInstance => {
        instanceIds.push(sopInstance[`00080018`].Value[0]);
      });
      let instances = {
        "instanceIDs": instanceIds,
      }
      console.log("Finished writing all instances");
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
  google.options({
    auth,
    headers: { Accept: 'application/dicom+json,multipart/related' },
  });

  const dicomWebPath = 'studies';
  const request = { parent, dicomWebPath };

  const instances = await healthcare.projects.locations.datasets.dicomStores
    .searchForStudies(
      request
    );

  console.log(`Found ${instances.data.length} studies`);
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
  const { studyInstanceUid } = req.body;
  console.log("retrieving from " + studyInstanceUid);
  const dicomWebPath = `studies/${studyInstanceUid}/series`;
  const request = { parent, dicomWebPath };
  const series = await healthcare.projects.locations.datasets.dicomStores
    .searchForSeries(
      request
    );

  console.log(`Found ${series.data.length} series`);
  res.json(series.data);
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
  const { studyInstanceUid, matchingSeriesInstanceUid } = req.body;
  const dicomWebPath = `studies/${studyInstanceUid}/instances`;
  const request = { parent, dicomWebPath };
  const studySegInstances = await healthcare.projects.locations.datasets
    .dicomStores.studies.series.searchForInstances(
      request
    ).catch(error => {
      console.log(error);
      res.status(404);
    });
  console.log(`Found ${studySegInstances.data.length} instances in `
    + `study ${studyInstanceUid}`);

  let matchingSegInstances = [];
  studySegInstances.data.forEach((instance) => {
    if (instance[`00081115`]) {
      if (instance[`00081115`].Value[0][`0020000E`].Value[0]
        == matchingSeriesInstanceUid) {
        matchingSegInstances.push(instance);
      }
    }
  });

  let numSegs = {
    "numSegs": matchingSegInstances.length,
  }
  if (matchingSegInstances.length) {
    const chosenSeg = matchingSegInstances[0];
    setRetrieveOptions(auth);
    numSegs.segSopInstanceUid = chosenSeg[`00080018`].Value[0];
    writeSOPInstance(studyInstanceUid, chosenSeg[`0020000E`].Value[0],
      chosenSeg[`00080018`].Value[0], "segmentation").then(resolve => {
        res.json(numSegs);
        res.status(200);
      });
  } else {
    res.json(numSegs);
    res.status(200);
  }
});

async function deleteSegsForSeries(studyInstanceUid, matchingSeriesInstanceUid) {
  console.log("searching for segs to delete")
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  // Search options setting
  google.options({
    auth,
    params: { includefield: 'all' },
    headers: { Accept: 'application/dicom+json, multipart/related' },
  });

  const dicomWebPath = `studies/${studyInstanceUid}/instances`;
  const request = { parent, dicomWebPath };

  const studySegInstances = await healthcare.projects.locations.datasets
    .dicomStores.studies.series.searchForInstances(
      request
    ).catch(error => {
      console.log(error);
      res.status(404);
    });

  let matchingSegInstances = [];
  studySegInstances.data.forEach((instance) => {
    if (instance[`00081115`]) {
      if (instance[`00081115`].Value[0][`0020000E`].Value[0]
        == matchingSeriesInstanceUid) {
        console.log(instance[`0020000E`].Value[0]);
        matchingSegInstances.push(instance);
      }
    }
  });

  google.options({ auth });
  matchingSegInstances.forEach(async (segInstance) => {
    const dicomWebPath = `studies/${studyInstanceUid}/`
      + `series/${segInstance[`0020000E`].Value[0]}`;
    const request = { parent, dicomWebPath };
    await healthcare.projects.locations.datasets.dicomStores.studies.series
      .delete(request);
    console.log(`done deleting seg ${segInstance[`0020000E`].Value[0]}`);
  });
}

app.get("/delete", async (req, res) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({ auth });
  var StudyInstanceUID =
    "1.2.124.113532.192.70.134.138.20051021.154305.4450732";
  const dicomWebPath = `studies/${StudyInstanceUID}`;
  const request = { parent, dicomWebPath };

  await healthcare.projects.locations.datasets.dicomStores.studies.delete(
    request
  );
  console.log('Deleted DICOM study');
});

app.post("/deleteSeries", async (req, res) => {
  const auth = await google.auth.getClient({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  google.options({ auth });
  const { studyInstanceUid, seriesInstanceUid } = req.body;
  const dicomWebPath = `studies/${studyInstanceUid}/`
    + `series/${seriesInstanceUid}`;
  const request = { parent, dicomWebPath };

  await healthcare.projects.locations.datasets.dicomStores.studies.series
    .delete(
      request
    );
  console.log('Deleted DICOM series');
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
