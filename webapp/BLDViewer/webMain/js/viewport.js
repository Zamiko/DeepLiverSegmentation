"use strict";

// Displaying and interacting with DICOM series using plain cornerstone 
// and cornerstoneTools
function changeSeries(instanceIDs) {
  console.log(instanceIDs.length);
  const element = document.getElementById("cornerstoneViewport");
  cornerstone.enable(element);

  let imageIds = [];
  for (var i = 0; i < instanceIDs.length; i++) {
    imageIds.push(
      "wadouri://" +
      window.location.host +
      "/dicoms/" + instanceIDs[i] + ".dcm"
    );
  }

  const stack = {
    currentImageIdIndex: 0,
    imageIds: imageIds
  };

  // load images and set the stack
  cornerstone.loadImage(imageIds[0]).then(image => {
    cornerstoneTools.addStackStateManager(element, ["stack"]);
    cornerstoneTools.addToolState(element, "stack", stack);
    cornerstone.displayImage(element, image);
  });
}