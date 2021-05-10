//we'll have to change this later
studyUrl = '';
seriesUrl = '';
let allStudies = [];
let allSeries = [];
//need to call studySearch on load
studySearch();
//this will create a json object representing the study
function Study(patientName, studyID) {
  this.patientName = patientName;
  this.studyID = studyID;
}
//this will create a json object representing the series
function Series(Type, Notes, seriesId) {
  this.Type = Type;
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
      var numInstances = parseInt(xHTTPreq.responseText.substring(1, xHTTPreq.responseText.length - 1));
      changeSeries(numInstances);
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
      // console.log(JSON.parse(xHTTPreq.responseText));
      let studiesReceived = JSON.parse(xHTTPreq.responseText);
      var patientName = '';
      var studyID = '';
      studiesReceived.forEach(function (study) {
          patientName = study[`00100010`].Value[0][`Alphabetic`];
          studyID = study[`0020000D`].Value[0];
          allStudies.push(new Study(patientName, studyID));
        });
      console.log("Found studies " + JSON.stringify(allStudies));
      displayStudies(allStudies);
      document.getElementById("StudySearch").style.display = "block";
    }
  });
  xHTTPreq.send();
}
function seriesSearch(studyID) {
  //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
  console.log("Searching for available series in study " + studyID);
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("POST", "/searchSeries");
  xHTTPreq.setRequestHeader("Content-Type", "application/json");
  xHTTPreq.addEventListener("load", function () {
    if (xHTTPreq.status != 200) {
      console.log(xHTTPreq.responseText);
    }
    else {
      let SeriesDataString = xHTTPreq.responseText;
      let SeriesDataAr = SeriesDataString.split("}");
      var Type = '';
      var Notes = '';//sorry didn't know what else to call this
      var seriesId = '';
      for (i = 0; i < SeriesDataAr.length; i++) {
        TypeIndex = SeriesDataAr[i].indexOf('00080060');
        NotesIndex = SeriesDataAr[i].indexOf('0008103E');
        seriesIdIndex = SeriesDataAr[i].indexOf('0020000E');
        if (TypeIndex != -1) {
          substr = SeriesDataAr[i].split("\"");
          Type = substr[9];
        }
        if (NotesIndex != -1) {
          substr = SeriesDataAr[i].split("\"");
          Notes = substr[9];
        }
        if (seriesIdIndex != -1) {
          substr = SeriesDataAr[i].split("\"");
          seriesId = substr[9];
        }
        if (SeriesDataAr[i] === null || SeriesDataAr[i] === '') {
          //push a new JSON object to the array, with the patientName and studID
          allSeries.push(new Series(Type, Notes, seriesId));
        }
      }
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
  //this is maybe a bit weird, we'll have to remove this later
  var vpDiv = document.getElementById('divViewport');
  vpDiv.classList.remove("Hidden");
  vpDiv.classList.add("Shown");
  //retrieve instances in the series
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
      series.studyID.toLowerCase().includes(searchString)
    );
  });
  displayStudies(filteredSeries);
});

const displayStudies = (series) => {
  studiesList.innerHTML = "";
  series.forEach(element => {
    var buttonElement = document.createElement('button');
    buttonElement.classList = "button";
    buttonElement.innerHTML = `<div class="patientName">Patient Name: ${element.patientName}</div><divclass="studyID">Study ID: ${element.studyID}</div>`;
    buttonElement.addEventListener('click', function () {
      retrieveStudyHandler(element.studyID)
    });
    studiesList.append(buttonElement);
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
      instances.Type.toLowerCase().includes(searchStringSeries) ||
      instances.Notes.toLowerCase().includes(searchStringSeries) ||
      instances.seriesId.toLowerCase().includes(searchStringSeries)
    );
  });
  displaySeries(filteredInstances);
});

const displaySeries = (instances) => {
  seriesList.innerHTML = "";
  instances.forEach(el => {
    var buttonEl = document.createElement('button');
    buttonEl.classList = "button";
    buttonEl.innerHTML = `<div class="type">Type: ${el.Type}</div><div class="seriesID">Series ID: ${el.seriesId}</div><div class="notes">${el.Notes}</div>`;
    buttonEl.addEventListener('click', function () {
      retrieveSeriesHandler(el.seriesId)
    });
    seriesList.append(buttonEl);
  });
};