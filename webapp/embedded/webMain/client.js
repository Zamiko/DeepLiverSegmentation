//Code copied from https://docs.ohif.org/deployment/recipes/embedded-viewer.html

// Made available by the `@ohif/viewer` script included in step 1
var containerId = "Viewer";
var componentRenderedOrUpdatedCallback = function() {
  console.log("OHIF Viewer rendered/updated");
};
window.OHIFViewer.installViewer(
  {
    routerBasename: "/",
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
        scope:
          "email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare", // email profile openid
        // ~ OPTIONAL
        post_logout_redirect_uri: "/logout-redirect.html",
        revoke_uri: "https://accounts.google.com/o/oauth2/revoke?token=",
        automaticSilentRenew: true,
        revokeAccessTokenOnSignout: true
      }
    ],
    studyListFunctionsEnabled: true
  },
  containerId,
  componentRenderedOrUpdatedCallback
);
