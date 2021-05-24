

//this will facilitate selection of files from a folder.
//FIXME: need to save these to webMain/dicoms, then after call store in handleDICOM
function selectFolder(e) {
    const formData = new FormData();
    for (var i = 0; i < e.target.files.length; i++) {
       let nameString = e.target.files[i].name;
       let file = e.target.files[i];
       formData.append("newDICOM[]", file, nameString);
    }
    //all files in e.target.files
    //send these to the server for purposes of saving with multer--unless mitchell expresses need to change from multer usage
    //console.log("Saving " + nameString);
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("POST", "/saveUpload");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
        else{
          console.log("Save successful")
        }
    });
    xHTTPreq.send(formData);
    //FIXME: intending to store the newly uploaded instances, then reload the search parameters
    //the store function is called now because tbh that's the easiest way I could think of to ensure the file follow the naming reqs of the viewport
    store();
    //studySearch();
}

function downloadFiles(){
    //FIXME: need to set up the zip function in the server
    //send a get request to that function
    //create a url for that zip file
    //then use window.open(zipUrl); to download it
}