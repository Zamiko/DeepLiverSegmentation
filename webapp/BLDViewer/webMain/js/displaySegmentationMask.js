function getAndLoadSeg() {
    // This  will change as we select the correct study and series
    var segURL =
        window.location.origin +
        "/seg/segmentation.dcm";
    // "/11-13-2003-threephaseabdomen-49621/300.000000-Segmentation-44409/1-1.dcm";
    console.log(segURL);
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => {
        parseSeg(xhr.response);
    });
    xhr.addEventListener("error", () => {
        console.log(`Request returned, status: ${xhr.status}`);
        console.log(xhr.message);
    });
    xhr.open("GET", segURL);
    xhr.responseType = "arraybuffer"; //Type of file
    xhr.send();
}

function parseSeg(arrayBuffer) {
    const element = document.getElementById("cornerstoneViewport");
    // const element = document.getElementsByClassName("viewport-element")[0];
    const stackToolState = cornerstoneTools.getToolState(
        element,
        "stack"
    );
    const imageIds = stackToolState.data[0].imageIds;
    const t0 = performance.now();
    const {
        labelmapBufferArray,
        segMetadata,
        segmentsOnFrame
    } = dcmjs.adapters.Cornerstone.Segmentation.generateToolState(
        imageIds,
        arrayBuffer,
        cornerstone.metaData,
    );
    const t1 = performance.now();
    const { setters, state } = cornerstoneTools.getModule("segmentation");
    setters.labelmap3DByFirstImageId(
        imageIds[0],
        labelmapBufferArray[0],
        0,
        segMetadata.data,
        imageIds.length,
        segmentsOnFrame
    );
}

function metaDataProvider(type, imageId) {
    if (!metaData[imageId]) {
        return;
    }

    return metaData[imageId][type];
}

cornerstone.metaData.addProvider(metaDataProvider);

function addMetaData(type, imageId, data) {
    metaData[imageId] = metaData[imageId] || {};
    metaData[imageId][type] = data;
}
