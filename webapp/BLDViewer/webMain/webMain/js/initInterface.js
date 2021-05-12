(function initToolButtons() {
    const nameSpace = `.mode-buttons`;
    const toolButtons = document.querySelectorAll(
      `.set-tool-mode`
    );

    const handleClick = function (evt) {
      const action = this.dataset.action;
      const options = {
        mouseButtonMask: 1
      };
      cornerstoneTools[`setToolActive`](`${action}`, options);
      if (action == "FreehandScissors") {
        // viewport-element class comes from dynamic react rendering in react cornerstone viewport
        const element = document.getElementsByClassName("viewport-element")[0];
        const activeScissors = cornerstoneTools.getToolForElement(element, "FreehandScissors");
        activeScissors.activeStrategy = "ERASE_INSIDE";
      }
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
  let brushRadius = 10;
  (function initBrushSizeButtons() {
    const nameSpace = `.mode-buttons`;
    const brushButtons = document.querySelectorAll(
      `.set-brush-size`
    );

    const handleClick = function (evt) {
      const action = this.dataset.action;
      const { setters } = cornerstoneTools.getModule("segmentation");
      if (action == "decrement") {
        setters.radius(--brushRadius);
      } else {
        setters.radius(++brushRadius);
      }
      console.log(action);
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
  
  (function initHistoryButtons() {
    const nameSpace = `.mode-buttons`;
    const brushButtons = document.querySelectorAll(
      `.control-history`
    );

    const handleClick = function (evt) {
      const element = document.getElementsByClassName("viewport-element")[0];
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