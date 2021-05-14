"use strict";
//TODO: this is where we'd change the image data, I believe

var imageIds = [];
for (var i = 1; i < 242; i++) {
  imageIds.push(
    "wadouri://" +
    window.location.host +
    "/dicoms/" + i + ".dcm"
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
function addLeadingZeroes(index) {
  if (index < 10)
    return "00" + index;
  if (index < 100)
    return "0" + index;
  return index;
}

function changeSeries(numInstances) {
  console.log(numInstances);
  var newImageIds = [];
  // for (var i = 1; i <= 602; i++) {
  for (var i = 1; i <= numInstances; i++) {
    newImageIds.push(
      "wadouri://" +
      window.location.host +
      // "/11-13-2003-threephaseabdomen-49621/5.000000-arterial-92922/1-" + addLeadingZeroes(i) + ".dcm"
      "/dicoms/" + i + ".dcm"
    );
  }
  var exampleData = {
    stack: {
      currentImageIdIndex: 0,
      imageIds: newImageIds
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
}