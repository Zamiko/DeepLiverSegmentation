(function initToolButtons() {
  const toolButtons = document.querySelectorAll(
    `.set-tool-mode`
  );

  const handleClick = function (evt) {
    const action = this.dataset.action;
    const options = {
      mouseButtonMask: 1
    };
    cornerstoneTools[`setToolActive`](`${action}`, options);
    // Remove active style from all buttons
    toolButtons.forEach(btn => {
      btn.classList.remove("is-primary");
    });
    // Add active style to this button
    this.classList.add("is-primary");

    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    return false;
  };

  toolButtons.forEach(btn => {
    btn.addEventListener("contextmenu", handleClick);
    btn.addEventListener("auxclick", handleClick);
    btn.addEventListener("click", handleClick);
  });
}());

(function initBrushSizeButtons() {
  const brushSlider = document.getElementsByClassName("brush-slider")[0];
  brushSlider.addEventListener("change", evt => {
    const { setters } = cornerstoneTools.getModule("segmentation");

    console.log(brushSlider.value);
    setters.radius(brushSlider.value);
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    return false;
  });
}());

(function initHistoryButtons() {
  const brushButtons = document.querySelectorAll(
    `.control-history`
  );

  const handleClick = function (evt) {
    const element = document.getElementById("cornerstoneViewport");
    // const element = document.getElementsByClassName("viewport-element")[0];
    const action = this.dataset.action;
    const { setters } = cornerstoneTools.getModule("segmentation");
    setters[`${action}`](element);

    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    return false;
  };

  brushButtons.forEach(btn => {
    btn.addEventListener("contextmenu", handleClick);
    btn.addEventListener("auxclick", handleClick);
    btn.addEventListener("click", handleClick);
  });
}());

(function initSegButtons() {
  const switchSegment = document.getElementById("switchSegment");

  for (let i = 1; i <= 8; i++) {
    const option = document.createElement("option");
    option.text = i;
    option.value = i;
    switchSegment.add(option);
  }

  document.getElementById("switchSegment")[0].selected = true;
  document.getElementById("switchActiveLabelmap")[0].selected = true;
}());

function changeSegment() {
  const segmentIndex = document.getElementById("switchSegment").value;
  const element = document.getElementById("cornerstoneViewport");
  // const element = document.getElementsByClassName("viewport-element")[0];
  console.log("Active Segment index is " + segmentIndex);
  const { setters } = cornerstoneTools.getModule("segmentation");
  setters.activeSegmentIndex(element, parseInt(segmentIndex));
}

function changeLabelmap() {
  const labelmapIndex = document.getElementById("switchActiveLabelmap").value;
  const segmentIndex = document.getElementById("switchSegment").value;
  const element = document.getElementById("cornerstoneViewport");
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
    cornerstoneTools.setToolActive("Brush", { mouseButtonMask: 1 });
  } else {
    segOptions.className = "Hidden";
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
  }
}