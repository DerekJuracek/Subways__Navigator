require([
  "esri/config",
  "esri/identity/OAuthInfo",
  "esri/identity/IdentityManager",
  "esri/widgets/Expand",
  "esri/widgets/Sketch",
  "esri/WebMap",
  "esri/views/MapView",
  "esri/widgets/FeatureTable",
  "esri/core/reactiveUtils",
  "esri/layers/CSVLayer",
  "esri/request",
  "esri/layers/support/Field",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/geometry/projection",
  "esri/layers/ImageryLayer",
  "esri/Graphic",
  "esri/widgets/Bookmarks",
  "esri/widgets/BasemapLayerList",
  "esri/widgets/LayerList",
  "esri/widgets/Slider",
  "esri/widgets/Legend",
  "esri/widgets/Print",
  "esri/widgets/Search",
  "esri/widgets/Home",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/AreaMeasurement2D",
  "esri/widgets/Locate",
  "esri/widgets/ScaleBar",
  "esri/widgets/CoordinateConversion",
], function (
  esriConfig,
  OAuthInfo,
  IdentityManager,
  Expand,
  Sketch,
  WebMap,
  MapView,
  FeatureTable,
  reactiveUtils,
  CSVLayer,
  request,
  Field,
  FeatureLayer,
  GraphicsLayer,
  projection,
  ImageryLayer,
  Graphic,
  Bookmarks,
  BasemapLayerList,
  LayerList,
  Slider,
  Legend,
  Print,
  Search,
  Home,
  DistanceMeasurement2D,
  AreaMeasurement2D,
  Locate,
  ScaleBar,
  CoordinateConversion
) {
  // Fetch config based on the URL parameter.
  const urlParams = new URLSearchParams(window.location.search);
  const configUrl = urlParams.get("config") || "dev.json";

  fetch(configUrl)
    .then((response) => response.json())
    .then((config) => {
      esriConfig.portalUrl = config.portalURL;
      esriConfig.request.trustedServers.push(config.portalURL);

      const width = 800; // Width of the popup window
      const height = 600; // Height of the popup window
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
          // console.log("User is signed in.");
          // console.log(credential.token);
          runApp(credential.token, config);
        })
        .catch((error) => {
          // console.log("User is not signed in.");
          runApp(null, config);
        });
    })
    .catch((error) => console.error("Failed to fetch the config", error));

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

    // console.log(token);
    IdentityManager.getCredential(portalUrl2)
      .then(function (credential) {
        token = credential.token;
        console.log("User is signed in: ", credential);
        // Folder fetch operation
        const folderUrl = `${portalEquipmentUrl}?f=json&token=${token}`;
        console.log(token);
        fetch(folderUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            if (data.services) {
              data.services.forEach((service) => {
                const listItem = createCalciteListItem(service);
                document
                  .getElementById("featureServiceList")
                  .appendChild(listItem);
              });
            }
          })
          .catch((error) => {
            console.error("Error fetching folder:", error);
          });
      })
      .catch(function (error) {
        console.log("User is not signed in: ", error);
      });

    function createCalciteListItem(service) {
      // console.log(service.name);
      const listItem = document.createElement("calcite-list-item");
      // listItem.display.style.width = "250px";
      itemsName = service.name.split("/")[1];
      let thumbnail = `images/${itemsName}.png`;
      // console.log(thumbnail);
      itemsLabel = itemsName.replaceAll("_", " ");
      listItem.style.fontWeight = "bold";
      listItem.label = itemsLabel;

      // let thumbnailUrl = `https://mtagisdev.lirr.org/dosserverdev/rest/services/${service.name}/MapServer/info/thumbnail`;
      // console.log(thumbnailUrl);

      // Create an img element to hold the thumbnail
      thumbnailImage = document.createElement("img");
      thumbnailImage.src = thumbnail;
      thumbnailImage.width = "60"; // Adjust as necessary
      thumbnailImage.height = "40"; // Adjust as necessary
      thumbnailImage.slot = "content-start"; // This will position it on the left
      listItem.appendChild(thumbnailImage);

      const action = document.createElement("calcite-action");
      action.slot = "actions-end";
      action.icon = "add-layer";
      action.text = service.name;
      listItem.appendChild(action);

      // Add event listener to add-data list
      action.addEventListener("click", function () {
        // console.log("add data button clicked for", service.name);
        if (service.layer) {
          // Remove the layer
          webmap.remove(service.layer);
          service.layer = null;
          view.graphics.removeAll();
          action.icon = "add-layer";
        } else {
          // Add the layer
          addLayer(service);
          action.icon = "minus-circle";
        }
      });

      return listItem;
    }

    function addLayer(service) {
      itemsName = service.name.split("/")[1];
      // Create a new FeatureLayer using the service URL
      service.layer = new FeatureLayer({
        url: `${portalEquipmentUrl}/${itemsName}/MapServer/`,
        defaultPopupTemplateEnabled: true,
        popupEnabled: true,
      });
      console.log(service.layer);

      // Add the layer to the webmap
      webmap.add(service.layer);
    }

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

      if (layer) {
        // layer.spatialReference = 3857;
        console.log(layer);
        const query = layer.createQuery();
        console.log(query);
        // query.inspatialReference = 3857;
        // query.outspatialReference = 3857;
        query.where = `${fieldName} = '${fieldValue}'`;

        const results = await layer.queryFeatures(query);
        console.log(results);

        if (results.features.length > 0) {
          const feature = results.features[0];
          // feature.geometry.spatialReference = 3857;
          // console.log(feature);
          const cs1 = { wkid: 4272 };

          const cs2 = { wkid: 4167 };

          // const extent = new Extent({
          //   xmin: -186.0,
          //   ymin: -42.0,
          //   xmax: -179.0,
          //   ymax: -38.0
          // });

          const geogtrans = projection.getTransformations(cs1, cs2);
          geogtrans.forEach(function (geogtran, index) {
            geogtran.steps.forEach(function (step, index) {
              console.log("step wkid: ", step.wkid);
            });
          });
          // feature.geometry.spatialReference.isWebMercator = true;
          // lat = feature.geometry.lat;
          // long = feature.geometry.long;
          // console.log(latLng);

          // const latlong = [
          //   feature.geometry.longitude,
          //   feature.geometry.latitude,
          // ];
          view.goTo(feature);
          console.log(feature);
        } else {
          console.log("No features found with the provided query parameters");
        }
      } else {
        console.log("Layer not found");
      }
    }

    view.when().then(() => {
      const queryParams = getQueryParams();

      if (queryParams.query) {
        const [layerName, fieldName, fieldValue] = queryParams.query.split(",");
        queryAndZoom(layerName, fieldName, fieldValue);
      }
    });

    // console.log(view);
    const shareAction = document.getElementById("shareAction");

    shareAction.addEventListener("click", function () {
      let shareURL = document.getElementById("shareURL");
      let anchor = shareURL.querySelector("a");
      // Access the href attribute of the <a> element
      let hrefValue = anchor.getAttribute("href");
      // console.log("Current href value:", hrefValue);
      let currentState = view.state.extent;
      let min = [currentState.xmin, currentState.ymin];
      let max = [currentState.xmax, currentState.ymax];
      // console.log(shareURL);
      // console.log(currentState);
      // console.log(min);
      // console.log(max);

      let newHrefValue = `https://gis.mta.info/portal/apps/webappviewer/index.html?id=71c72cd11c5b4b988d38297857e84260&extent=${min}%2C${max}%2C102100`;
      anchor.setAttribute("href", newHrefValue);
      anchor.textContent = newHrefValue;

      console.log(anchor);
    });

    const collapseButton = document.getElementById("collapseButton");

    function updateLayout() {
      let actionBar = document.querySelector("calcite-action-bar");
      let attributeBar = document.getElementById("attributeBar");

      if (actionBar.expanded) {
        view.padding = { left: 196 };

        if (attributeBar.classList.contains("collapsed")) {
          attributeBar.style.left = "195px";
          attributeBar.style.width = "calc(100% - 150px)";
        } else {
          attributeBar.style.left = "195px";
          attributeBar.style.width = "calc(100% - 195px)";
        }
      } else {
        view.padding = { left: 45 };

        if (attributeBar.classList.contains("collapsed")) {
          attributeBar.style.left = "45px";
          attributeBar.style.width = "calc(100% - 40px)";
        } else {
          attributeBar.style.left = "45px";
          attributeBar.style.width = "calc(100% - 40px)";
        }
      }

      // update bottom padding based on attributeBar's height
      view.padding.bottom = attributeBar.offsetHeight;
    }

    document
      .querySelector("calcite-action-bar")
      .addEventListener("click", function (event) {
        updateLayout();
      });

    const exportCSVButton = document.getElementById("exportBtn");
    view.ui.add(exportCSVButton, "bottom-right");

    let featureTable;
    let layer;

    async function customAction(event) {
      // Handle custom action click event
      // console.log("Custom action clicked:", event);
      layer = event.item.layer;

      const container = document.getElementById("attributeBar");
      console.log(featureTable);

      // view.padding = { bottom: 0 };
      if (!featureTable) {
        exportCSVButton.style.display = "block";
        const tableContainer = document.createElement("div");
        container.appendChild(tableContainer);
        // Create a new FeatureTable for the layer
        featureTable = new FeatureTable({
          view: view,
          layer: layer,
          container: tableContainer,
          visibleElements: {
            menuItems: {
              autoRefresh: true,
              showSelection: true,
              clearSelection: true,
              refreshData: true,
              toggleColumns: true,
              selectedRecordsShowAllToggle: true,
              selectedRecordsShowSelectedToggle: true,
              zoomToSelection: true,
            },
          },
        });

        let selectedIds = []; // This will store ids of selected features

        // Event listener for "Export to CSV" button
        exportCSVButton.addEventListener("click", function () {
          let featuresToExport;

          if (selectedIds.length > 0) {
            // If there are selected items, export only them
            const query = layer.createQuery();
            query.objectIds = selectedIds;
            layer.queryFeatures(query).then(function (results) {
              featuresToExport = results.features;

              // Continue with exporting
              exportToCSV(featuresToExport);
            });
          } else {
            // Otherwise export all features
            layer.queryFeatures().then(function (results) {
              featuresToExport = results.features;
              console.log(featuresToExport);

              // Continue with exporting
              exportToCSV(featuresToExport);
            });
          }
        });

        // Function to export to CSV
        function exportToCSV(featuresToExport) {
          let fieldNames = layer.fields.map((field) => field.name);
          let csvContent = "data:text/csv;charset=utf-8,";

          // Add field names as the first row in your CSV
          csvContent += fieldNames.join(",") + "\r\n";

          featuresToExport.forEach((feature) => {
            let row = fieldNames.map(
              (fieldName) => feature.attributes[fieldName]
            );
            csvContent += row.join(",") + "\r\n";
            // const row = Object.values(feature.attributes).join(",");
            // csvContent += row + "\r\n";
          });

          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", "export.csv");
          link.click();

          URL.revokeObjectURL(url);
          console.log(`CSV has been exported`);
        }

        // When a feature is selected or deselected
        featureTable.highlightIds.on("change", (event) => {
          // Update selectedIds array based on what is added or removed
          selectedIds = selectedIds
            .concat(event.added)
            .filter((id) => !event.removed.includes(id));
        });

        console.log(featureTable);

        featureTable.highlightIds.on("change", (event) => {
          let fieldnames = featureTable.columns.items;
          // console.log(featureTable.viewModel);
          // console.log("features selected", event.added);
          // console.log("features deselected", event.removed);
        });

        view.on("immediate-click", (event) => {
          view.hitTest(event).then((response) => {
            candidate = response.results.find((result) => {
              return (
                result.graphic &&
                result.graphic.layer &&
                result.graphic.layer === layer
              );
            });

            if (candidate) {
              const objectId = candidate.graphic.getObjectId();

              if (featureTable.highlightIds.includes(objectId)) {
                featureTable.highlightIds.remove(objectId);
              } else {
                featureTable.highlightIds.add(objectId);
              }
            }
          });
        });

        featureTable.watch("highlightIds.length", (ids) => {
          highlightIdsCount = ids;

          featureTable.viewModel.activeFilters.forEach((filter) => {
            if (filter.type === "selection") {
              selectionIdCount = filter.objectIds.length;

              if (selectionIdCount != highlightIdsCount) {
                featureTable.filterBySelection();
              }
            }
          });
        });

        attributeBar.style.height = "250px";
        view.padding = { bottom: 250 };
      } else {
        featureTable.destroy();
        featureTable = null;
        exportCSVButton.style.display = "none";

        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        view.padding = { bottom: 0 };
        attributeBar.style.height = "0px";
      }
    }

    // Wait until the map is loaded
    webmap.load().then(function () {
      // Get the first feature layer from the map
      var featureLayer;
      for (var i = 1; i < webmap.layers.length; i++) {
        if (webmap.layers.getItemAt(i).type === "feature") {
          featureLayer = webmap.layers.getItemAt(i);
          break;
        }
      }

      if (!featureLayer) {
        console.error("No feature layer found in the map");
        return;
      }

      const featureButton = document.getElementById("collapseButton");

      view.ui.add(featureButton, "bottom-right");
    });

    // code to hold sketch and expand widget
    view.when(() => {
      const sketch = new Sketch({
        layer: graphicsLayer,
        view: view,
        // graphic will be selected as soon as it is created
        creationMode: "update",
        container: document.createElement("div"),
        icon: "annotate-tool",
      });

      const sketchExpand = new Expand({
        view: view,
        content: sketch,
        icon: "annotate-tool",
      });

      view.ui.add(sketchExpand, "top-left");
    });

    let urlInput = document.getElementById("urlInput");
    let urlButton = document.getElementById("urlButton");

    urlButton.addEventListener("click", function (event) {
      let urlValue = urlInput.value;
      function addFeatureLayer() {
        urlInputLayer = new FeatureLayer({
          url: `${urlValue}`,
        });

        webmap.add(urlInputLayer);
      }
      addFeatureLayer();

      urlInput.value = "";
    });

    const csvFileInput = document.getElementById("csvFileInput");
    const submitCsv = document.getElementById("submitCsv");
    submitCsv.addEventListener("click", handleCSVUpload);

    function handleCSVUpload(event) {
      const file = csvFileInput.files[0];
      if (!file) {
        return;
      }

      // Create a CSVLayer using the uploaded file
      const csvLayer = new CSVLayer({
        url: URL.createObjectURL(file),
        copyright: "User CSV Data",
        // Configure additional properties, such as renderer, popupTemplate, etc., as needed
      });

      // Add the CSVLayer to the map
      webmap.add(csvLayer);

      // Clear the input value to allow re-uploading the same file
      csvFileInput.value = "";
    }
    // add data code
    const fileForm = document.getElementById("mainWindow");

    document
      .getElementById("uploadForm")
      .addEventListener("change", (event) => {
        const fileName = event.target.value.toLowerCase();

        if (fileName.indexOf(".zip") !== -1) {
          //is file a zip - if not notify user
          generateFeatureCollection(fileName);
        } else {
          document.getElementById("upload-status").innerHTML =
            '<p style="color:red">Add shapefile as .zip file</p>';
        }
      });

    // code to upload zipped shapefile

    function generateFeatureCollection(fileName) {
      let name = fileName.split(".");
      // Chrome adds c:akepath to the value - we need to remove it
      name = name[0].replace(`c:\fakepath\", ""`);

      document.getElementById("upload-status").innerHTML =
        "<b>Loading </b>" + name;

      // define the input params for generate see the rest doc for details
      // https://developers.arcgis.com/rest/users-groups-and-items/generate.htm
      const params = {
        name: name,
        targetSR: view.spatialReference,
        maxRecordCount: 1000,
        enforceInputFileSizeLimit: true,
        enforceOutputJsonSizeLimit: true,
      };

      // generalize features to 10 meters for better performance
      params.generalize = true;
      params.maxAllowableOffset = 10;
      params.reducePrecision = true;
      params.numberOfDigitsAfterDecimal = 0;

      const myContent = {
        filetype: "shapefile",
        publishParameters: JSON.stringify(params),
        f: "json",
      };

      // use the REST generate operation to generate a feature collection from the zipped shapefile
      request(portalUrl + "/sharing/rest/content/features/generate", {
        query: myContent,
        body: document.getElementById("uploadForm"),
        responseType: "json",
      })
        .then((response) => {
          const layerName =
            response.data.featureCollection.layers[0].layerDefinition.name;
          document.getElementById("upload-status").innerHTML =
            "<b>Loaded: </b>" + layerName;
          addShapefileToMap(response.data.featureCollection);
        })
        .catch(errorHandler);
    }

    function errorHandler(error) {
      document.getElementById("upload-status").innerHTML =
        "<p style='color:red;max-width: 500px;'>" + error.message + "</p>";
    }

    function addShapefileToMap(featureCollection) {
      // add the shapefile to the map and zoom to the feature collection extent
      // if you want to persist the feature collection when you reload browser, you could store the
      // collection in local storage by serializing the layer using featureLayer.toJson()
      // see the 'Feature Collection in Local Storage' sample for an example of how to work with local storage
      let sourceGraphics = [];

      const layers = featureCollection.layers.map((layer) => {
        const graphics = layer.featureSet.features.map((feature) => {
          return Graphic.fromJSON(feature);
        });
        sourceGraphics = sourceGraphics.concat(graphics);
        const featureLayer = new FeatureLayer({
          objectIdField: "FID",
          source: graphics,
          fields: layer.layerDefinition.fields.map((field) => {
            return Field.fromJSON(field);
          }),
        });
        return featureLayer;
        // associate the feature with the popup on click to enable highlight and zoom to
      });
      webmap.addMany(layers);
      view.goTo(sourceGraphics).catch((error) => {
        if (error.name != "AbortError") {
          console.error(error);
        }
      });

      document.getElementById("upload-status").innerHTML = "";
    }

    const submitShp = document.getElementById("submitShp");
    submitShp.addEventListener("click", generateFeatureCollection);

    const filterAction = document.getElementById("filter");

    let Imagerylayer1;

    webmap.when(function () {
      // Only add the event listener if "Station Plans" layer is not visible
      filterAction.addEventListener("click", () => {
        let stationPlansLayerVisible = view.map.allLayers.some((layer) => {
          return layer.title === "Station Plans" && layer.visible;
        });

        if (!stationPlansLayerVisible) {
          let layerExists = view.map.allLayers.some((layer) => {
            return layer.url === `${stationPlansURL}`;
          });

          if (!layerExists) {
            Imagerylayer1 = new ImageryLayer({
              url: `${stationPlansURL}`,
              title: "Station Plans",
            });

            webmap.add(Imagerylayer1);
          }
        }
      });
    });

    async function populateDropdownItems(division) {
      let divison = division.toUpperCase();
      const url = `${stationPlansURL}/query?where=Division+%3D+%27${divison}%27&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=102100&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=StationName&returnGeometry=false&outSR=102100&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&pixelSize=&rasterQuery=&orderByFields=StationName&groupByFieldsForStatistics=&outStatistics=&returnDistinctValues=true&multidimensionalDefinition=&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&resultOffset=0&resultRecordCount=1000&f=json&token=${token}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      const dropdownGroup2 = document.querySelector("#Filter2");
      // const dropdownGroup3 = document.querySelector("#Filter3");
      dropdownGroup2.innerHTML = "";

      data.features.forEach((item) => {
        let dropdownItem = document.createElement("calcite-dropdown-item");

        const itemID = (dropdownItem.id = item.attributes.StationName);
        const label = (dropdownItem.value = item.attributes.StationName);
        const value = (dropdownItem.textContent = item.attributes.StationName);

        dropdownGroup2.appendChild(dropdownItem);

        dropdownItem.addEventListener("click", (event) => {
          // console.log("Clicked dropdown item:", event.target);
          const stationName = event.target.id;
          let stationName2 = stationName.toUpperCase();
          populateDropdownItems2(division, stationName);
          console.log(division, stationName);
          updateMosaicRule(Imagerylayer1, division, stationName2);

          // Do something when the dropdown item is clicked
        });
      });
    }
    // Feature calcite-filter populate, event listener and runs updateMosaicRule callback

    async function populateDropdownItems2(division, stationName) {
      // let division2 = division2.toUpperCase();
      let stationName1 = stationName.toUpperCase();
      const url = `${stationPlansURL}/query?f=json&where=(((UPPER(Division)%20%3D%20%27${division}%27)%20AND%20(UPPER(StationName)%20%3D%20%27${stationName1}%27)))&returnGeometry=true&returnFields=*&outFields=*&spatialRel=esriSpatialRelIntersects&outSR=102100&token=${token}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      const dropdownGroup3 = document.querySelector("#Filter3");

      data.features.forEach((item) => {
        let dropdownItem2 = document.createElement("calcite-dropdown-item");

        const itemID2 = (dropdownItem2.id = item.attributes.Feature);
        const label2 = (dropdownItem2.value = item.attributes.Feature);
        const value2 = (dropdownItem2.textContent = item.attributes.Feature);
        // need to find a way to get this id out and into the function updateMosaicRule
        // Add an event listener to the dropdownItem

        dropdownGroup3.appendChild(dropdownItem2);

        dropdownItem2.addEventListener("click", (event) => {
          // console.log("Clicked dropdown item:", event.target);
          const feature = event.target.id;
          const feature2 = feature.toUpperCase();
          console.log(feature);
          updateMosaicRule(Imagerylayer1, division, stationName1, feature2);
          // Do something when the dropdown item is clicked
        });
      });
    }
    function queryLayerExtent(layer, where) {
      return new Promise((resolve, reject) => {
        const query = layer.createQuery();
        query.where = where;
        query.returnGeometry = true;
        query.outSpatialReference = view.spatialReference;

        layer
          .queryFeatures(query)
          .then((result) => {
            const extent = result.features.reduce((acc, feature) => {
              return acc
                ? acc.union(feature.geometry.extent)
                : feature.geometry.extent;
            }, null);

            resolve(extent);
          })
          .catch((error) => {
            reject(error);
          });
      });
    }

    function updataFilterContainer(division, stationName, feature) {
      const filterInputs = document.getElementById("filterInputs");
      filterInputs.innerHTML = `
        <p>Division: ${division}</p>
        <p>Station Name: ${stationName}</p>
        <p>Feature: ${feature}</p>
`;
    }
    // Get the elements by their ids
    const filter1Option1 = document.getElementById("filterBMT");
    const filter1Option2 = document.getElementById("filterIND");
    const filter1Option3 = document.getElementById("filterIRT");

    function updateMosaicRule(layer, division, stationName, feature) {
      let where;
      if (division !== undefined && stationName === undefined) {
        where = `((UPPER(Division) = '${division}'))`;
        layer.mosaicRule = {
          mosaicMethod: "esriMosaicNorthwest",
          where: where,
          sortField: "",
          ascending: true,
          mosaicOperation: "MT_FIRST",
        };
        console.log(`first mosaicRule Ran?`);
      } else if (
        division !== undefined &&
        stationName !== undefined &&
        feature === undefined
      ) {
        where = `((UPPER(Division) = '${division}' AND (UPPER(StationName) = '${stationName}')))`;
        layer.mosaicRule = {
          mosaicMethod: "esriMosaicNorthwest",
          where: where,
          sortField: "",
          ascending: true,
          mosaicOperation: "MT_FIRST",
        };

        console.log(layer.mosaicRule);
        console.log(`second mosaicRule Ran!`);

        // Query the layer and zoom to the extent
        queryLayerExtent(layer, where)
          .then((extent) => {
            view.goTo({ target: extent });
          })
          .catch((error) => {
            console.error("Error querying layer extent:", error);
          });
      } else {
        where = `((UPPER(Division) = '${division}' AND (UPPER(StationName) = '${stationName}' AND UPPER(Feature) = '${feature}')))`;
        layer.mosaicRule = {
          mosaicMethod: "esriMosaicNorthwest",
          where: where,
          sortField: "",
          ascending: true,
          mosaicOperation: "MT_FIRST",
        };
        console.log(`third mosaicRule Ran...`);
        console.log(layer.mosaicRule);
      }
      updataFilterContainer(division, stationName, feature);
    }

    // Add event listeners to the buttons
    filter1Option1.addEventListener("click", () => {
      updateMosaicRule(Imagerylayer1, "BMT");
      populateDropdownItems("BMT");
    });

    filter1Option2.addEventListener("click", () => {
      updateMosaicRule(Imagerylayer1, "IND");
      populateDropdownItems("IND");
    });

    filter1Option3.addEventListener("click", () => {
      updateMosaicRule(Imagerylayer1, "IRT");
      populateDropdownItems("IRT");
    });

    const sirButton = document.querySelector("#sir");
    const trackButton = document.querySelector("#track");

    let lastClickedButtonId = null;

    sirButton.addEventListener("click", (event) => {
      lastClickedButtonId = event.target.id;
      // console.log(button1id);
    });

    trackButton.addEventListener("click", (event) => {
      lastClickedButtonId = event.target.id;
      // console.log(locatorButton2.label);
    });

    let originalExtent;

    view.when(function () {
      originalExtent = view.extent.clone();
      // ... other code ...
    });

    function resetFilterAndZoom() {
      // Reset the filter by setting the mosaic rule to null
      Imagerylayer1.mosaicRule = null;
      const filterInputs = document.getElementById("filterInputs");
      filterInputs.innerHTML = null;

      // Zoom back out to the original extent
      view.goTo({ target: originalExtent });
    }

    const filterButton = document.getElementById("removeFilter");
    filterButton.addEventListener("click", () => {
      resetFilterAndZoom();
    });

    // trackButton.addEventListener("click", () => {
    //   console.log(trackButton.id);
    // });
    function updateInfoContainer(buttonPressed, input1, input2) {
      const infoContainer = document.getElementById("info-container");
      const upperButton = buttonPressed.toUpperCase();
      infoContainer.innerHTML = `
      <p>System Selected: ${upperButton}</p>
      <p>Track Name: ${input1}</p>
      <p>Stationing: ${input2}</p>
    `;
    }

    function updateInfoContainer2(buttonPressed, input3, input4, input5) {
      const infoContainer = document.getElementById("info-container");
      const upperButton2 = buttonPressed.toUpperCase();
      infoContainer.innerHTML = `
      <p>System Selected: ${upperButton2}</p>
      <p>Track Name: ${input3}</p>
      <p>From Stationing: ${input4}</p>
      <p>To Stationing: ${input5}</p>

    `;
    }

    const form1 = document.querySelector("#firstButton");
    const form2 = document.querySelector("#secondButton");
    const input1 = document.querySelector("#input1");
    const input2 = document.querySelector("#input2");

    const input3 = document.querySelector("#input3");
    const input4 = document.querySelector("#input4");
    const input5 = document.querySelector("#input5");

    form1.addEventListener("submit", function (event) {
      event.preventDefault();
      // console.log(event);
      // console.log("Form 1 submitted");
      // const Buttons = [locatorButton.label, locatorButton2.label];
      // const trackButton = locatorButton2.label;
      // prevent form from submitting normally
      const inputValue1 = input1.value;
      const inputValue2 = input2.value;
      updateInfoContainer(lastClickedButtonId, inputValue1, inputValue2);
      const assetLabel = document.querySelector("#assetLabel");

      // Expand to show first tab of Asset Locator App

      if (lastClickedButtonId === "track") {
        fetch(
          `https://mtagisdev.lirr.org/dosserverdev/rest/services/LRS/DOS_Track_Network/MapServer/exts/LRServer/networkLayers/1/measureToGeometry?locations=%5B%7B%22routeId%22%3A%22${inputValue1}%22%2C%22measure%22%3A${inputValue2}%7D%5D&temporalViewDate=&outSR=4326&gdbVersion=&historicMoment=&f=json&token=${token}`,
          {
            method: "GET",
          }
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Network response was not ok.");
            }
          })
          .then((jsonData) => {
            // console.log(token);
            console.log(jsonData);
            const xcoord = jsonData.locations[0].geometry.x;
            console.log(xcoord);
            const ycoord = jsonData.locations[0].geometry.y;
            console.log(ycoord);

            const point = {
              type: "point",
              longitude: xcoord,
              latitude: ycoord,
            };

            const markerSymbol = {
              type: "simple-marker",
              color: [30, 144, 255],
              outline: {
                color: [255, 255, 255],
                width: 2,
              },
            };

            const pointGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
            });

            view.graphics.add(pointGraphic);
          })
          .catch((error) => {
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
            let alert = document
              .querySelector("#alert")
              .setAttribute("open", "true");
          });
      } else {
        fetch(
          `https://mtagisdev.lirr.org/dosserverdev/rest/services/LRS/SIR_Track_Network/MapServer/exts/LRServer/networkLayers/1/measureToGeometry?locations=%5B%7B%22routeId%22%3A%22${inputValue1}%22%2C%22measure%22%3A${inputValue2}%7D%5D&temporalViewDate=&outSR=4326&gdbVersion=&historicMoment=&f=json&token=${token}`,
          {
            method: "GET",
          }
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Network response was not ok.");
            }
          })
          .then((jsonData) => {
            console.log(jsonData);
            const xcoord = jsonData.locations[0].geometry.x;
            console.log(xcoord);
            const ycoord = jsonData.locations[0].geometry.y;
            console.log(ycoord);

            const point = {
              type: "point",
              longitude: xcoord,
              latitude: ycoord,
            };

            const markerSymbol = {
              type: "simple-marker",
              color: [30, 144, 255],
              outline: {
                color: [255, 255, 255],
                width: 2,
              },
            };

            const pointGraphic = new Graphic({
              geometry: point,
              symbol: markerSymbol,
            });

            view.graphics.add(pointGraphic);
          })
          .catch((error) => {
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
            let alert = document
              .querySelector("#alert")
              .setAttribute("open", "true");
          });
      }

      form1.reset();
    });

    form2.addEventListener("submit", function (event) {
      event.preventDefault(); // prevent form from submitting normally
      // console.log("Form 2 submitted");

      const inputValue3 = input3.value;
      const inputValue4 = input4.value;
      const inputValue5 = input5.value;

      // In form2 event listener
      updateInfoContainer2(
        lastClickedButtonId,
        inputValue3,
        inputValue4,
        inputValue5
      );

      // Expand to show second tab of Asset Locator App

      if (lastClickedButtonId === "track") {
        fetch(
          `https://mtagisdev.lirr.org/dosserverdev/rest/services/LRS/DOS_Track_Network/MapServer/exts/LRServer/networkLayers/1/measureToGeometry?locations=%5B%7B%22routeId%22%3A%22${inputValue3}%22%2C%22fromMeasure%22%3A${inputValue4}%2C%22toMeasure%22%3A${inputValue5}%7D%5D&temporalViewDate=&outSR=4326&gdbVersion=&historicMoment=&f=json&token=${token}`,
          {
            method: "GET",
          }
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Network response was not ok.");
            }
          })
          .then((jsonData) => {
            console.log(jsonData);

            // Extract the paths from the API response
            const paths = jsonData.locations[0].geometry.paths;

            const polyline = {
              type: "polyline",
              paths: paths,
            };

            let polylineAtt = {
              Name: inputValue3,
              FromtPt: inputValue4,
              ToPt: inputValue5,
            };

            const simpleLineSymbol = {
              type: "simple-line",
              color: [151, 8, 238], // Orange
              width: 5,
              outline: {
                color: [255, 255, 255],
                width: 4,
              },
            };

            const polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: simpleLineSymbol,
              attributes: polylineAtt,
            });

            view.graphics.add(polylineGraphic);
          })
          .catch((error) => {
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
            let alert = document
              .querySelector("#alert")
              .setAttribute("open", "true");
          });
      } else {
        fetch(
          `https://mtagisdev.lirr.org/dosserverdev/rest/services/LRS/SIR_Track_Network/MapServer/exts/LRServer/networkLayers/1/measureToGeometry?locations=%5B%7B%22routeId%22%3A%22${inputValue3}%22%2C%22fromMeasure%22%3A${inputValue4}%2C%22toMeasure%22%3A${inputValue5}%7D%5D&temporalViewDate=&outSR=4326&gdbVersion=&historicMoment=&f=json&token=${token}`,
          {
            method: "GET",
          }
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error("Network response was not ok.");
            }
          })
          .then((jsonData) => {
            console.log(jsonData);

            // Extract the paths from the API response
            const paths = jsonData.locations[0].geometry.paths;

            const polyline = {
              type: "polyline",
              paths: paths,
            };

            let polylineAtt = {
              Name: inputValue3,
              FromtPt: inputValue4,
              ToPt: inputValue5,
            };

            const simpleLineSymbol = {
              type: "simple-line",
              color: [151, 8, 238], // Orange
              width: 5,
              outline: {
                color: [255, 255, 255],
                width: 4,
              },
            };

            const polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: simpleLineSymbol,
              attributes: polylineAtt,
            });

            view.graphics.add(polylineGraphic);
          })
          .catch((error) => {
            console.error(
              "There was a problem with the fetch operation:",
              error
            );
            let alert = document
              .querySelector("#alert")
              .setAttribute("open", "true");
          });
      }

      form2.reset();
    });

    const buttonClear = document.getElementById("removeGraphics");
    const infoContainer = document.getElementById("info-container");
    buttonClear.addEventListener("click", () => {
      view.graphics.removeAll();
      infoContainer.innerHTML = "";
    });

    const basemaps = new BasemapLayerList({
      view,
      container: "basemaps-container",
      basemapTitle: "",
    });
    // console.log(basemaps);

    basemaps.visibleElements = {
      baseHeading: false,
      statusIndicators: true,
      baseLayers: true,
      baseLayersTitle: false,
      referenceLayers: false,
      referenceLayersTitle: false,
      errors: true,
    };

    // console.log(basemaps.visibleElements);

    view.when().then(() => {
      // Get base layer titles dynamically
      const baseLayerTitles = view.map.basemap.baseLayers.map(
        (layer) => layer.title
      );

      // Watch for changes in the visibility of base layers
      reactiveUtils.watch(
        () => [view.map.basemap.baseLayers.map((layer) => layer.visible)],
        () => {
          manageBasemapVisibility(view.map.basemap.baseLayers, baseLayerTitles);
        }
      );
    });

    function manageBasemapVisibility(baseLayers, orthoLayerTitles) {
      // Filter out the layers that we're interested in
      let basemapLayers = baseLayers.filter((layer) =>
        orthoLayerTitles.includes(layer.title)
      );

      // Find the newly visible layer
      let newlyVisibleLayer = basemapLayers.find(
        (layer) => layer.visible && !layer.wasVisible
      );

      // If a newly visible layer is found, turn off all other layers
      if (newlyVisibleLayer) {
        basemapLayers.forEach((layer) => {
          if (layer !== newlyVisibleLayer) {
            layer.visible = false;
          }
        });
      }

      // Update wasVisible property
      basemapLayers.forEach((layer) => {
        layer.wasVisible = layer.visible;
      });
    }

    const bookmarks = new Bookmarks({
      view,
      container: "bookmarks-container",
    });

    let clickedLayerId;

    const layerList = new LayerList({
      view,
      selectionEnabled: true,
      popupEnabled: true,
      container: "layers-container",
      listItemCreatedFunction: function (event) {
        const item = event.item;
        // console.log(item);

        item.actionsSections = [
          [
            {
              title: "Open Attribute Table",
              className: "esri-icon-handle-vertical", // You can use a Calcite icon here
              id: "custom-action",
              visible: true,
            },
          ],
        ];
        createOpacitySlider(item);
      },
    });

    async function createOpacitySlider(item) {
      await item.layer.when();
      // console.log(item);
      // console.log(item.layer);

      const layer2 = item.layer;
      // const layerView = item.layerView;
      // console.log(layerView);
      // console.log(layer2);
      const fields = item.layer.fields;
      // if (layer2.title === "StationPlan") {
      //   return;
      // }
      // const fields2 = item.layer.fields;

      // If you need to see fields for a layer, uncomment the line below
      // console.log(fields);

      if (item.children.length < 1) {
        const layer = item.layer.url;
        const layerDefinition = item.layer.definitionExpression;
        // console.log(layerDefinition);
        // console.log(layer);
        const restURL = `${layer}`;

        // Create an "About" link
        const aboutLink = document.createElement("div");
        aboutLink.id = "information";
        aboutLink.title = "More Information";

        // Create an icon for the "About" link
        const aboutIcon = document.createElement("div");
        aboutIcon.id = "infoIcon";
        aboutIcon.className = "esri-icon-description custom-action-icon";
        aboutLink.appendChild(aboutIcon);

        const filterLabel = document.createElement("div");
        filterLabel.id = "filterLabel";
        filterLabel.title = "Filter";

        // div to hold new definition expression
        const filterDiv = document.createElement("div");
        filterDiv.id = "filterDiv";
        filterDiv.title = "Filter";

        const filterDiv2 = document.createElement("div");
        filterDiv2.id = "filterDiv";
        filterDiv2.title = "Filter 2";

        const filterDiv3 = document.createElement("div");
        filterDiv3.id = "filterDiv";
        filterDiv3.title = "Filter 3";

        const Label = document.createElement("calcite-label");
        Label.id = "filterLabel";
        Label.title = "Filter";
        Label.innerHTML = "Filter";

        // const hrLabel = document.createElement("hr");
        // hrLabel.id = "hrLabel";
        // hrLabel.title = "Filter";

        // Label.appendChild(hrLabel);

        filterLabel.appendChild(Label);

        const filterButton = document.createElement("div");
        filterButton.id = "filterButton";
        filterButton.title = "Reset";
        // filterButton.id = "filterButton";
        // filterButton.className = "btn btn-primary";
        // filterButton.innerHTML = "Filter Reset";
        // filterButton.scale = "xs";

        var combobox1 = document.createElement("calcite-combobox");
        combobox1.id = "combo1";
        combobox1.placeholder = "Field";
        combobox1.scale = "xs";
        combobox1.label = "Filter 1";
        combobox1.maxItems = "4";
        combobox1.selectionMode = "single";
        filterDiv.appendChild(combobox1);

        var combobox2 = document.createElement("calcite-combobox");
        combobox2.id = "combo2";
        combobox2.placeholder = "is";
        combobox2.scale = "xs";
        combobox2.label = "Filter 2";
        combobox2.value = "=";
        combobox2.selectionMode = "single";

        // Define labels and values
        var labelsAndValues = [
          { label: "is", value: "=" },
          { label: "is not", value: "<>" },
          // { label: "contains", value: "LIKE" },
        ];

        // Create a calcite-combobox-item for each label and value
        labelsAndValues.forEach((item) => {
          var option = document.createElement("calcite-combobox-item");
          option.setAttribute("scale", "xs");
          // option.scale = "xs";
          option.value = item.value;
          option.textLabel = item.label;
          combobox2.appendChild(option);
        });

        filterDiv2.appendChild(combobox2);

        let selectedValue2 = "=";
        let selected3Array = [];

        // let defaultSelectedValue2;

        combobox2.addEventListener("calciteComboboxItemChange", (event) => {
          // defaultSelectedValue2 = "=";

          selectedValue2 = event.target.value;
          console.log(selectedValue2);
          console.log(combobox2);
          selected3Array.push(selectedValue2);
          console.log(selected3Array);
        });
        // filterDiv2.appendChild(combobox2);

        var combobox3 = document.createElement("calcite-combobox");
        combobox3.id = "combo3";
        combobox3.placeholder = "Value";
        combobox3.scale = "xs";
        combobox3.label = "Filter 3";
        combobox3.maxItems = "6";
        combobox3.selectionMode = "multiple";
        filterDiv3.appendChild(combobox3);

        // Populate combobox1 with field data
        fields.forEach((field) => {
          const option1 = document.createElement("calcite-combobox-item");
          option1.setAttribute("scale", "xs");
          option1.value = field.name;
          option1.textLabel = field.alias;

          // Append each option to the combobox right away
          combobox1.appendChild(option1);
        });

        var resetViewFilterButton = document.createElement("calcite-button");
        resetViewFilterButton.id = "resetViewFilterButton";
        resetViewFilterButton.scale = "s";
        resetViewFilterButton.textContent = "Reset";
        resetViewFilterButton.icon = "undo";
        resetViewFilterButton.label = "Reset";
        // resetViewFilterButton.classList.add("btn", "btn-clear");

        filterButton.appendChild(resetViewFilterButton);

        // Populate combobox2 when a field is selected in combobox1
        combobox1.addEventListener("calciteComboboxChange", async (event) => {
          // Clear current options in combobox2
          while (combobox3.firstChild) {
            combobox3.firstChild.remove();
          }

          // Get selected field name
          const fieldName = event.target.selectedItems[0].value;
          // console.log(fieldName);

          // Query unique values of the selected field
          const uniqueValueQuery = layer2.createQuery();
          uniqueValueQuery.returnGeometry = false;
          uniqueValueQuery.returnDistinctValues = true;
          uniqueValueQuery.multiSelectionEnabled = true;
          uniqueValueQuery.outFields = `${fieldName}`;

          const results = await layer2.queryFeatures(uniqueValueQuery);

          let selectedValue3;
          let selectedValue3Array = [];
          let selectedVal;
          let selectedValString;
          console.log(selectedValue3Array);

          // Create and append a new option for each unique value
          results.features.forEach((feature) => {
            const uniqueValue = feature.attributes[fieldName];
            console.log(feature.attributes);

            console.log("uniqueValue:", uniqueValue);
            const option3 = document.createElement("calcite-combobox-item");
            // option3.scale = "xs";
            option3.value = uniqueValue;
            option3.textLabel = uniqueValue;
            combobox3.appendChild(option3);
          });

          let currentLayerView;

          view.whenLayerView(layer2).then(function (layerView) {
            currentLayerView = layerView; // store layerView in layerView1
            combobox3.addEventListener("calciteComboboxChange", (event) => {
              selectedValue3 = event.target.selectedItems[0].value;
              selectedVal = event.target.selectedItems.map(
                (items) => items.value
              );
              selectedValString = selectedVal
                .map((value) => `'${value}'`)
                .join(",");
              // console.log(selectedVal);
              // console.log(selectedValString);
              // // console.log(selectedValue3);
              // // selectedValue3Array.push(selectedValue3);

              currentLayerView.filter = {
                where: createdefinitionExpression(),
              };
              // layer2.definitionExpression = createdefinitionExpression();
              // console.log(selectedValue3Array);
            });
          });

          resetViewFilterButton.addEventListener("click", function () {
            combobox1.value = "";
            combobox2.value = "=";
            combobox3.value = "";
            // console.log(currentLayerView);
            if (currentLayerView) {
              // check if currentLayerView is available
              currentLayerView.filter = {
                where: "",
              };
            }
            // console.log(layerView.filter);
            // console.log(layer2.definitionExpression);
          });

          function createdefinitionExpression() {
            if (selectedValue2 === "=") {
              // console.log(selectedVal[0], selectedVal[1]);
              return `${fieldName} IN (${selectedValString})`;
            } else if (selectedValue2 === "<>") {
              return `${fieldName} NOT IN (${selectedValString})`;
            }
          }

          // console.log(selectedValue3Array);
        });

        aboutIcon.onclick = function () {
          window.open(restURL);
        };

        const opacityDiv = document.createElement("div");
        opacityDiv.innerHTML = "<p>Opacity (%)</p>";
        opacityDiv.id = "opacityDiv";

        const opacitySlider = new Slider({
          container: opacityDiv,
          min: 0,
          max: 1,
          values: [0.75],
          precision: 2,
          visibleElements: {
            labels: true,
            rangeLabels: true,
          },
        });

        item.panel = {
          content: [opacityDiv],
          className: "esri-icon-sliders-horizontal",
          title: "Change layer settings",
          label: "Change layer settings",
        };

        opacitySlider.on("thumb-drag", (event) => {
          const { value } = event;
          item.layer.opacity = value;
        });

        // Only add filter divs and buttons to the panel if the layer title is not "StationPlan"
        if (layer2.title !== "Station Plans") {
          item.panel.content.push(
            filterLabel,
            filterDiv,
            filterDiv2,
            filterDiv3,
            filterButton,
            aboutLink
          );
        }
      }
    }

    layerList.on("trigger-action", createOpacitySlider);
    layerList.on("trigger-action", customAction);
    // layerList.addEventListener("click", customAction);

    const legend = new Legend({
      view,
      container: "legend-container",
    });
    const print = new Print({
      view,
      printServiceUrl: `${printURL}`,
      allowedFormats: ["pdf", "jpg", "png"],
      container: "print-container",
    });

    // Create a new div element for the Search widget container and its configuration
    const searchWidgetContainer = document.createElement("div");
    searchWidgetContainer.id = "search-widget-container";

    const headerTitle = document.getElementById("header-title");
    const h2Element = headerTitle.querySelector("h2");

    const searchWidget = new Search({
      view: view,
      locationEnabled: false,
      searchAllEnabled: true,
      includeDefaultSources: false,
      suggestionsEnabled: true,
      exactMatch: false,
      maxSuggestions: 6,
      maxResults: 6,
    });

    // Wait for the view to finish loading, then add the search bar
    view.when().then(function () {
      headerTitle.insertBefore(searchWidgetContainer, h2Element.nextSibling);
      searchWidget.container = searchWidgetContainer;
      searchWidget.container.style = "border-radius: 25px;";

      document.addEventListener("DOMContentLoaded", function (event) {
        const searchContainer = searchWidgetContainer.getElementsByClassName(
          "esri-search__container"
        );
        const searchInput = searchContainer[0].querySelector(
          ".esri-search__input"
        );
      });
      const img = document.createElement("img");
      // coming from json file
      img.src = "MTA-NYCT.jpg";
      img.alt = "QDS Logo";
      // change to
      img.width = "40";
      img.height = "40";

      const h2 = headerTitle.querySelector("h2");
      headerTitle.insertBefore(img, h2);
    });

    const locateBtn = new Locate({
      view: view,
    });

    const homebutton = new Home({
      view: view,
    });

    const scaleBar = new ScaleBar({
      view: view,
      unit: "dual",
      style: "ruler",
    });

    const ccWidget = new CoordinateConversion({
      view: view,
      headingLevel: 5,
    });

    view.ui.add(ccWidget, "bottom-right");

    view.ui.add(homebutton, {
      position: "top-left",
    });

    view.ui.move("zoom", "top-left");
    // Add the locate widget to the top left corner of the view
    view.ui.add(locateBtn, "top-right");

    // Add the widget to the bottom left corner of the view
    view.ui.add(scaleBar, {
      position: "bottom-left",
    });

    // add the toolbar for the measurement widgets
    view.ui.add("topbar", "top-right");
    let activeWidget1 = null;

    document
      .getElementById("distanceButton")
      .addEventListener("click", function () {
        setActiveWidget(null);
        if (!this.classList.contains("active")) {
          setActiveWidget("distance");
        } else {
          setActiveButton(null);
        }
      });

    document
      .getElementById("areaButton")
      .addEventListener("click", function () {
        setActiveWidget(null);
        if (!this.classList.contains("active")) {
          setActiveWidget("area");
        } else {
          setActiveButton(null);
        }
      });

    function setActiveWidget(type) {
      switch (type) {
        case "distance":
          activeWidget1 = new DistanceMeasurement2D({
            view: view,
            unit: "feet",
          });

          // skip the initial 'new measurement' button
          activeWidget1.viewModel.start();

          view.ui.add(activeWidget1, "top-right");
          setActiveButton(document.getElementById("distanceButton"));
          break;
        case "area":
          activeWidget1 = new AreaMeasurement2D({
            view: view,
            unit: "square-us-feet",
          });

          // skip the initial 'new measurement' button
          activeWidget1.viewModel.start();

          view.ui.add(activeWidget1, "top-right");
          setActiveButton(document.getElementById("areaButton"));
          break;
        case null:
          if (activeWidget1) {
            view.ui.remove(activeWidget1);
            activeWidget1.destroy();
            activeWidget1 = null;
          }
          break;
      }
    }

    function setActiveButton(selectedButton) {
      // focus the view to activate keyboard shortcuts for sketching
      view.focus();
      let elements = document.getElementsByClassName("active");
      for (let i = 0; i < elements.length; i++) {
        elements[i].classList.remove("active");
      }
      if (selectedButton) {
        selectedButton.classList.add("active");
      }
    }

    view.when(function () {
      webmap.load().then(function () {
        // Wait for all layers to be loaded
        let layersLoaded = webmap.layers.map((layer) => layer.load());
        // console.log(layersLoaded);
        // layersLoaded.reverse();

        // console.log(layersLoaded);
        Promise.all(layersLoaded).then(() => {
          const reversedLayers = webmap.layers.slice().reverse();
          const featureLayerSources = reversedLayers
            .filter(function (layer) {
              return layer.type === "feature" || layer.type === "Map Service";
            })
            .map(function (featureLayer) {
              const defaultSearchFields = featureLayer.fields
                .filter(
                  (field) =>
                    field.type === "string" ||
                    field.type === "double" ||
                    field.type === "date"
                )
                .map((field) => field.name);

              let searchFields, displayField;

              if (featureLayer.title === "Single Line Drawings") {
                searchFields = ["DRAWINGNUMBER"];
                displayField = "DRAWINGNUMBER";
              } else if (featureLayer.title === "Double Line Drawings") {
                searchFields = ["DRAWINGNUMBER"];
                displayField = "DRAWINGNUMBER";
              } else {
                searchFields = ["OBG_COMMON_NAME", "OBG_DESC", "OBG_SYSTEM"];
                displayField = "OBG_DESC";
              }

              return {
                layer: featureLayer,
                searchFields: searchFields,
                displayField: displayField,
                outFields: ["*"],
                name: featureLayer.title,
                placeholder: "Search " + featureLayer.title,
                // minSuggestCharacters: 3,
                maxSuggestions: 6,
                maxResults: 6,
                searchAllEnabled: true,
                suggestionsEnabled: true,

                // exactMatch: false,
              };
            });
          // Add event listener for search-focus event
          // searchWidget.on("suggest-start", function (event) {
          //   const changeSearch = `%${event.searchTerm}`;
          //   console.log(changeSearch);
          //   searchWidget.searchTerm = `%${event.searchTerm}`;
          // });
          let searchQuery = "";

          searchWidget.on("suggest-start", function (event) {
            if (!event.searchTerm.startsWith("%")) {
              searchQuery = `%${event.searchTerm}`;
              searchWidget.searchTerm = searchQuery;
            } else {
              searchQuery = event.searchTerm;
            }
          });
          // Geocoder
          const geocoder = {
            url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            name: "Esri World Geocoder",
            placeholder: "Search by Address or Location",
          };

          // // Add event listener for search-clear event
          // searchWidget.on("search-clear", function () {
          //   searchWidget.activeSource.searchTerm = `%`;
          // });
          searchWidget.sources = featureLayerSources;
          searchWidget.sources.push(geocoder);
          // console.log(featureLayerSources);
        });
      });
    });

    console.log(searchWidget.sources);
    webmap.when(() => {
      const { description, thumbnailUrl, avgRating } = webmap.portalItem;
      // configured in JSON, not the webmap any longer
      // change "title" value pair in JSON file
      document.querySelector("#header-title").textContent = title;
      document.querySelector("#item-description").innerHTML = description;
      document.querySelector("#item-thumbnail").src = thumbnailUrl;
      document.querySelector("#item-rating").value = avgRating;

      let activeWidget;

      const handleActionBarClick = ({ target }) => {
        if (target.tagName !== "CALCITE-ACTION") {
          return;
        }

        if (activeWidget) {
          document.querySelector(
            `[data-action-id=${activeWidget}]`
          ).active = false;
          document.querySelector(
            `[data-panel-id=${activeWidget}]`
          ).hidden = true;
        }

        const nextWidget = target.dataset.actionId;
        if (nextWidget !== activeWidget) {
          document.querySelector(
            `[data-action-id=${nextWidget}]`
          ).active = true;
          document.querySelector(
            `[data-panel-id=${nextWidget}]`
          ).hidden = false;
          activeWidget = nextWidget;
        } else {
          activeWidget = null;
        }
      };

      document
        .querySelector("calcite-action-bar")
        .addEventListener("click", handleActionBarClick);

      let actionBarExpanded = false;

      document.addEventListener("calciteActionBarToggle", (event) => {
        actionBarExpanded = !actionBarExpanded;
        view.padding = {
          left: actionBarExpanded ? 160 : 45,
        };
      });
      document.querySelector("calcite-shell").hidden = false;
      document.querySelector("calcite-loader").hidden = true;
    });
  }
});
