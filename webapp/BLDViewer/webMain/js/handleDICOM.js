
//we'll have to change this later
studyUrl = '';
seriesUrl = '';
let allStudies = [];
let allSeries = [];
let jsontest = '';
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
    }
    else {
      console.log("Store successful")
    }
  };
  xHTTPreq.send();
}

function retrieve() {
  //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
  console.log("Retrieving selected instances");
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/retrieve");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    } else {
      console.log("Retrieve successful");
      var numInstancesJSON = JSON.parse(xHTTPreq.responseText);
      changeSeries(numInstancesJSON.numInstances);
    }
  });

  var StudyInstanceUID = studyUrl;
  var SeriesInstanceUID = seriesUrl;
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  var seriesMetadata = {
    "StudyInstanceUID": StudyInstanceUID,
    "SeriesInstanceUID": SeriesInstanceUID
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
      let StudyDataString = xHTTPreq.responseText;
      let StudyDataAr = StudyDataString.split("}");
      //console.log("We received " + StudyDataAr + " from the server");
      //Ignore first 11
      var patientName = '';
      var studyID = '';

      var accessionNumber = '';
      var scanDate = '';
      var MRN = '';
      studiesReceived.forEach(function (study) {
        console.log(study);
        patientName = study[`00100010`].Value[0][`Alphabetic`];
        studyID = study[`0020000D`].Value[0];
        if (study[`00080050`].Value) {
          accessionNumber = study[`00080050`].Value[0];
          } else {
            accessionNumber = '';
          }

        scanDate = study[`00080020`].Value[0];
        MRN = study[`00100020`].Value[0];
        allStudies.push(new Study(accessionNumber, scanDate, patientName, MRN, studyID));
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
      let studySeries = JSON.parse(xHTTPreq.responseText);

      let SeriesDataString = xHTTPreq.responseText;
      // let SeriesDataAr = SeriesDataString.split("}");
      var seriesModality = '';
      var seriesDescription = '';//sorry didn't know what else to call this
      var seriesInstanceUID = '';

      studySeries.forEach((series) => {
        seriesModality = series[`00080060`].Value[0];
        seriesDescription = series[`0008103E`].Value[0];
        seriesInstanceUID = series[`0020000E`].Value[0];
        allSeries.push(new Series(seriesModality, seriesDescription, seriesInstanceUID));
      });

      // for (i = 0; i < SeriesDataAr.length; i++) {
      //   TypeIndex = SeriesDataAr[i].indexOf('00080060');
      //   NotesIndex = SeriesDataAr[i].indexOf('0008103E');
      //   seriesIdIndex = SeriesDataAr[i].indexOf('0020000E');
      //   if (TypeIndex != -1) {
      //     substr = SeriesDataAr[i].split("\"");
      //     seriesType = substr[9];
      //   }
      //   if (NotesIndex != -1) {
      //     substr = SeriesDataAr[i].split("\"");
      //     seriesDescription = substr[9];
      //   }
      //   if (seriesIdIndex != -1) {
      //     substr = SeriesDataAr[i].split("\"");
      //     seriesInstanceUID = substr[9];
      //   }
      //   if (SeriesDataAr[i] === null || SeriesDataAr[i] === '') {
      //     //push a new JSON object to the array, with the patientName and studID
      //     allSeries.push(new Series(seriesType, seriesDescription, seriesInstanceUID));
      //   }
      // }
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
  //this is maybe a bit weird, we'll have to remove this later
  var seriesOverlay = document.getElementById('SeriesSearch');
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
  studiesList.innerHTML = '<tr class="header"><th style="width:25%;">Patient Name/MRN</th><th style="width:50%;">Study UID</th><th style="width:25%;">Accession Number/Scan Date</th></tr>';
  series.forEach(element => {
    var tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.patientName} <br> ${element.MRN}</td><td>${element.studyID}</td><td>${element.accessionNumber} <br>${element.scanDate}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveStudyHandler(element.studyID)
    });
    studiesList.append(tableEl);
  });
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

const displaySeries = (instances) => {
  seriesList.innerHTML = '<tr class="header"><th style="width:25%;">Modality</th><th style="width:50%;">Series ID</th><th style="width:25%;">Description</th></tr>';
  instances.forEach(element => {
    var tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.Modality}</td><td>${element.seriesId}</td><td>${element.Notes}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveSeriesHandler(element.seriesId)
    });
    seriesList.append(tableEl);
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