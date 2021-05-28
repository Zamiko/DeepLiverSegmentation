let studyUrl = '';
let seriesUrl = '';
let allStudies = [];
let allSeries = [];
//need to call studySearch on load
studySearch();
//this will create a json object representing the study
function Study(accessionNumber, scanDate, patientName, MRN, studyID) {
  this.accessionNumber = accessionNumber;
  this.scanDate = scanDate;
  this.patientName = patientName;
  this.MRN = MRN;
  this.studyID = studyID;
}
//this will create a json object representing the series
function Series(Modality, Notes, seriesId) {
  this.Modality = Modality;
  this.Notes = Notes;
  this.seriesId = seriesId;
}

function uploadToDicomStore() {
  // we're going to want to store the url of the study 
  // to store in the request we send
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/upload");
  xHTTPreq.onloadend = function (e) {
    if (xHTTPreq.status != 200) {
      console.log("Something went wrong");
      console.log(xHTTPreq.responseText);
    } else {
      console.log("Stored successfully");
    }
  };

  const studyInstanceUid = studyUrl;
  const seriesInstanceUid = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  const seriesMetadata = {
    "studyInstanceUid": studyInstanceUid,
    "matchingSeriesInstanceUid": seriesInstanceUid
  }
  xHTTPreq.send(JSON.stringify(seriesMetadata));
  // xHTTPreq.send();
}

function retrieve() {
  console.log("Retrieving selected instances");
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/retrieve");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log("failed");
      console.log(xHTTPreq.responseText);
    } else {
      console.log("Retrieve successful");
      const instances = JSON.parse(xHTTPreq.responseText);
      showViewport();
      changeSeries(instances.instanceIDs);
    }
  });

  const studyInstanceUid = studyUrl;
  const seriesInstanceUid = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  const seriesMetadata = {
    "studyInstanceUid": studyInstanceUid,
    "seriesInstanceUid": seriesInstanceUid
  }
  xHTTPreq.send(JSON.stringify(seriesMetadata));
  showLoading();
}

function showLoading() {
  // document.getElementById("LoadingScreen").style.display = "block";
  // document.getElementById("divViewport").style.display = "none";
  document.getElementById("LoadingScreen").classList.add("Shown");
  document.getElementById("LoadingScreen").classList.remove("Hidden");
  document.getElementById("divViewport").classList.remove("Shown");
  document.getElementById("divViewport").classList.add("Hidden");
}

function showViewport() {
  document.getElementById("LoadingScreen").classList.remove("Shown");
  document.getElementById("LoadingScreen").classList.add("Hidden");
  document.getElementById("divViewport").classList.add("Shown");
  document.getElementById("divViewport").classList.remove("Hidden");
  // document.getElementById("LoadingScreen").style.display = "none";
  // document.getElementById("divViewport").style.display = "block";
}

function hideViewportLoading() {
  document.getElementById("LoadingScreen").classList.remove("Shown");
  document.getElementById("LoadingScreen").classList.add("Hidden");
  document.getElementById("divViewport").classList.remove("Shown");
  document.getElementById("divViewport").classList.add("Hidden");
  // document.getElementById("LoadingScreen").style.display = "none";
  // document.getElementById("divViewport").style.display = "none";
}

function studySearch() {
  console.log("Searching for available studies")
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("GET", "/search");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    } else {
      allStudies = [];
      const studiesReceived = JSON.parse(xHTTPreq.responseText);
      let patientName = '';
      let studyID = '';
      let accessionNumber = '';
      let scanDate = '';
      let MRN = '';
      studiesReceived.forEach(function (study) {
        if (!study[`00080050`] || !study[`00080050`].Value) {
          accessionNumber = "N/A";
        } else {
          accessionNumber = study[`00080050`].Value[0];
        }
        if (!study[`00080020`] || !study[`00080020`].Value) {
          scanDate = "0/0/0000";
        } else {
          const tempString = study[`00080020`].Value[0];
          scanDate = tempString.slice(7, 8) + "/" + tempString.slice(5, 6) +
            "/" + tempString.slice(0, 4);
        }
        if (!study[`00100010`] || !study[`00100010`].Value) {
          patientName = "Not Found";
        } else {
          patientName = study[`00100010`].Value[0][`Alphabetic`];
        }
        if (!study[`00100020`] || !study[`00100020`].Value) {
          MRN = "N/A";
        } else {
          MRN = study[`00100020`].Value[0];
        }
        if (!study[`0020000D`] || !study[`0020000D`].Value) {
          studyID = "Not Found";
        } else {
          studyID = study[`0020000D`].Value[0];
        }
        if (patientName != "Patient^Anonymous") {
          allStudies.push(new Study(accessionNumber, scanDate, patientName,
            MRN, studyID));
        }
      });
      console.log("Found studies " + JSON.stringify(allStudies));
      displayStudies(allStudies);
    }
  });
  xHTTPreq.send();
  showLoading();
}

