/*
If we're not defining extensions inline
(not being inline will probably be neater and easier for subsequent developers to understand)
we should define them here:
*/
/*
The skeleton for an extension:
// prettier-ignore
export default {

  //this is the only required item
  id: 'example-extension',

  // Lifecyle--there is only one to choose from.
  preRegistration() { },
  // Modules--we can use one or multiple, depending on the scope of our extension
  //For current planned extensions, the masking implementation will make use of the toolbar module, and possibly the viewport module
  //For UI extensions, I believe some of that may be handled by the SopClass Module, but most of it will likely be dealt with in the white labelling
  getCommandsModule() {  },
  getToolbarModule() { },
  getPanelModule() { },
  getSopClassHandler() { },
  getViewportModule() {  },
}
*/

//Code copied from https://docs.ohif.org/deployment/recipes/embedded-viewer.html

// Made available by the `@ohif/viewer` script included in step 1
var config = {
  routerBasename: "/",
  //For now we can leave this alone, I just wanted to integrate it while I'm frankensteining this config file together
  /**
   * "White Labeling" is used to change the branding, look, and feel of the OHIF
   * Viewer. These settings, and the color variables that are used by our components,
   * are the easiest way to rebrand the application.
   *
   * More extensive changes are made possible through swapping out the UI library,
   * Viewer project, or extensions.
   */
  whiteLabeling: {
    /* Optional: Should return a React component to be rendered in the "Logo" section of the application's Top Navigation bar */
    createLogoComponentFn: function(React) {
      return React.createElement("a", {
        target: "_self",
        rel: "noopener noreferrer",
        className: "header-brand",
        href: "/",
        style: {
          display: "block",
          textIndent: "-9999px",
          background: "url(/svg-file-hosted-at-domain-root.svg)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          width: "200px"
        }
      });
    }
  },
  /*
	Here we can place an error handler method, if needed.
	With our current implementation, I do not see us needing it, however, 
	https://docs.ohif.org/viewer/configuration.html#viewer-configuration
	describes that this error handler method will likely be needed if 
	-we redirect the user
	-we need to refresh the authentification token
	*/

  //all extensions we make should be placed here so they're registered at run time
  /*Syntax notes copied from https://docs.ohif.org/extensions/#registering-at-runtime:
  	extensions: [
    	MyFirstExtension,
    	[
     		 MySecondExtension,
      		{MySecondExtensions.Configuration},
   		],
  	];
	MyFirstExtension being an example of how to register an extension declared prior to running this function,
	MySecondExtension being an example of how to register an extension inline
	I /believe/ that the "MyFirstExtension"/"MySecondExtension" refers to the extension id, which is unique for each extension
	*/
  extensions: [],
  enableGoogleCloudAdapter: true,
  healthcareApiEndpoint: "https://healthcare.googleapis.com/v1",
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: []
  },
  // This is an array, but we'll only use the first entry for now
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: "https://accounts.google.com",
      client_id:
        "83443721316-76gqcsi2bmtmu6dllhsl14jnvhuep9sk.apps.googleusercontent.com",
      redirect_uri: "/callback", // `OHIFStandaloneViewer.js`
      response_type: "id_token token",
      //FIXME: we'll change this so it points directly to our data store instead of the logged in user's google cloud projects
      scope:
        "email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare", // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: "/logout-redirect.html",
      revoke_uri: "https://accounts.google.com/o/oauth2/revoke?token=",
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true
    }
  ],
  studyListFunctionsEnabled: true,
  /*
	I've copied this hotkey code directly from:
	https://github.com/OHIF/Viewers/blob/master/platform/viewer/public/config/demo.js
	We can always either edit it or remove it completely
	It should be noted that this is a lot of hotkeys, and may in fact impact user experience
	*/
  hotkeys: [
    // ~ Global
    {
      commandName: "incrementActiveViewport",
      label: "Next Viewport",
      keys: ["right"]
    },
    {
      commandName: "decrementActiveViewport",
      label: "Previous Viewport",
      keys: ["left"]
    },
    // Supported Keys: https://craig.is/killing/mice
    // ~ Cornerstone Extension
    { commandName: "rotateViewportCW", label: "Rotate Right", keys: ["r"] },
    { commandName: "rotateViewportCCW", label: "Rotate Left", keys: ["l"] },
    { commandName: "invertViewport", label: "Invert", keys: ["i"] },
    {
      commandName: "flipViewportVertical",
      label: "Flip Horizontally",
      keys: ["h"]
    },
    {
      commandName: "flipViewportHorizontal",
      label: "Flip Vertically",
      keys: ["v"]
    },
    { commandName: "scaleUpViewport", label: "Zoom In", keys: ["+"] },
    { commandName: "scaleDownViewport", label: "Zoom Out", keys: ["-"] },
    { commandName: "fitViewportToWindow", label: "Zoom to Fit", keys: ["="] },
    { commandName: "resetViewport", label: "Reset", keys: ["space"] },
    // clearAnnotations
    { commandName: "nextImage", label: "Next Image", keys: ["down"] },
    { commandName: "previousImage", label: "Previous Image", keys: ["up"] },
    // firstImage
    // lastImage
    {
      commandName: "previousViewportDisplaySet",
      label: "Previous Series",
      keys: ["pagedown"]
    },
    {
      commandName: "nextViewportDisplaySet",
      label: "Next Series",
      keys: ["pageup"]
    },
    // ~ Cornerstone Tools
    { commandName: "setZoomTool", label: "Zoom", keys: ["z"] },
    // ~ Window level presets
    {
      commandName: "windowLevelPreset1",
      label: "W/L Preset 1",
      keys: ["1"]
    },
    {
      commandName: "windowLevelPreset2",
      label: "W/L Preset 2",
      keys: ["2"]
    },
    {
      commandName: "windowLevelPreset3",
      label: "W/L Preset 3",
      keys: ["3"]
    },
    {
      commandName: "windowLevelPreset4",
      label: "W/L Preset 4",
      keys: ["4"]
    },
    {
      commandName: "windowLevelPreset5",
      label: "W/L Preset 5",
      keys: ["5"]
    },
    {
      commandName: "windowLevelPreset6",
      label: "W/L Preset 6",
      keys: ["6"]
    },
    {
      commandName: "windowLevelPreset7",
      label: "W/L Preset 7",
      keys: ["7"]
    },
    {
      commandName: "windowLevelPreset8",
      label: "W/L Preset 8",
      keys: ["8"]
    },
    {
      commandName: "windowLevelPreset9",
      label: "W/L Preset 9",
      keys: ["9"]
    }
  ],
  /*
  This isn't necessary for extenions,
  but it is needed to configure the cornerstone extension, just for future reference
  I've only seen mention of the cornerstone extension needing this workaround for configuration,
  so we shouldn't need a similar method for other extensions
  */
  cornerstoneExtensionConfig: {}
};
var containerId = "Viewer";
var componentRenderedOrUpdatedCallback = function() {
  console.log("OHIF Viewer rendered/updated");
};
window.OHIFViewer.installViewer(
  config,
  containerId,
  componentRenderedOrUpdatedCallback
);
