## BLDViewer
server.js-nodjs file responsible for hosting the web files, accessing the data store, and calling the machine model to run  
package.json  
package-lock.json  
metainfo.json
firebase.json-deprecated, left from a previous deployment attempt  
dicomweb_commands.py-deprecated: an old attempt to access the data store with python. May be useful for future changes.  
SeriesToSeg.py-  
README.md- more information on webMain functionality  
.gitignore-Deprecated, left from a previous deployment attempt  
.firebasesrc-Deprecated, left from a previous deployment attempt  
.env--contains authentication information for the service account used to access the data store. Needs to be set manually  
#### webMain/
index.html-The file that is served. Contains the html for the main page.  
style.css-styling file for all html components.  
Liver_03_animation_transparent.gif-used for loading screens.  
404.html-doesn't ever show up, but used in case of errors in page access.  
##### js/
createSegmentationMask.js  
displaySegmentationMask.js  
dcmjs.js-contains functions for the viewer.  
fileHandler.js-handles uploading files.  
handleDICOM.js- responsible for making http requests to interact with the data storage and the machine model.  
initCornerstone.js  
initInterface.js  
reactCornerstoneViewer.js  
viewport.js  
##### dicoms/
This folder is where the dicom instances are saved during runtime.  
##### seg/
This folder is where the segmentation mask is saved during runtime.  
##### icons/
This folder contains the images used for the button icons.  
##### upload/
 Files uploaded through the website are stored here during runtime.  
#### private/
Contains the json needed for the service account to authenticate properly.  
#### nii/
#### machineModel/

  
## Viewers
### Deprecated-
This was our original attempt to implement the web-based dicom viewer, using OHIF. Ultimately it had to be dropped due to the lack of segmentation functionality, complicated code base, and inability to alter pretty much everything in the U/I.  
  
It is kept here as a warning to those that may come in the future... and also because it still has some nice U/I functionality that might be referenced for future improvements, if so desired.
