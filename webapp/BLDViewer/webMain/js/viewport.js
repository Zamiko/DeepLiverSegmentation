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
// ReactDOM.render(app, document.getElementById("cornerstoneViewport"));

function changeSeries(numInstances) {
  var newImageIds = [];
  for (var i = 1; i <= numInstances; i++) {
    newImageIds.push(
      "wadouri://" +
      window.location.host +
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