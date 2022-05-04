import searchHelper from "../../../assets/javascripts/helpers/search.js";
import commonHelper from "../../../assets/javascripts/helpers/common.js";

let searxDiv = document.getElementById("searx");
let searxngDiv = document.getElementById("searxng")
let whoogleDiv = document.getElementById("whoogle");

let disableSearchElement = document.getElementById("disable-search");
let searchFrontendElement = document.getElementById("search-frontend");
let protocolElement = document.getElementById("protocol")

browser.storage.local.get(
  [
    "disableSearch",
    "searchFrontend",
    "searchProtocol",
  ],
  r => {
    disableSearchElement.checked = !disableSearch;

    searchFrontendElement.value = r.searchFronten;
    changeFrontendsSettings(r.searchFronten);

    protocolElement.value = r.searchProtocol;
    changeProtocolSettings(r.searchProtocol);
  }
);

document.addEventListener("change", async () => {
  await browser.storage.local.set({
    disableSearch: !disableSearchElement.checked,
    searchFrontend: searchFrontendElement.value,
    searchProtocol: protocolElement.value,
  });
  changeFrontendsSettings(searchFrontendElement.value);
  changeProtocolSettings(protocolElement.value);
})

function changeFrontendsSettings(frontend) {
  let SearxWhoogleElement = document.getElementById("searx-whoogle");
  if (frontend == 'searx') {
    searxDiv.style.display = 'block';
    searxngDiv.style.display = 'none';
    whoogleDiv.style.display = 'none';
    SearxWhoogleElement.style.display = 'block';
  }
  else if (frontend == 'searxng') {
    searxDiv.style.display = 'none';
    searxngDiv.style.display = 'block';
    whoogleDiv.style.display = 'none';
    SearxWhoogleElement.style.display = 'block';
  }
  else if (frontend == 'whoogle') {
    searxDiv.style.display = 'none';
    searxngDiv.style.display = 'none';
    whoogleDiv.style.display = 'block';
    SearxWhoogleElement.style.display = 'block';
  }
}

function changeProtocolSettings(protocol) {
  let normalsearxDiv = searxDiv.getElementsByClassName("normal")[0];
  let torsearxDiv = searxDiv.getElementsByClassName("tor")[0];
  let i2psearxDiv = searxDiv.getElementsByClassName("i2p")[0];

  let normalsearxngDiv = searxngDiv.getElementsByClassName("normal")[0];
  let torsearxngDiv = searxngDiv.getElementsByClassName("tor")[0];
  let i2psearxngDiv = searxngDiv.getElementsByClassName("i2p")[0];

  let normalwhoogleDiv = whoogleDiv.getElementsByClassName("normal")[0];
  let torwhoogleDiv = whoogleDiv.getElementsByClassName("tor")[0];
  let i2pwhoogleDiv = whoogleDiv.getElementsByClassName("i2p")[0];

  if (protocol == 'normal') {
    normalsearxDiv.style.display = 'block';
    normalsearxngDiv.style.display = 'block';
    normalwhoogleDiv.style.display = 'block';
    torsearxDiv.style.display = 'none';
    torsearxngDiv.style.display = 'none';
    torwhoogleDiv.style.display = 'none';
    i2psearxDiv.style.display = 'none';
    i2psearxngDiv.style.display = 'none';
    i2pwhoogleDiv.style.display = 'none';
  }
  else if (protocol == 'tor') {
    normalsearxDiv.style.display = 'none';
    normalsearxngDiv.style.display = 'none';
    normalwhoogleDiv.style.display = 'none';
    torsearxDiv.style.display = 'block';
    torsearxngDiv.style.display = 'block';
    torwhoogleDiv.style.display = 'block';
    i2psearxDiv.style.display = 'none';
    i2psearxngDiv.style.display = 'none';
    i2pwhoogleDiv.style.display = 'none';
  }
  else if (protocol == 'i2p') {
    normalsearxDiv.style.display = 'none';
    normalsearxngDiv.style.display = 'none';
    normalwhoogleDiv.style.display = 'none';
    torsearxDiv.style.display = 'none';
    torsearxngDiv.style.display = 'none';
    torwhoogleDiv.style.display = 'none';
    i2psearxDiv.style.display = 'block';
    i2psearxngDiv.style.display = 'block';
    i2pwhoogleDiv.style.display = 'block';
  }
}

