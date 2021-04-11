initModeButtons();
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.init({
    showSVGCursors: true
});

// TODO research react integration 
// const element = document.getElementById("cornerstoneViewport");
// cornerstone.enable(element);
const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
//define the stack
// const stack = {
//   currentImageIdIndex: 0,
//   imageIds
// };

// // load images and set the stack
// cornerstone.loadImage(imageIds[0]).then(image => {
//   cornerstone.displayImage(element, image);
//   cornerstoneTools.addStackStateManager(element, ["stack"]);
//   cornerstoneTools.addToolState(element, "stack", stack);
// });

cornerstoneTools.addTool(StackScrollMouseWheelTool);
cornerstoneTools.setToolActive("StackScrollMouseWheel", {});

const PanTool = cornerstoneTools.PanTool;
cornerstoneTools.addTool(PanTool);

const ZoomTool = cornerstoneTools.ZoomTool;
cornerstoneTools.addTool(cornerstoneTools.ZoomTool, {
    // Optional configuration
    configuration: {
        invert: false,
        preventZoomOutsideImage: false,
        minScale: 0.1,
        maxScale: 20.0
    }
});

const WwwcTool = cornerstoneTools.WwwcTool;
cornerstoneTools.addTool(WwwcTool);

const BrushTool = cornerstoneTools.BrushTool;
cornerstoneTools.addTool(BrushTool);

const CorrectionScissors = cornerstoneTools.CorrectionScissorsTool;
cornerstoneTools.addTool(CorrectionScissors);

cornerstoneTools.addTool(cornerstoneTools.BidirectionalTool);
cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);
cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);

function getBlobUrl(url) {
    const baseUrl = window.URL || window.webkitURL;
    const blob = new Blob([`importScripts('${url}')`], {
        type: "application/javascript"
    });

    return baseUrl.createObjectURL(blob);
}

const config = {
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    startWebWorkersOnDemand: true,
    webWorkerPath: getBlobUrl(
        "https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderWebWorker.min.js"
    ),
    webWorkerTaskPaths: [],
    taskConfiguration: {
        decodeTask: {
            loadCodecsOnStartup: true,
            initializeCodecsOnStartup: false,
            codecsPath: getBlobUrl(
                "https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderCodecs.min.js"
            ),
            usePDFJS: false,
            strict: false
        }
    }
};
cornerstoneWADOImageLoader.webWorkerManager.initialize(config);
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;