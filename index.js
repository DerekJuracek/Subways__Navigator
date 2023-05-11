require([
  "esri/config",
  "esri/widgets/Expand",
  "esri/widgets/Sketch",
  "esri/WebMap",
  "esri/portal/Portal",
  "esri/portal/PortalGroup",
  "esri/widgets/FeatureTable",
  "esri/layers/CSVLayer",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/views/MapView",
  "esri/geometry/projection",
  "esri/layers/ImageryLayer",
  "esri/Graphic",
  "esri/widgets/Bookmarks",
  "esri/widgets/BasemapGallery",
  "esri/widgets/LayerList",
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
  Expand,
  Sketch,
  WebMap,
  Portal,
  PortalGroup,
  FeatureTable,
  CSVLayer,
  FeatureLayer,
  GraphicsLayer,
  MapView,
  projection,
  ImageryLayer,
  Graphic,
  Bookmarks,
  BasemapGallery,
  LayerList,
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
  // const api = esriConfig.apiKey = "AAPK87b9a263a35c4a44809e64bf5f252bce_gAhLbwEuock12F5JkIcuWTTWTz-KkQH4phl4YKRNi9uvwHg-6c4dA_0Q1bQXyqL";

  esriConfig.portalUrl = "https://mtagisdev.lirr.org/dosportaldev/";
  const webmapId =
    new URLSearchParams(window.location.search).get("webmap") ??
    "5dbd53039d094cde802afcae6a3e4c07";

  const graphicsLayer = new GraphicsLayer();

  const webmap = new WebMap({
    portalItem: {
      id: webmapId,
    },
    layers: [graphicsLayer],
  });

  console.log(webmap);

  const view = new MapView({
    container: "viewDiv",
    map: webmap,
    // layers: [imageLayer],
    padding: {
      left: 196,
      top: 0,
      bottom: 0,
      right: 0,
    },
    spatialReference: {
      wkid: 102100,
    },
  });

  // const layer2 = view.map.allLayers;
  // console.log(layer2);

  // Helper function to parse URL query parameters

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
    const layer = view.map.allLayers.find((layer) => layer.title === layerName);

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

  // const shareAction = document.getElementById("shareAction");

  // view.on("mouse-wheel", function () {
  //   shareAction.addEventListener("click", function () {
  //     let shareURL = document.getElementById("shareURL");
  //     let anchor = shareURL.querySelector("a");
  //     // Access the href attribute of the <a> element
  //     let hrefValue = anchor.getAttribute("href");
  //     console.log("Current href value:", hrefValue);
  //     let currentState = view.state.extent;
  //     let min = [currentState.xmin, currentState.ymin];
  //     let max = [currentState.xmax, currentState.ymax];
  //     // console.log(shareURL);
  //     console.log(currentState);
  //     console.log(min);
  //     console.log(max);

  //     let newHrefValue = `https://gis.mta.info/portal/apps/webappviewer/index.html?id=71c72cd11c5b4b988d38297857e84260&extent=${min}%2C${max}%2C102100`;
  //     anchor.setAttribute("href", newHrefValue);
  //     console.log();
  //     // shareURL.textContent = newHrefValue;
  //   });
  // });

  // console.log(view);
  const shareAction = document.getElementById("shareAction");

  shareAction.addEventListener("click", function () {
    let shareURL = document.getElementById("shareURL");
    let anchor = shareURL.querySelector("a");
    // Access the href attribute of the <a> element
    let hrefValue = anchor.getAttribute("href");
    console.log("Current href value:", hrefValue);
    let currentState = view.state.extent;
    let min = [currentState.xmin, currentState.ymin];
    let max = [currentState.xmax, currentState.ymax];
    // console.log(shareURL);
    console.log(currentState);
    console.log(min);
    console.log(max);

    let newHrefValue = `https://gis.mta.info/portal/apps/webappviewer/index.html?id=71c72cd11c5b4b988d38297857e84260&extent=${min}%2C${max}%2C102100`;
    anchor.setAttribute("href", newHrefValue);
    console.log();
    // shareURL.textContent = newHrefValue;
  });

  window.onload = function () {
    const sidebar = document.getElementById("sidebar");
    const collapseButton = document.getElementById("collapseButton");

    function updateLayout() {
      let actionBar = document.querySelector("calcite-action-bar");
      let attributeBar = document.getElementById("attributeBar");

      if (actionBar.expanded) {
        sidebar.style.width = "195px";
        view.padding = { left: 196 };

        if (attributeBar.classList.contains("collapsed")) {
          // i think this dissapears anyway because its collapsed? try to understand logic more
          // changed both of these values and nothing changes, so i think this is the case
          attributeBar.style.left = "195px";
          attributeBar.style.width = "calc(100% - 150px)";
        } else {
          // this is what changes the width of the attribute table
          attributeBar.style.left = "195px";
          attributeBar.style.width = "calc(100% - 195px)";
        }
      } else {
        sidebar.style.width = "45px";
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

    collapseButton.addEventListener("click", function (event) {
      event.stopPropagation();

      let attributeBar = document.getElementById("attributeBar");

      if (attributeBar.classList.contains("collapsed")) {
        attributeBar.style.height = "250px";
        attributeBar.classList.remove("collapsed");
        // this.textContent = "Attribute Table";
      } else {
        attributeBar.style.height = "0px";
        attributeBar.classList.add("collapsed");
        // this.textContent = "Attribute Table";
      }
      updateLayout();
    });
  };

  let featureTable;
  let layer;

  async function customAction(event) {
    // Handle custom action click event
    console.log("Custom action clicked:", event);
    layer = event.item.layer;

    const container = document.getElementById("attributeBar");
    console.log(featureTable);

    // view.padding = { bottom: 0 };
    if (!featureTable) {
      const tableContainer = document.createElement("div");
      container.appendChild(tableContainer);
      // Create a new FeatureTable for the layer
      featureTable = new FeatureTable({
        layer: layer,
        container: tableContainer,
        visible: true,
      });
      attributeBar.style.height = "250px";
      // view.padding = { bottom: 196 };
      console.log(featureTable);
    } else {
      featureTable.destroy();
      featureTable = null;

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

    // tab.insertBefore(featureTableContainer);

    // Add the container to the tab

    view.ui.add(featureButton, "bottom-right");
  });

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
  // csvFileInput.addEventListener("click", function () {
  //   console.log("im getting clicked");
  // });
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

  let addDataPower = document.getElementById("powerSubstationsAction");
  let addDataComm = document.getElementById("commAction");
  let addDataFan = document.getElementById("fanAction");
  let addDataSpans = document.getElementById("spanAction");

  addDataPower.addEventListener("click", function () {
    console.log("add data button clicked");
    if (powerSubsLayer) {
      // map.removeAll();
      webmap.remove(powerSubsLayer);
      powerSubsLayer = null;
      view.graphics.removeAll();
      addDataPower.icon = "add-layer";
      // featureLayer.destroy();
      // featureLayer = null;
      // view.graphics.removeAll();
    } else {
      addFeatureLayer();
      addDataPower.icon = "minus-circle";
    }
  });

  let powerSubsLayer = null;

  function addFeatureLayer() {
    // Carbon storage of trees in Warren Wilson College.
    powerSubsLayer = new FeatureLayer({
      url: "https://mtagisdev.lirr.org/dosserverdev/rest/services/EAMPRD_EQUIPMENT/Power_Substations/MapServer/0",
    });

    webmap.add(powerSubsLayer);
  }

  addDataComm.addEventListener("click", function () {
    console.log("add data button clicked");
    if (commsLayer) {
      // map.removeAll();
      webmap.remove(commsLayer);
      commsLayer = null;
      view.graphics.removeAll();
      addDataComm.icon = "add-layer";
      // featureLayer.destroy();
      // featureLayer = null;
      // view.graphics.removeAll();
    } else {
      addCommsLayer();
      addDataComm.icon = "minus-circle";
    }
  });

  let commsLayer = null;

  function addCommsLayer() {
    // Carbon storage of trees in Warren Wilson College.
    commsLayer = new FeatureLayer({
      url: "https://gis.mta.info/agencies/rest/services/DOS_EAMPRD_EQUIPMENT/Communications_Rooms/MapServer/0",
    });

    webmap.add(commsLayer);
  }

  addDataFan.addEventListener("click", function () {
    console.log("add data button clicked");
    if (fansLayer) {
      // map.removeAll();
      webmap.remove(fansLayer);
      fansLayer = null;
      view.graphics.removeAll();
      addDataFan.icon = "add-layer";
      // featureLayer.destroy();
      // featureLayer = null;
      // view.graphics.removeAll();
    } else {
      addFansLayer();
      addDataFan.icon = "minus-circle";
    }
  });

  let fansLayer = null;

  function addFansLayer() {
    // Carbon storage of trees in Warren Wilson College.
    fansLayer = new FeatureLayer({
      url: "https://gis.mta.info/agencies/rest/services/DOS_EAMPRD_EQUIPMENT/Fan_Plants/MapServer/0",
    });

    webmap.add(fansLayer);
  }

  addDataSpans.addEventListener("click", function () {
    console.log("add data button clicked");
    if (spansLayer) {
      // map.removeAll();
      webmap.remove(spansLayer);
      spansLayer = null;
      view.graphics.removeAll();
      addDataSpans.icon = "add-layer";
      // featureLayer.destroy();
      // featureLayer = null;
      // view.graphics.removeAll();
    } else {
      addSpansLayer();
      addDataSpans.icon = "minus-circle";
    }
  });

  let spansLayer = null;

  function addSpansLayer() {
    // Carbon storage of trees in Warren Wilson College.
    spansLayer = new FeatureLayer({
      url: "https://gis.mta.info/agencies/rest/services/DOS_EAMPRD_EQUIPMENT/Spans/MapServer/0",
    });

    webmap.add(spansLayer);
  }

  // Add the ImageryLayer, but it already exists in the webmap
  // Want solution to pull from webmap, not adding it again
  let Imagerylayer1 = new ImageryLayer({
    url: "https://mtagisdev.lirr.org/dosserverdev/rest/services/StationPlanGeoreferencing/StationPlans/ImageServer",
  });

  webmap.add(Imagerylayer1);

  const token = `bla9IvguSQ-dZURCpXKRjlI3NcXw3nSKbDSQbJ1ZzPoTIXNnWxePZG-FyVTSOn8al2HKQ3cjBWT2XGkrHOwvaqnIf5iM9jVpokTK-3VUlZpPbPMOxbYBJIGyMb71vM6h9dGMNIvsjJmH_zx8FgiHYobXyEG9CgPtSt5Grq0kEYi8rTVyksdDw3V3FUTiOb8p8ms6DCoFUqKbA3GUzPoWIudOI5WBAKwiQxxEWw67U94.`;

  async function populateDropdownItems(division) {
    let divison = division.toUpperCase();
    const url = `https://mtagisdev.lirr.org/dosserverdev/rest/services/StationPlanGeoreferencing/StationPlans/ImageServer/query?where=Division+%3D+%27${divison}%27&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=102100&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=StationName&returnGeometry=false&outSR=102100&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&pixelSize=&rasterQuery=&orderByFields=StationName&groupByFieldsForStatistics=&outStatistics=&returnDistinctValues=true&multidimensionalDefinition=&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&resultOffset=0&resultRecordCount=1000&f=json&token=${token}`;
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
    const url = `https://mtagisdev.lirr.org/dosserverdev/rest/services/StationPlanGeoreferencing/StationPlans/ImageServer/query?f=json&where=(((UPPER(Division)%20%3D%20%27${division}%27)%20AND%20(UPPER(StationName)%20%3D%20%27${stationName1}%27)))&returnGeometry=true&returnFields=*&outFields=*&spatialRel=esriSpatialRelIntersects&outSR=102100&token=${token}`;
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

    if (lastClickedButtonId === "track") {
      // console.log(button1id);
      // console.log(`Track Button label is: ${trackButton.label}`);
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
          console.error("There was a problem with the fetch operation:", error);
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
          console.error("There was a problem with the fetch operation:", error);
          let alert = document
            .querySelector("#alert")
            .setAttribute("open", "true");
          // let alert = (document.querySelector("#alert").insertAdjacentText =
          //   ("afterbegin", "open"));
          // console.log(alert);
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
          console.error("There was a problem with the fetch operation:", error);
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
          console.error("There was a problem with the fetch operation:", error);
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

  const basemaps = new BasemapGallery({
    view,
    container: "basemaps-container",
  });
  const bookmarks = new Bookmarks({
    view,
    container: "bookmarks-container",
  });

  const layerList = new LayerList({
    view,
    selectionEnabled: true,
    container: "layers-container",
    listItemCreatedFunction: function (event) {
      const item = event.item;

      item.actionsSections = [
        [
          {
            title: "Custom action",
            className: "esri-icon-handle-vertical", // You can use a Calcite icon here
            id: "custom-action",
            visible: true,
          },
        ],
      ];
    },
  });

  layerList.on("trigger-action", customAction);
  // layerList.addEventListener("click", customAction);

  const legend = new Legend({
    view,
    container: "legend-container",
  });
  const print = new Print({
    view,
    container: "print-container",
  });

  // Create a new div element for the Search widget container
  const searchWidgetContainer = document.createElement("div");
  searchWidgetContainer.id = "search-widget-container";

  // Get the header-title and h2 element
  const headerTitle = document.getElementById("header-title");
  const h2Element = headerTitle.querySelector("h2");

  const searchWidget = new Search({
    view: view,
  });

  view.when().then(function () {
    headerTitle.insertBefore(searchWidgetContainer, h2Element.nextSibling);
    searchWidget.container = searchWidgetContainer;
    searchWidget.container.style = "border-radius: 25px;";
    // Move the Search widget to the searchWidgetContainer
    // searchWidget.container = searchWidgetContainer;
  });
  const locateBtn = new Locate({
    view: view,
  });

  // if you want to add back to the html container
  // comment the line below back out and delete or commment out the homebutton view
  const homebutton = new Home({
    view: view,
    // container: "home-container",
  });

  const scaleBar = new ScaleBar({
    view: view,
    unit: "dual",
    style: "ruler", // The scale bar displays both metric and non-metric units.
  });

  const ccWidget = new CoordinateConversion({
    view: view,
  });

  view.ui.add(ccWidget, "bottom-right");

  view.ui.add(searchWidget, {
    position: "top-right",
  });

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

  document.getElementById("areaButton").addEventListener("click", function () {
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
        });

        // skip the initial 'new measurement' button
        activeWidget1.viewModel.start();

        view.ui.add(activeWidget1, "top-right");
        setActiveButton(document.getElementById("distanceButton"));
        break;
      case "area":
        activeWidget1 = new AreaMeasurement2D({
          view: view,
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
  const allLayers = view.map.allLayers;
  console.log(allLayers);

  // Adds the search widget below other elements in
  // the top left corner of the view

  view.when(function () {
    webmap.load().then(function () {
      // Wait for all layers to be loaded
      const layersLoaded = webmap.layers.map((layer) => layer.load());
      //   console.log(layersLoaded);
      Promise.all(layersLoaded).then(() => {
        const featureLayerSources = webmap.layers
          .filter(function (layer) {
            return layer.type === "feature";
          })
          .map(function (featureLayer) {
            const defaultSearchFields = featureLayer.fields
              .filter(
                (field) => field.type === "string" || field.type === "double"
              )
              .map((field) => field.name);

            let searchFields, displayField;

            if (
              featureLayer.title ===
              "Subways Navigator V2 - Single Line Drawings"
            ) {
              searchFields = ["DRAWINGNUMBER"];
              displayField = "DRAWINGNUMBER";
            } else if (
              featureLayer.title ===
              "Subways Navigator V2 - Double Line Drawings"
            ) {
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
              maxSuggestions: 10,
              maxResults: 300,
              searchAllEnabled: true,
              exactMatch: true,
            };
          });

        searchWidget.sources = featureLayerSources;
      });
    });
  });

  webmap.when(() => {
    const { title, description, thumbnailUrl, avgRating } = webmap.portalItem;
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
        document.querySelector(`[data-panel-id=${activeWidget}]`).hidden = true;
      }

      const nextWidget = target.dataset.actionId;
      if (nextWidget !== activeWidget) {
        document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
        document.querySelector(`[data-panel-id=${nextWidget}]`).hidden = false;
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

  // Load the webmap
  // webmap.load().then(function () {
  //   // Once the webmap is loaded, access its layers
  //   const featureLayerSources = webmap.layers;

  //   // Use the first feature layer in the webmap, or choose a specific one
  //   const desiredFeatureLayer = featureLayerSources.getItemAt(0);

  //   // Create the FeatureTable widget
  //   const featureTable = new FeatureTable({
  //     view: view,
  //     layer: desiredFeatureLayer,
  //     container: document.getElementById("feature-table-content"),
  //     columnReorderingEnabled: true,
  //     columnResizingEnabled: true,
  //   });
  // });
  // webmap.load().then(function () {
  //   const MapLayerSources = webmap.layers;
  //   console.log(MapLayerSources);
  // });
});
