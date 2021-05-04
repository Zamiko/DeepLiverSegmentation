//we'll have to change this later
const studyUrl = "49591";
let allStudies =[];


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
        /*
        [
          {
            "00080020":{"vr":"DA","Value":["20100510"]},
            "00080030":{"vr":"TM","Value":["133352.906000"]},
            "00080050":{"vr":"SH","Value":["00000001"]},
            "00080090":{"vr":"PN"},
            "00100010":{"vr":"PN","Value":[{"Alphabetic":"Patient^Anonymous"}]}, -- patient name
            "00100020":{"vr":"LO","Value":["12345678"]},
            "00100030":{"vr":"DA","Value":["19560324"]},
            "00100040":{"vr":"CS","Value":["M"]},
            "0020000D":{"vr":"UI","Value":["1.3.6.1.4.1.25403.52237031786.3872.20100510032220.1"]},--study id?
            "00200010":{"vr":"SH","Value":["No Study ID"]}
          },
          {
            "00080005":{"vr":"CS","Value":["ISO_IR 100"]},
            "00080020":{"vr":"DA","Value":["20090831"]},
            "00080030":{"vr":"TM","Value":["095948.599"]},
            "00080050":{"vr":"SH","Value":["5471978513296937"]},
            "00080090":{"vr":"PN"},
            "00100010":{"vr":"PN","Value":[{"Alphabetic":"C3N-00198"}]}, -- patient name
            "00100020":{"vr":"LO","Value":["C3N-00198"]},
            "00100030":{"vr":"DA"},"00100040":{"vr":"CS","Value":["M"]},
            "0020000D":{"vr":"UI","Value":["1.3.6.1.4.1.14519.5.2.1.7085.2626.822645453932810382886582736291"]}, -- study id
            "00200010":{"vr":"SH"}
          },
          {
            "00080005":{"vr":"CS","Value":["ISO_IR 100"]},
            "00080020":{"vr":"DA","Value":["20030629"]},
            "00080030":{"vr":"TM","Value":["081517.464000"]},
            "00080050":{"vr":"SH"},
            "00080090":{"vr":"PN"},
            "00100010":{"vr":"PN","Value":[{"Alphabetic":"KiTS-00000"}]}, --patient name
            "00100020":{"vr":"LO","Value":["KiTS-00000"]},
            "00100030":{"vr":"DA"},
            "00100040":{"vr":"CS","Value":["F"]},
            "0020000D":{"vr":"UI","Value":["1.3.6.1.4.1.14519.5.2.1.6919.4624.135173370342136417423953641748"]}, -- study id
            "00200010":{"vr":"SH"}}]
          
          */


        let StudyDataString = xHTTPreq.responseText;
        let StudyDataAr = StudyDataString.split("}");
        console.log("We received " + StudyDataAr + " from the server");
        //Ignore first 11
        patientName = '';
        studyID =''; 
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
      }
    });
  xHTTPreq.send();
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

//will need to edit this to reflect the studyJSON
const displayStudies = (series) => {
  const htmlString = series
      .map((series) => {
          return `
            <button /*onclick = retrieve(series.studyID)*/> <div>${series.patientName}</div> <div> Study ID: ${series.studyID}</div></button>
      `;
      })
      .join('');
  studiesList.innerHTML = htmlString;
};