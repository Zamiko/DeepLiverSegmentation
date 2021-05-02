//we'll have to change this later
const studyUrl = "49591";


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
        let StudyDataAr = JSON.parse(xhr.responseText);
        let StudyData = postcardDataAr[0];
        console.log("We received " + xhr.responseText + " from the server");
      }
    });
}