"use strict";
//TODO: this is where we'd change the image data, I believe

var imageIds = [];
for (var i = 1; i < 72; i++) {
  imageIds.push(
    "dicomweb://" +
    window.location.host +
    "/DICOM_Data/C3N-00198/08-31-2009-CT ABDOMEN W IV CONTRAST-36291/6.000000-AbdPANC 2.0 B31f-92277/1-" + i + ".dcm"
  );
}

var exampleData = {
  stack: {
    currentImageIdIndex: 0,
    imageIds
  }
};

var CornerstoneViewport = window["react-cornerstone-viewport"];
var props = {
  viewportData: exampleData,
  cornerstone,
  cornerstoneTools,
  activeTool: "Pan"
};
var app = React.createElement(CornerstoneViewport, props, null);

ReactDOM.render(app, document.getElementById("cornerstoneViewport"));
