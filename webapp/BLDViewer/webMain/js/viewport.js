"use strict";
//TODO: this is where we'd change the image data, I believe

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
