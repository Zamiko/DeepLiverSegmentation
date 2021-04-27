# README.md

This is a node.js app with dependencies:  
    express  
    googleapis  

which can both be installed with npm install

The dicomweb commands:  
How I believe these should work are as follows:  
- Upon logging in (yet to be implemented) the user will be prompted to choose a study (the study selection command--yet to be implemented + tested)
- Upon selecting a study, we will store any study currently held locally (if there is any study to store) and delete the local copy  
    - alternatively perhaps if we can check for cookies, we can provide an idle prompt to save before re-requesting the user log in again. If they choose to save, then we store the study, otherwise we don't. In any case we can delete the local copy
- When the local location of our dicom files is empty, we will retrieve(yet to be implemented + tested) the chosen study
- After loading this study, we then must display it (this will involve changing the current implementation of file loading only slightly--it will still be from a local address)
- When the user chooses to load a segmentation:  
    if there is already segmentation data, load it
    if there is no segmentation data, pass the dicom files to the machine learning model so the segmentation masks are produced and then loaded
- When the user chooses to save a segmentation, we will save it to the local study. If storing doesn't remove the local copy, we can also send a store command so that the new changes are saved in our dataset  
    - I don't really know what we'd do otherwise: if we'd just store and retrieve or wait until the user presses a "done" button  
    - on this note should we also provide an abort button that allows the user to not save anything to the dataset?
        - perhaps this could simply be a "back" button and will return user to the study selection screen

The order in which we should implement and test the dicomweb commands is:  
store-Done
retrieve  
search  
I provided the code for the deletion of a study in the dataset, but I don't know that it would be necessary