commonHelper.processDefaultCustomInstances('searx', 'normal', searchHelper, document);
commonHelper.processDefaultCustomInstances('searx', 'tor', searchHelper, document);
commonHelper.processDefaultCustomInstances('searx', 'i2p', searchHelper, document);
commonHelper.processDefaultCustomInstances('searxng', 'normal', searchHelper, document);
commonHelper.processDefaultCustomInstances('searxng', 'tor', searchHelper, document);
commonHelper.processDefaultCustomInstances('searxng', 'i2p', searchHelper, document);
commonHelper.processDefaultCustomInstances('whoogle', 'normal', searchHelper, document);
commonHelper.processDefaultCustomInstances('whoogle', 'tor', searchHelper, document);
commonHelper.processDefaultCustomInstances('whoogle', 'i2p', searchHelper, document);

let latencySearxElement = document.getElementById("latency-searx");
let latencySearxLabel = document.getElementById("latency-searx-label");
latencySearxElement.addEventListener("click",
  async () => {
    let reloadWindow = () => location.reload();
    latencySearxElement.addEventListener("click", reloadWindow);
    await searchHelper.init();
    let redirects = searchHelper.getRedirects();
    const oldHtml = latencySearxLabel.innerHTML;
    latencySearxLabel.innerHTML = '...';
    commonHelper.testLatency(latencySearxLabel, redirects.searx.normal).then(r => {
      browser.storage.local.set({ searxLatency: r });
      latencySearxLabel.innerHTML = oldHtml;
      commonHelper.processDefaultCustomInstances('searx', 'normal', searchHelper, document);
      latencySearxElement.removeEventListener("click", reloadWindow);
    });
  }
);

let latencySearxngElement = document.getElementById("latency-searxng");
let latencySearxngLabel = document.getElementById("latency-searxng-label");
latencySearxngElement.addEventListener("click",
  async () => {
    let reloadWindow = () => location.reload();
    latencySearxngElement.addEventListener("click", reloadWindow);
    await searchHelper.init();
    let redirects = searchHelper.getRedirects();
    const oldHtml = latencySearxngLabel.innerHTML;
    latencySearxngLabel.innerHTML = '...';
    commonHelper.testLatency(latencySearxngLabel, redirects.searxng.normal).then(r => {
      browser.storage.local.set({ searxngLatency: r });
      latencySearxngLabel.innerHTML = oldHtml;
      commonHelper.processDefaultCustomInstances('searxng', 'normal', searchHelper, document);
      latencySearxngElement.removeEventListener("click", reloadWindow);
    });
  }
);

let latencyWhoogleElement = document.getElementById("latency-whoogle");
let latencyWhoogleLabel = document.getElementById("latency-whoogle-label");
latencyWhoogleElement.addEventListener("click",
  async () => {
    let reloadWindow = () => location.reload();
    latencyWhoogleElement.addEventListener("click", reloadWindow);
    await searchHelper.init();
    let redirects = searchHelper.getRedirects();
    const oldHtml = latencyWhoogleLabel.innerHTML;
    latencyWhoogleLabel.innerHTML = '...';
    commonHelper.testLatency(latencyWhoogleLabel, redirects.whoogle.normal).then(r => {
      browser.storage.local.set({ whoogleLatency: r });
      latencyWhoogleLabel.innerHTML = oldHtml;
      commonHelper.processDefaultCustomInstances('whoogle', 'normal', searchHelper, document);
      latencyWhoogleElement.removeEventListener("click", reloadWindow);
    });
  }
);

window.onblur = () => {
  searchHelper.initSearxCookies();
  searchHelper.initSearxngCookies();
}