function launchMachine() {
  console.log("Launching machine");
  const xHttpReq = new XMLHttpRequest();
  xHttpReq.open("GET", "/launchMachine");
  xHttpReq.addEventListener("load", function () {
    if (xHttpReq.status != 200) {
      console.log(xHttpReq.responseText);
    } else {
      getAndLoadSeg("segmentation");
    }
  });
  xHttpReq.send();
}

function seriesSearch(studyInstanceUid) {
  console.log("Searching for available series in study " + studyInstanceUid);
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/searchSeries");
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    } else {
      const seriesReceived = JSON.parse(xHTTPreq.responseText);
      let Modality = '';
      let Notes = '';
      let seriesId = '';
      allSeries = [];
      console.log(seriesReceived);
      seriesReceived.forEach(function (study) {
        if (!study[`00080060`] || !study[`00080060`].Value) {
          Modality = "N/A";
        } else {
          Modality = study[`00080060`].Value[0];
        }
        if (!study[`0008103E`] || !study[`0008103E`].Value) {
          Notes = "No Description";
        } else {
          Notes = study[`0008103E`].Value[0];
        }
        if (!study[`0020000E`] || !study[`0020000E`].Value) {
          seriesId = "Not Found";
        } else {
          seriesId = study[`0020000E`].Value[0];
        }
        allSeries.push(new Series(Modality, Notes, seriesId));
      });
      console.log("Found series " + JSON.stringify(allSeries));
      displaySeries(allSeries);
    }
  });
  const studyId = studyUrl;
  const studyIdJson = {
    "studyInstanceUid": studyId
  }
  xHTTPreq.send(JSON.stringify(studyIdJson));
  showLoading();
}

// Loading the segmentation stored in the data store
function loadSegmentation() {
  console.log("Searching for matching segmentation");
  const XmlHttpReq = new XMLHttpRequest();
  XmlHttpReq.open("POST", "/loadSeg");
  XmlHttpReq.addEventListener("load", function () {
    if (XmlHttpReq.status != 200) {
      console.log(XmlHttpReq.responseText);
    } else {
      const numSegsJson = JSON.parse(XmlHttpReq.responseText);
      console.log("found " + numSegsJson.numSegs + " segs that match");

      if (numSegsJson.numSegs) {
        // TODO Refactor with whats in displaySegmentationMask
        getAndLoadSeg("segmentation");
        // const segURL = window.location.origin + "/dicoms/"
        //   + numSegsJson.segSopInstanceUid + ".dcm";
        // console.log(segURL);
        // const xhr = new XMLHttpRequest();
        // xhr.addEventListener("load", () => {
        //   parseSeg(xhr.response);
        // });
        // xhr.addEventListener("error", () => {
        //   console.log(`Request returned, status: ${xhr.status}`);
        //   console.log(xhr.message);
        // });
        // xhr.open("GET", segURL);
        // xhr.responseType = "arraybuffer"; //Type of file
        // xhr.send();
      } else {
        window.alert("No segmentation masks were found. We will create one :)");
        launchMachine();
      }
    }
  });

  const studyInstanceUid = studyUrl;
  const matchingSeriesInstanceUid = seriesUrl;
  XmlHttpReq.setRequestHeader("Content-Type", "application/json");
  const seriesMetadata = {
    "studyInstanceUid": studyInstanceUid,
    "matchingSeriesInstanceUid": matchingSeriesInstanceUid
  }
  XmlHttpReq.send(JSON.stringify(seriesMetadata));
}

