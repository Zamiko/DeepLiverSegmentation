//we'll have to change this later
studyUrl = "49591";
let allStudies =[];

//need to call studySearch on load
studySearch();


//this will create a json object representing the study
function Study(patientName, studyID) {
  this.patientName = patientName;
  this.studyID = studyID;
}


function store() {
    //we're going to want to store the url of the study to store in the request we send
    console.log("Storing current instances")
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("GET", "/store", true);
    xHTTPreq.onloadend = function(e) {
      if (xHTTPreq.status != 200) {
        console.log(xHTTPreq.responseText);
      }
      else{
        console.log("Store successful")
      }
    };
    xHTTPreq.send();
  }
function retrieve(){
    //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
    console.log("Retrieving selected instances")
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("POST", "/retrieve");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
        else{
          console.log("Retrieve successful")
        }
      });
      xHTTPreq.send(studyUrl);
}
function studySearch(){
  //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
  console.log("Searching for available studies")
  const xHTTPreq = new XMLHttpRequest();
  xHTTPreq.open("GET", "/search");
  xHTTPreq.addEventListener("load", function() {
      if (xHTTPreq.status != 200) {
        console.log(xHTTPreq.responseText);
      }
      else{
        let StudyDataString = xHTTPreq.responseText;
        let StudyDataAr = StudyDataString.split("}");
        console.log("We received " + StudyDataAr + " from the server");
        //Ignore first 11
        var patientName = '';
        var studyID =''; 
        for(i = 12; i < StudyDataAr.length; i++){
          pnIndex = StudyDataAr[i].indexOf('Alphabetic');
          IDIndex = StudyDataAr[i].indexOf('UI\",\"Value');
          if(pnIndex!=-1){
            substr = StudyDataAr[i].split("\"");
            patientName = substr[11];
          }
          if(IDIndex!=-1){
            substr = StudyDataAr[i].split("\"");
            studyID = substr[9];
          }
          if(StudyDataAr[i] === null || StudyDataAr[i] === ''){
            //push a new JSON object to the array, with the patientName and studID
            allStudies.push(new Study(patientName, studyID));
          }
        }
        console.log("Found studies " + JSON.stringify(allStudies));
        displayStudies(allStudies);
        document.getElementById("StudySearch").style.display = "block";
      }
    });
  xHTTPreq.send();
}
function retrieveStudyHandler(studyID){
  studyUrl = studyID;
  //close studySearch display
  var studyOverlay = document.getElementById('StudySearch');
  document.getElementById("StudySearch").style.display = "none";
  studyOverlay.classList.remove("Shown");
  studyOverlay.classList.add("Hidden");
  //this is maybe a bit weird, we'll have to remove this later
  var vpDiv = document.getElementById('divViewport');
  vpDiv.classList.remove("Hidden");
  vpDiv.classList.add("Shown");
  //call retrieve
  console.log("Retrieving study " + studyUrl);
}
//Search bar implementation
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
    buttonElement.addEventListener('click', function(){
        retrieveStudyHandler(element.studyID)
      });
      studiesList.append(buttonElement);
  });  
};