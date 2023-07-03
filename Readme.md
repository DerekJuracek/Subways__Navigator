# Subways Navigator Custom Application

This application is meant to replace the current Subways Navigator Application that's built with `Web App Builder`.

## Features

---

Some of the main requirements of the application are to make it reconfigurable with `URL Parameters`, referencing a JSON file that configures the application for the appropriate environments: DEV, TEST, QA, PRD.

The user types in the URL with the key/value pair to reference the appropriate JSON file:

_http://127.0.0.1:5501/index.html?config=configs/test.json_

```
  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.get("config") || "dev.json";

```

The beginning of the JavaScript file references the value after the _config_ key, to the correct JSON file path. Can reconfigure this by removing current folder path or renaming _configs_ folder containing JSON's.

## OAUTH Configuration

---

To utilize Microsoft Azure Groups for easier user login experiences, it was chosen to utilize ArcGIS's [OAuth](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-OAuthInfo.html) and [IdentityManager](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html) modules. After a user specifies the JSON file, a AD Sign-In `popup` window will be displayed, based on their JSON's environment variables.

![AD Popup](Readme_Images/ad_popup.png?raw=true "AD")

Upon successful login, a 30-min `token` is provided to the user for temporary access to the application. Once the 30 mins have passed, the user will need to re-login.

Here is where the login and `token` creation occur in the code:

```
fetch(configUrl)
    .then((response) => response.json())
    .then((config) => {
      esriConfig.portalUrl = config.portalURL;
      esriConfig.request.trustedServers.push(config.portalURL);

      const width = 700; // Width of the popup window
      const height = 500; // Height of the popup window
      const left = screen.width / 2 - width / 2; // Center horizontally
      const top = screen.height / 2 - height / 2;

      const clientId = config.appId;
      // Your OAuth logic
      const info = new OAuthInfo({
        appId: `${clientId}`,
        flowType: "authorization-code",
        popup: true,
        portalUrl: esriConfig.portalUrl,
        popupCallbackUrl: "http://127.0.0.1:5501/oauth-callback.html",
        popupWindowFeatures: `height=${height},width=${width},top=${top},left=${left}`,
      });

      IdentityManager.registerOAuthInfos([info]);
      IdentityManager.getCredential(`${esriConfig.portalUrl}/sharing/rest`)
        .then((credential) => {
          runApp(credential.token, config);
        })
        .catch((error) => {
          // console.log("User is not signed in.");
          runApp(null, config);
        });
    })
    .catch((error) => console.error("Failed to fetch the config", error));

```

Here the `config URL` is referenced from the JSON file and fetched. Then the response is converted to a JSON upon completion. You will also see the configuration for the `popup` size and how it is centered within the screen. This logic will passed into the _OAuthInfo_ `popupWindowFeatures` property next.

```
fetch(configUrl)
    .then((response) => response.json())
    .then((config) => {
      esriConfig.portalUrl = config.portalURL;
      esriConfig.request.trustedServers.push(config.portalURL);

      const width = 700; // Width of the popup window
      const height = 500; // Height of the popup window
      const left = screen.width / 2 - width / 2; // Center horizontally
      const top = screen.height / 2 - height / 2;
```

Next, the OAuthInfo object is referenced and set up accordingly with JSON values from the `config` file. It is important to understand the needed parameters that are `"appId"`, `"portalUrl"`, `"popupCallbackUrl"`, and `"popupWindowFeatures"` for redirect pop-up styling.

```
 const clientId = config.appId;
      // Your OAuth logic
      const info = new OAuthInfo({
        appId: `${clientId}`,
        flowType: "authorization-code",
        popup: true,
        portalUrl: esriConfig.portalUrl,
        popupCallbackUrl: "http://127.0.0.1:5501/oauth-callback.html",
        popupWindowFeatures: `height=${height},width=${width},top=${top},left=${left}`,
      });

```

These variables are referenced in the JSON files:

- `"appId"`: "JcGSopI6KXkvnquy",
- `"portalURL"`: "https://mtagisdev.lirr.org/dosportaldev/",
- `"popupCallbackUrl"`: (needs reconfigured for each appId environment, currently configured locally)

Next, the `IdentityManager` passes in and registers the `info` object to get a `credential token` that can be used for a session.

You will also notice the `oauth-callback.html` file. This file is responsible for closing the `popup` login page and passing in the `access token` used to get the actual `token` that expires in 30 mins to the main application.

```
<!DOCTYPE html>
<html>
  <head>
    <script>
      function loadHandler() {
        if (opener) {
          opener.console.log("oauth callback href:", location.href);
          opener.console.log(location);
          if (location.hash) {
            try {
              var esriId = opener.require("esri/kernel").id;
            } catch (e) {}
            if (esriId) {
              esriId.setOAuthResponseHash(location.hash);
            } else {
              opener.dispatchEvent(
                new CustomEvent("arcgis:auth:hash", { detail: location.hash })
              );
            }
          } else if (location.search) {
            opener.dispatchEvent(
              new CustomEvent("arcgis:auth:location:search", {
                detail: location.search,
              })
            );
          }
        }
        close();
      }
    </script>
  </head>
  <body onload="loadHandler();"></body>
</html>
```

