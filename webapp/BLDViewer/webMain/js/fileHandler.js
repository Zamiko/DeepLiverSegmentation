

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
    //send these to the server for purposes of saving with multer
    //--unless mitchell expresses need to change from multer usage
    //console.log("Saving " + nameString);
    const xHTTPreq = new XMLHttpRequest();
    xHTTPreq.open("POST", "/saveUpload");
    xHTTPreq.addEventListener("load", function() {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
        else{
          console.log("Save successful");
          //now that files have returned, store them all
          store();
          //Now, we have three options:
            //expect client to go back to study search to access new files
                //PROBLEM: uploaded DICOM instances and the retrieved DICOM instances will both be in the dicoms folder
                    //refresh/re-retrieve necessary to remove this
            //reload study search ourselves
                //Problem: need to find way to wait until store() is called before calling studySearch()
            //directly retrieve the newly uploaded files
                //Problem: need to find way to wait until store() is called before calling retrieve()

        }
    });
    xHTTPreq.send(formData);
}

function downloadFiles(){
    //FIXME: need to set up the zip function in the server
    //send a get request to that function
    //create a url for that zip file
    //then use window.open(zipUrl); to download it
}