//handler for the series searchbar
function retrieveSeriesHandler(seriesID) {
  seriesUrl = seriesID;
  //close seriesSearch display
  const seriesOverlay = document.getElementById('SeriesSearch');
  console.log("Class list is " + seriesOverlay.classList);
  seriesOverlay.style.display = "none";
  seriesOverlay.classList.remove("Shown");
  seriesOverlay.classList.add("Hidden");
  console.log("Retrieving instances in series " + seriesUrl);
  retrieve();
}

//handler for the study searchbar
function retrieveStudyHandler(studyID) {
  studyUrl = studyID;
  //close studySearch display
  const studyOverlay = document.getElementById('StudySearch');
  studyOverlay.style.display = "none";
  studyOverlay.classList.remove("Shown");
  studyOverlay.classList.add("Hidden");
  const seriesOverlay = document.getElementById('SeriesSearch');
  seriesOverlay.classList.remove("Hidden");
  seriesOverlay.classList.add("Shown");
  //get the series
  console.log("Retrieving series in study " + studyUrl);
  seriesSearch(studyID);
}
const studiesList = document.getElementById('studiesList')
const searchBar = document.getElementById('searchBar');

searchBar.addEventListener('keyup', (e) => {
  const searchString = e.target.value.toLowerCase();
  console.log("searching for study " + searchString);

  const filteredSeries = allStudies.filter((series) => {
    return (
      series.patientName.toLowerCase().includes(searchString) ||
      series.studyID.toLowerCase().includes(searchString) ||
      series.MRN.toLowerCase().includes(searchString) ||
      series.accessionNumber.toLowerCase().includes(searchString) ||
      series.scanDate.toLowerCase().includes(searchString)
    );
  });
  displayStudies(filteredSeries);
});

const displayStudies = (series) => {
  studiesList.innerHTML = '';
  series.forEach(element => {
    const tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.patientName} <br> ${element.MRN}</td><td>${element.studyID}</td><td>${element.accessionNumber} <br>${element.scanDate}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveStudyHandler(element.studyID)
    });
    studiesList.append(tableEl);
  });
  document.getElementById("StudySearch").style.display = "block";
  hideViewportLoading();
};

//Search bar implementation
const seriesList = document.getElementById('seriesList')
const searchBarSeries = document.getElementById('searchBarSeries');

searchBarSeries.addEventListener('keyup', (e) => {
  const searchStringSeries = e.target.value.toLowerCase();
  console.log("searching for series " + searchStringSeries);

  const filteredInstances = allSeries.filter((instances) => {
    return (
      instances.Modality.toLowerCase().includes(searchStringSeries) ||
      instances.Notes.toLowerCase().includes(searchStringSeries) ||
      instances.seriesId.toLowerCase().includes(searchStringSeries)
    );
  });
  displaySeries(filteredInstances);
});

const deleteSeries = () => {
console.log("deleting current series");
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/deleteSeries");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log("failed");
      console.log(xHTTPreq.responseText);
    } else {
      console.log("Delete successful");
      const instances = JSON.parse(xHTTPreq.responseText);
    }
  });

  const studyInstanceUid = studyUrl;
  const seriesInstanceUid = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  const seriesMetadata = {
    "studyInstanceUid": studyInstanceUid,
    "seriesInstanceUid": seriesInstanceUid
  }
  xHTTPreq.send(JSON.stringify(seriesMetadata));
  StudySelect();
}
const displaySeries = (instances) => {
  seriesList.innerHTML = '';
  instances.forEach(element => {
    const tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.Modality}</td><td>${element.seriesId}</td><td>${element.Notes}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveSeriesHandler(element.seriesId)
    });
    seriesList.append(tableEl);
  });
  document.getElementById("SeriesSearch").style.display = "block";
  hideViewportLoading();
};

function StudySelect() {
  console.log("re-displaying study search");
  const studyOverlay = document.getElementById('StudySearch');
  studyOverlay.classList.remove("Hidden");
  studyOverlay.classList.add("Shown");
  studySearch();
}

function SeriesSelect() {
  console.log("re-displaying series search");
  const seriesOverlay = document.getElementById('SeriesSearch');
  seriesOverlay.classList.remove("Hidden");
  seriesOverlay.classList.add("Shown");
  seriesSearch(studyUrl)
}