ESRI JavaScript developers created this authentication page, used when having a `popup` redirect in the oauth process. The link to their github repository can be found here: [Esri-oauth-page](https://github.com/Esri/jsapi-resources/blob/main/oauth/oauth-callback.html)

```
  IdentityManager.registerOAuthInfos([info]);
      IdentityManager.getCredential(`${esriConfig.portalUrl}/sharing/rest`)
        .then((credential) => {
          runApp(credential.token, config);
        })
        .catch((error) => {
          // console.log("User is not signed in.");
          runApp(null, config);
        });
    })
    .catch((error) => console.error("Failed to fetch the config", error));
```

Taking advantage of error handling to get create/get the `token`, the rest of the code is configured as callback function `runApp`. Upon successful token creation, the `runApp` function runs with the `credential.token` and `config` as parameters.

```
  .then((credential) => {
          runApp(credential.token, config);
        })
```

Upon failure:

```.catch((error) => {
          // console.log("User is not signed in.");
          runApp(null, config);
        });
```

The app will then run the runApp() function that loads the `web map`, `view`, `services` and `logic` for the application. This is required because of the need to access secure services that require a `token` to run accordingly.

`Global variables` are then created that reference the `JSON config` files.

```
function runApp(token, config) {
const webmapId = config.webmapId;
const portalUrl = esriConfig.portalUrl;
const portalUrl2 = config.portalFolderURL;
const portalEquipmentUrl = config.portalURLEquipment;
const stationPlansURL = config.stationPlansURL;
const trackLRSURL = config.trackLrsURL;
const sirLRSURL = config.sirLrsURL;
const printURL = config.printURL;
const title = config.title;
const graphicsLayer = new GraphicsLayer();

    const webmap = new WebMap({
      portalItem: {
        id: webmapId,
      },
    });
    const view = new MapView({
      container: "viewDiv",
      map: webmap,
      padding: {
        left: 44,
        top: 0,
        bottom: 0,
        right: 0,
      },
      spatialReference: {
        wkid: 102100,
      },
    });
```

## Considerations for OAuth and JSON file configuration

---

With 4 total environments, 4 different oauth applications will be required, 1 per environment `(portal)`, in order to properly access the application and it's services. To learn more about creating Applications in Portal for OAuth, check out this article out here: [Create AppId in Portal](https://geo-jobe.com/how-to/knowledge-base-create-app-id-item-arcgis-online/)

To use the current Dev portal OAuth AppId as a reference: [dev appId Reference](https://mtagisdev.lirr.org/dosportaldev/home/item.html?id=5f5112a92cc8455ea6be7394090bab86#settings)

To access its `appId` and to alter its `redirect uri`, click `settings`

![OAuth Settings](Readme_Images/appId_settings.png?raw=true "AD")

To successfully `deploy` this application across all environments, ensure that the `redirect uri` is the same as the `popup url` in your `OAuthInfo property`.

```

popupCallbackUrl: "http://127.0.0.1:5501/oauth-callback.html",

```

![OAuth Callback](Readme_Images/oauth_callback.png?raw=true "AD")

**Note that this URL will need to be reconfigured in the code, as well as the oauth redirect uris in ALL portals once the URL is changed in IIS and no longer running locally.**

## Built in URL Query

---

Application has the ability to `query`, `zoom-to` and `highlight` feature within the URL.

Syntax of query is:

## _&query(feature layer name),(field name),(feature)_

### i.e (http://127.0.0.1:5501/index.html?config=configs/test.json&query=Station%20Platforms,OBG_SYSTEM,377443)

Default behavior is to encode all spaces for the user, such as _Station Platforms_ for `Layer name`. Code will encode text to _Station%20Platforms_ to successfully run `query`.

```
function getQueryParams() {
      const queryParams = {};
      const queryString = window.location.search.substring(1);
      const pairs = queryString.split("&");

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split("=");
        queryParams[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }

      return queryParams;
    }

    // Function to query and zoom to the feature
    async function queryAndZoom(layerName, fieldName, fieldValue) {
      const layer = view.map.allLayers.find(
        (layer) => layer.title === layerName
      );

      // Await the layer view to access geometryType property
      await layer.when();
      if (layer.geometryType === "point") {
        const query = layer.createQuery();
        query.where = `${fieldName} = '${fieldValue}'`;

        const results = await layer.queryFeatures(query);

        if (results.features.length > 0) {
          const feature = results.features[0];

        // point features do not have extent, like polygons and polylines
          view.goTo({
            center: feature,
            scale: 20,
            zoom: 20,
            // Set the desired zoom level
          });

          const layerView = await view.whenLayerView(layer);
          layerView.highlight(feature);
          layerView.highlightOptions = {
            haloOpacity: 0.9,
            fillOpacity: 0,
          };
        }
        // will zoom to polygons and polylines
      } else {
        const query = layer.createQuery();
        query.where = `${fieldName} = '${fieldValue}'`;

        const results = await layer.queryFeatures(query);

        if (results.features.length > 0) {
          const feature = results.features[0];

          view.goTo(feature);

          const layerView = await view.whenLayerView(layer);
          console.log(layerView);
          layerView.highlight(feature);
          layerView.highlightOptions = {
            haloOpacity: 0.9,
            fillOpacity: 0,
          };
        }
      }
    }

    view.when().then(() => {
      const queryParams = getQueryParams();

      if (queryParams.query) {
        const [layerName, fieldName, fieldValue] = queryParams.query.split(",");
        queryAndZoom(layerName, fieldName, fieldValue);
      }
    });
```
