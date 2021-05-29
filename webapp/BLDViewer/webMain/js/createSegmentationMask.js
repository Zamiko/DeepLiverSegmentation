let metaData = {};

function createSeg() {
  const element = document.getElementById("cornerstoneViewport");
  const globalToolStateManager =
    cornerstoneTools.globalImageIdSpecificToolStateManager;
  const toolState = globalToolStateManager.saveToolState();
  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  const imageIds = stackToolState.data[0].imageIds;
  const { getters } = cornerstoneTools.getModule("segmentation");
  const { labelmaps3D } = getters.labelmaps3D(element);
  let imagePromises = [];

  for (let i = 0; i < imageIds.length; i++) {
    imagePromises.push(cornerstone.loadImage(imageIds[i]));
  }

  if (!labelmaps3D) {
    console.log("no 3D labelmaps");
    return;
  }

  for (let labelmapIndex = 0; labelmapIndex < labelmaps3D.length;
    labelmapIndex++) {
    const labelmap3D = labelmaps3D[labelmapIndex];
    const labelmaps2D = labelmap3D.labelmaps2D;

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
      // This will convert the segmentation mask to a binary file
      const segBlob = dcmjs.adapters.Cornerstone.Segmentation
        .generateSegmentation(images, labelmaps3D);
      const formData = new FormData();
      var nameString = "SEG.dcm";
      formData.append("newSeg", segBlob, nameString);
      console.log("Saving " + nameString);
      const xHTTPreq = new XMLHttpRequest();
      xHTTPreq.open("POST", "/saveSeg");
      xHTTPreq.addEventListener("load", function () {
        if (xHTTPreq.status != 200) {
          console.log(xHTTPreq.responseText);
        }
        else {
          console.log("Save successful");
          uploadToDicomStore();
        }
      });
      xHTTPreq.send(formData);
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
// creates an array of per-frame imageIds in the form needed 
// for cornerstone processing.
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
  return new Promise(function (resolve, reject) {
    var multiframe;
    cornerstone.loadAndCacheImage(baseImageId).then(function (image) {
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
