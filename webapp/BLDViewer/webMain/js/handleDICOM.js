//we'll have to change this later
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

function store() {
  //we're going to want to store the url of the study to store in the request we send
  console.log("Storing current instances")
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("GET", "/store", true);
  xHTTPreq.onloadend = function (e) {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    } else {
      console.log("Store successful")
    }
  };
  xHTTPreq.send();
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
      let instances = JSON.parse(xHTTPreq.responseText);
      changeSeries(instances.instanceIDs);
    }
  });

  const studyInstanceUid = studyUrl;
  const seriesInstanceUid = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  var seriesMetadata = {
    "studyInstanceUid": studyInstanceUid,
    "seriesInstanceUid": seriesInstanceUid
  }
  xHTTPreq.send(JSON.stringify(seriesMetadata));
}

function studySearch() {
  //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
  console.log("Searching for available studies")
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("GET", "/search");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    }
    else {
      allStudies = [];
      let studiesReceived = JSON.parse(xHTTPreq.responseText);
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
          var tempString = study[`00080020`].Value[0];
          scanDate = tempString.slice(7, 8) + "/" + tempString.slice(5, 6) + "/" + tempString.slice(0, 4);
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
          allStudies.push(new Study(accessionNumber, scanDate, patientName, MRN, studyID));
        }
      });
      console.log("Found studies " + JSON.stringify(allStudies));
      displayStudies(allStudies);
      document.getElementById("StudySearch").style.display = "block";
    }
  });
  xHTTPreq.send();
}

function seriesSearch(studyID) {
  console.log("Searching for available series in study " + studyID);
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/searchSeries");
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    }
    else {
      let seriesReceived = JSON.parse(xHTTPreq.responseText);
      var Modality = '';
      var Notes = '';
      var seriesId = '';
      allSeries = [];
      seriesReceived.forEach(function (study) {
        if (!study[`00080060`] || !study[`00080060`].Value) {
          Modality = "N/A";
        }
        else {
          Modality = study[`00080060`].Value[0];
        }
        if (!study[`0008103E`] || !study[`0008103E`].Value) {
          Notes = "No Description";
        }
        else {
          Notes = study[`0008103E`].Value[0];
        }
        if (!study[`0020000E`] || !study[`0020000E`].Value) {
          seriesId = "Not Found";
        }
        else {
          seriesId = study[`0020000E`].Value[0];
        }
        allSeries.push(new Series(Modality, Notes, seriesId));
      });
      console.log("Found series " + JSON.stringify(allSeries));
      displaySeries(allSeries);
      document.getElementById("SeriesSearch").style.display = "block";
    }
  });
  var studyIDJSON = {
    "StudyUID": studyID
  }
  xHTTPreq.send(JSON.stringify(studyIDJSON));
}

// Loading thee segmentation stored in the dat
function loadSegmentation() {
  //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
  console.log("Searching for matching segmentation");
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/loadSeg");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    } else {
      var numSegsJSON = JSON.parse(xHTTPreq.responseText);
      console.log("found " + numSegsJSON.numSegs + "segs that match");

      if (numSegsJSON.numSegs) {
        var segURL = "http://" + window.location.host + "/dicoms/"
          + numSegsJSON.segSOPInstanceUID + ".dcm";
        console.log(segURL);
        
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", () => {
          parseSeg(xhr.response);
        });
        xhr.addEventListener("error", () => {
          console.log(`Request returned, status: ${xhr.status}`);
          console.log(xhr.message);
        });
        xhr.open("GET", segURL);
        xhr.responseType = "arraybuffer"; //Type of file
        xhr.send();
      } else {
        window.alert("no segs found, we'll create one instead");
      }
    }
  });

  var StudyInstanceUID = studyUrl;
  var SeriesInstanceUID = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  var seriesMetadata = {
    "StudyInstanceUID": StudyInstanceUID,
    "MatchingSeriesInstanceUID": SeriesInstanceUID
  }
  xHTTPreq.send(JSON.stringify(seriesMetadata));
}
//handler for the series searchbar
function retrieveSeriesHandler(seriesID) {
  seriesUrl = seriesID;
  //close seriesSearch display
  var seriesOverlay = document.getElementById('SeriesSearch');
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
  var studyOverlay = document.getElementById('StudySearch');
  studyOverlay.style.display = "none";
  studyOverlay.classList.remove("Shown");
  studyOverlay.classList.add("Hidden");
  var seriesOverlay = document.getElementById('SeriesSearch');
  seriesOverlay.classList.remove("Hidden");
  seriesOverlay.classList.add("Shown");
  //get the series
  console.log("Retrieving series in study " + studyUrl);
  seriesSearch(studyID);

}
const studyElements = document.getElementById('studyElements')
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
  studyElements.innerHTML = '';
  series.forEach(element => {
    var tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.patientName} <br> ${element.MRN}</td><td>${element.studyID}</td><td>${element.accessionNumber} <br>${element.scanDate}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveStudyHandler(element.studyID)
    });
    studyElements.append(tableEl);
  });
};

//Search bar implementation
const seriesElements = document.getElementById('seriesElements')
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

const displaySeries = (instances) => {
  seriesElements.innerHTML = '';
  instances.forEach(element => {
    var tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.Modality}</td><td>${element.seriesId}</td><td>${element.Notes}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveSeriesHandler(element.seriesId)
    });
    seriesElements.append(tableEl);
  });
};

function StudySelect() {
  console.log("re-displaying study search");
  var studyOverlay = document.getElementById('StudySearch');
  studyOverlay.classList.remove("Hidden");
  studyOverlay.classList.add("Shown");
  studySearch();
}

function SeriesSelect() {
  console.log("re-displaying series search");
  var seriesOverlay = document.getElementById('SeriesSearch');
  seriesOverlay.classList.remove("Hidden");
  seriesOverlay.classList.add("Shown");
  seriesSearch(studyUrl)
}