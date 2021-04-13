// Upload Image using a post request
// Called by the event listener that is waiting for a file to be chosen
//not using this at the moment
function uploadFile() {
    // get the file chosen by the file dialog control
    const selectedFile = document.getElementById("fileChooser").files[0];
    // store it in a FormData object
    const formData = new FormData();
    // name of field, the file itself, and its name
    formData.append("newImage", selectedFile, selectedFile.name);
  
    // build a browser-style HTTP request data structure
    const xHTTPreq = new XMLHttpRequest();
    // it will be a POST request, the URL will this page's URL+"/upload"
    xHTTPreq.open("POST", "/uploadDICOM", true);
    // callback function executed when the HTTP response comes back
    xHTTPreq.onloadend = function(e) {
      // Get the server's response body
      console.log(xHTTPreq.responseText);
    };
  
    // actually send the request
    xHTTPreq.send(formData);
  }
function importDataStoretoBucket(){
    const xHTTPreq = new XMLHttpRequest();
    //this will be a Get request--maybe should change to a POST request when we implement study selection? unnecessary though, I think
    xHTTPreq.open("GET", "/loadDataStore");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
      });
      xHTTPreq.send();
}
function exportDataStoretoBucket(){
    const xHTTPreq = new XMLHttpRequest();
    //this will be a Get request--maybe should change to a POST request when we implement study selection? unnecessary though, I think
    xHTTPreq.open("GET", "/unloadDataStore");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
      });
      xHTTPreq.send();
}
// Add event listener to the file input element
document.getElementById("uploadDICOM").addEventListener("change", uploadFile);
document.getElementById("loadDICOM").addEventListener("click", importDataStoretoBucket);
document.getElementById("unloadDICOM").addEventListener("click", exportDataStoretoBucket);