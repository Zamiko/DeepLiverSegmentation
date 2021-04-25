let metaData = {};

const switchSegment = document.getElementById("switchSegment");

for (let i = 1; i <= 255; i++) {
  const option = document.createElement("option");
  option.text = i;
  option.value = i;
  switchSegment.add(option);
}

document.getElementById("switchSegment")[0].selected = true;
document.getElementById("switchActiveLabelmap")[0].selected = true;

function changeSegment() {
  const segmentIndex = document.getElementById("switchSegment").value;
  // const element = document.getElementsByClassName("viewport-element")[0];
  console.log("Active Segment index is " + segmentIndex);
  const { setters } = cornerstoneTools.getModule("segmentation");
  setters.activeSegmentIndex(element, parseInt(segmentIndex));
}

function changeLabelmap() {
  const labelmapIndex = document.getElementById("switchActiveLabelmap").value;
  const segmentIndex = document.getElementById("switchSegment").value;
  // const element = document.getElementsByClassName("viewport-element")[0];

  const { setters } = cornerstoneTools.getModule("segmentation");
  setters.activeLabelmapIndex(element, parseInt(labelmapIndex));
  setters.activeSegmentIndex(element, parseInt(segmentIndex));
  cornerstone.updateImage(element);
}

function toggleSeg() {
  segOptions = document.getElementById("segOptions");
  if (segOptions.className == "Hidden") {
    segOptions.className = "Shown";
    cornerstoneTools.setToolActive("Brush", {mouseButtonMask: 1});
  } else {
    segOptions.className = "Hidden";
    cornerstoneTools.setToolActive("Wwwc", {mouseButtonMask: 1});
  }
}
//TODO: implement functions to switch between the brush and erase tool
//REMEMBER: need to establish if the erase tool actually works in this context
//if not: there is an undo and redo button we can implement instead/additionally

function createSeg() {
  // const element = document.getElementsByClassName("viewport-element")[0];
  // const element = document.getElementById("cornerstoneViewport");
  console.log(element);
  const globalToolStateManager =
    cornerstoneTools.globalImageIdSpecificToolStateManager;
  const toolState = globalToolStateManager.saveToolState();

  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  const imageIds = stackToolState.data[0].imageIds;

  let imagePromises = [];
  for (let i = 0; i < imageIds.length; i++) {
    imagePromises.push(cornerstone.loadImage(imageIds[i]));
  }

  const segments = [];

  const { getters } = cornerstoneTools.getModule("segmentation");
  const { labelmaps3D } = getters.labelmaps3D(element);

  if (!labelmaps3D) {
    console.log("no labelmaps 3D");
    return;
  }

  console.log("label maps 3D length " + labelmaps3D.length);

  for (
    let labelmapIndex = 0;
    labelmapIndex < labelmaps3D.length;
    labelmapIndex++
  ) {
    const labelmap3D = labelmaps3D[labelmapIndex];
    const labelmaps2D = labelmap3D.labelmaps2D;
    console.log( "labeel maps 2D length is" + labelmaps2D.length);

    for (let i = 0; i < labelmaps2D.length; i++) {
      if (!labelmaps2D[i]) {
        continue;
      }

      const segmentsOnLabelmap = labelmaps2D[i].segmentsOnLabelmap;
      segmentsOnLabelmap.forEach(segmentIndex => {
        if (segmentIndex !== 0 && !labelmap3D.metadata[segmentIndex]) {
          labelmap3D.metadata[segmentIndex] =
            generateMockMetadata(segmentIndex);
        }
      });
    }
  }

  Promise.all(imagePromises)
    .then(images => {
      //this will convert the segmentation mask to a binary file
      console.log(images.length);
      const segBlob = dcmjs.adapters.Cornerstone.Segmentation.generateSegmentation(
        images,
        labelmaps3D
      );

      //TODO: we'll want to override this so that it instead saves to the location of the DICOM image it's segmenting?
      //Create a URL for the binary.
      console.log("created image");
      var objectUrl = URL.createObjectURL(segBlob);
      console.log(objectUrl);
      console.log(window);
      window.open(objectUrl);
    })
    .catch(err => console.log(err));
}

function generateMockMetadata(segmentIndex) {
  // TODO -> Use colors from the cornerstoneTools LUT.
  const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB([
    1,
    0,
    0
  ]);

  return {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    },
    SegmentNumber: (segmentIndex + 1).toString(),
    SegmentLabel: "Tissue " + (segmentIndex + 1).toString(),
    SegmentAlgorithmType: "SEMIAUTOMATIC",
    SegmentAlgorithmName: "Slicer Prototype",
    RecommendedDisplayCIELabValue,
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    }
  };
}

function addMetaData(type, imageId, data) {
  metaData[imageId] = metaData[imageId] || {};
  metaData[imageId][type] = data;
}

//
// creates an array of per-frame imageIds in the form needed for cornerstone processing.
//
function getImageIds(multiframe, baseImageId) {
  const imageIds = [];
  const numFrames = Number(multiframe.NumberOfFrames);
  for (let i = 0; i < numFrames; i++) {
    let segNum;
    if (
      multiframe.PerFrameFunctionalGroupsSequence[i]
        .SegmentIdentificationSequence
    ) {
      segNum =
        multiframe.PerFrameFunctionalGroupsSequence[i]
          .SegmentIdentificationSequence.ReferencedSegmentNumber;
    }
    const imageId = baseImageId + "?frame=" + i;
    imageIds.push(imageId);
  }
  return imageIds;
}

//
// uses cornerstone caching to access a bytearray of the
// part10 dicom, then uses dcmjs to parse this
// into javascript object and populates the
// metadata for the per-frame imageIDs.
//
function loadMultiFrameAndPopulateMetadata(baseImageId) {
  return new Promise(function(resolve, reject) {
    var multiframe;
    cornerstone.loadAndCacheImage(baseImageId).then(function(image) {
      var arrayBuffer = image.data.byteArray.buffer;

      dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
      let dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
        dicomData.dict
      );
      dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(
        dicomData.meta
      );

      multiframe = dcmjs.normalizers.Normalizer.normalizeToDataset([dataset]);

      const numFrames = Number(multiframe.NumberOfFrames);
      for (let i = 0; i < numFrames; i++) {
        const imageId = baseImageId + "?frame=" + i;

        var functionalGroup = multiframe.PerFrameFunctionalGroupsSequence[i];
        var imagePositionArray =
          functionalGroup.PlanePositionSequence.ImagePositionPatient;

        addMetaData("imagePlane", imageId, {
          imagePositionPatient: {
            x: imagePositionArray[0],
            y: imagePositionArray[1],
            z: imagePositionArray[2]
          }
        });
      }

      resolve(multiframe);
    });
  });
}
