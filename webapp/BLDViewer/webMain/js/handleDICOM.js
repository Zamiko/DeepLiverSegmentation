//we'll have to change this later
const studyUrl = "49591";


function store() {
    //we're going to want to store the url of the study to store in the request we send

    // build a browser-style HTTP request data structure
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("GET", "/store", true);
    // callback function executed when the HTTP response comes back
    xHTTPreq.onloadend = function(e) {
      // Get the server's response body
      console.log(xHTTPreq.responseText);
    };
  
    // actually send the request
    xHTTPreq.send();
  }
function retrieve(){
    //we're going to want to store the url of the study to retrieve, I think. Not yet got that working.
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("POST", "/retrieve");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
      });
      xHTTPreq.send(studyUrl);
}
// Add event listener to the file input element
document.getElementById("saveDICOM").addEventListener("click", store());
document.getElementById("loadDICOM").addEventListener("click", retrieve);