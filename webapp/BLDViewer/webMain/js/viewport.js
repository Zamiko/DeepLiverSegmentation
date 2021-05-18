"use strict";

function addLeadingZeroes(index) {
  if (index < 10)
    return "00" + index;
  if (index < 100)
    return "0" + index;
  return index;
}


// Displaying and interacting with DICOM series using react cornerstone viewport
function changeSeries(instanceIDs) {
  console.log(instanceIDs.length);
  var newImageIds = [];
  // for (var i = 1; i <= 91; i++) {
  for (var i = 0; i < instanceIDs.length; i++) {
    newImageIds.push(
      "wadouri://" +
      window.location.host +
      // "/DICOM_anon/" + i + ".dcm"
      // "/11-13-2003-threephaseabdomen-49621/5.000000-arterial-92922/1-" 
      // + addLeadingZeroes(i) + ".dcm"
      "/dicoms/" + instanceIDs[i] + ".dcm"
    );
  }
  var exampleData = {
    stack: {
      currentImageIdIndex: 0,
      imageIds: newImageIds
    }
  };

  var cornerstoneViewport = window["react-cornerstone-viewport"];
  var props = {
    viewportData: exampleData,
    cornerstone,
    cornerstoneTools,
    activeTool: "Pan"
  };
  var app = React.createElement(cornerstoneViewport, props, null);
  ReactDOM.render(app, document.getElementById("cornerstoneViewport"));
}


// Displaying and interacting with DICOM series using plain cornerstone 
// and cornerstoneTools
// function changeSeries(instanceIDs) {
//   console.log(instanceIDs.length);
//   const element = document.getElementById("cornerstoneViewport");
//   cornerstone.enable(element);

//   var imageIds = [];
//   // for (var i = 1; i <= 602; i++) {
//   for (var i = 0; i < instanceIDs.length; i++) {
//     imageIds.push(
//       "wadouri://" +
//       window.location.host +
//       // "/11-13-2003-threephaseabdomen-49621/5.000000-arterial-92922/1-" 
//       // + addLeadingZeroes(i) + ".dcm"
//       "/dicoms/" + instanceIDs[i] + ".dcm"
//     );
//   }
//   const stack = {
//     currentImageIdIndex: 0,
//     imageIds: imageIds
//   };

//   // load images and set the stack
//   cornerstone.loadImage(imageIds[0]).then(image => {
//     cornerstoneTools.addStackStateManager(element, ["stack"]);
//     cornerstoneTools.addToolState(element, "stack", stack);
//     cornerstone.displayImage(element, image);
//   });
//   const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
//   cornerstoneTools.addTool(StackScrollMouseWheelTool);
//   cornerstoneTools.setToolActive("StackScrollMouseWheel", { mouseButtonMask: 0 });

//   const PanTool = cornerstoneTools.PanTool;
//   cornerstoneTools.addTool(PanTool);

//   const ZoomTool = cornerstoneTools.ZoomTool;
//   cornerstoneTools.addTool(cornerstoneTools.ZoomTool, {
//     // Optional configuration
//     configuration: {
//       invert: false,
//       preventZoomOutsideImage: false,
//       minScale: 0.1,
//       maxScale: 20.0
//     }
//   });

//   const WwwcTool = cornerstoneTools.WwwcTool;
//   cornerstoneTools.addTool(WwwcTool);

//   const BrushTool = cornerstoneTools.BrushTool;
//   cornerstoneTools.addTool(BrushTool);
//   cornerstoneTools.addTool(cornerstoneTools.FreehandScissorsTool);
//   cornerstoneTools.addTool(cornerstoneTools.BidirectionalTool);
//   cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);
//   cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);

//   cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
// }