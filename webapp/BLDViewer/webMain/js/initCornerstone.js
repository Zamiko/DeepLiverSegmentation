cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;

function getBlobUrl(url) {
    const baseUrl = window.URL || window.webkitURL;
    const blob = new Blob([`importScripts("${url}")`], {
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
cornerstoneTools.init({
    showSVGCursors: true
});

const element = document.getElementById("cornerstoneViewport");
cornerstone.enable(element);
const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
cornerstoneTools.addTool(StackScrollMouseWheelTool);
cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
cornerstoneTools.setToolActive("StackScrollMouseWheel", { mouseButtonMask: 0 });
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
cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 4 });
cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 });
cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });