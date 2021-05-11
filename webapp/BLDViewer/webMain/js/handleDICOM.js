//we'll have to change this later
studyUrl = '';
seriesUrl = '';
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
      let StudyDataString = xHTTPreq.responseText;
      let StudyDataAr = StudyDataString.split("}");
      //console.log("We received " + StudyDataAr + " from the server");
      //Ignore first 11
      //FIXME: we want Patient Name(00100010), MRN(00100020), Accession Number (00080050), Scan Date (00080020)
      var patientName = '';
      var studyID = '';
      var accessionNumber = '';
      var scanDate = '';
      var MRN = '';
      for (i = 12; i < StudyDataAr.length; i++) {
        anIndex = StudyDataAr[i].indexOf('00080050');
        sdIndex = StudyDataAr[i].indexOf('00080020');
        pnIndex = StudyDataAr[i].indexOf('00100010');
        mrnIndex = StudyDataAr[i].indexOf('00100020');
        IDIndex = StudyDataAr[i].indexOf('0020000D');
        if (anIndex != -1) {
          substr = StudyDataAr[i].split("\"");
          //FIXME: add check here to see if index exists
          accessionNumber = substr[9];
        }
        if (sdIndex != -1) {
          substr = StudyDataAr[i].split("\"");
          scanDate = substr[9];
          //FIXME: add some code to format this like a date?
        }
        if (pnIndex != -1) {
          substr = StudyDataAr[i].split("\"");
          patientName = substr[11];
        }
        if (mrnIndex != -1) {
          substr = StudyDataAr[i].split("\"");
          MRN = substr[9];
        }
        if (IDIndex != -1) {
          substr = StudyDataAr[i].split("\"");
          studyID = substr[9];
        }
        if (StudyDataAr[i] === null || StudyDataAr[i] === '') {
          allStudies.push(new Study(accessionNumber, scanDate, patientName, MRN, studyID));
        }
      }
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
  //FIXME: check for viewport bug, if still around, need to remove this and change viewport z-index instead
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
      series.studyID.toLowerCase().includes(searchString)||
      series.MRN.toLowerCase().includes(searchString)||
      series.accessionNumber.toLowerCase().includes(searchString)||
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
      instances.Type.toLowerCase().includes(searchStringSeries) ||
      instances.Notes.toLowerCase().includes(searchStringSeries) ||
      instances.seriesId.toLowerCase().includes(searchStringSeries)
    );
  });
  displaySeries(filteredInstances);
});

const displaySeries = (instances) => {
  seriesList.innerHTML =  '<tr class="header"><th style="width:25%;">Modality</th><th style="width:50%;">Series ID</th><th style="width:25%;">Description</th></tr>';
  instances.forEach(element => {
    var tableEl = document.createElement('tr');
    tableEl.innerHTML = `<td>${element.Type}</td><td>${element.seriesId}</td><td>${element.Notes}</td>`;
    tableEl.addEventListener('click', function () {
      retrieveSeriesHandler(element.seriesId)
    });
    seriesList.append(tableEl);
  });
};