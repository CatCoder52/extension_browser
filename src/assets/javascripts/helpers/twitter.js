window.browser = window.browser || window.chrome;

import commonHelper from './common.js'

const targets = [
  /^https?:\/\/twitter\.com/,
  /^https?:\/\/www\.twitter\.com/,
  /^https?:\/\/mobile\.twitter\.com/,
  /^https?:\/\/pbs\.twimg\.com/,
  /^https?:\/\/video\.twimg\.com/,
  /^https?:\/\/platform\.twitter\.com\/embed/
];

let redirects = {
  "nitter": {
    "normal": [],
    "tor": []
  },
};
const getRedirects = () => redirects;

function getCustomRedirects() {
  return {
    "nitter": {
      "normal": [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects],
      "tor": [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects]
    },
  };
};

function setRedirects(val) {
  redirects.nitter = val;
  browser.storage.local.set({ twitterRedirects: redirects })
  console.log("twitterRedirects:", val)
  for (const item of nitterNormalRedirectsChecks)
    if (!redirects.nitter.normal.includes(item)) {
      var index = nitterNormalRedirectsChecks.indexOf(item);
      if (index !== -1) nitterNormalRedirectsChecks.splice(index, 1);
    }
  setNitterNormalRedirectsChecks(nitterNormalRedirectsChecks);

  for (const item of nitterTorRedirectsChecks)
    if (!redirects.nitter.tor.includes(item)) {
      var index = nitterTorRedirectsChecks.indexOf(item);
      if (index !== -1) nitterTorRedirectsChecks.splice(index, 1);
    }
  setNitterTorRedirectsChecks(nitterTorRedirectsChecks);
}

let nitterNormalRedirectsChecks;
const getNitterNormalRedirectsChecks = () => nitterNormalRedirectsChecks;
function setNitterNormalRedirectsChecks(val) {
  nitterNormalRedirectsChecks = val;
  browser.storage.local.set({ nitterNormalRedirectsChecks })
  console.log("nitterNormalRedirectsChecks: ", val)
}

let nitterNormalCustomRedirects = [];
const getNitterNormalCustomRedirects = () => nitterNormalCustomRedirects;
function setNitterNormalCustomRedirects(val) {
  nitterNormalCustomRedirects = val;
  browser.storage.local.set({ nitterNormalCustomRedirects })
  console.log("nitterNormalCustomRedirects: ", val)
}

let nitterTorRedirectsChecks;
const getNitterTorRedirectsChecks = () => nitterTorRedirectsChecks;
function setNitterTorRedirectsChecks(val) {
  nitterTorRedirectsChecks = val;
  browser.storage.local.set({ nitterTorRedirectsChecks })
  console.log("nitterTorRedirectsChecks: ", val)
}

let nitterTorCustomRedirects = [];
const getNitterTorCustomRedirects = () => nitterTorCustomRedirects;
function setNitterTorCustomRedirects(val) {
  nitterTorCustomRedirects = val;
  browser.storage.local.set({ nitterTorCustomRedirects })
  console.log("nitterTorCustomRedirects: ", val)
}

let disable;
const getDisable = () => disable;
function setDisable(val) {
  disable = val;
  browser.storage.local.set({ disableTwitter: disable })
}

let protocol;
const getProtocol = () => protocol;
function setProtocol(val) {
  protocol = val;
  browser.storage.local.set({ twitterProtocol: val })
  console.log("twitterProtocol: ", val)
}

let bypassWatchOnTwitter;
const getBypassWatchOnTwitter = () => bypassWatchOnTwitter;
function setBypassWatchOnTwitter(val) {
  bypassWatchOnTwitter = val;
  browser.storage.local.set({ bypassWatchOnTwitter })
  console.log("bypassWatchOnTwitter: ", bypassWatchOnTwitter)
}

let alwaysUsePreferred;

function redirect(url, initiator) {
  let protocolHost = `${url.protocol}//${url.host}`;
  let isNitter = [
    ...redirects.nitter.normal,
    ...redirects.nitter.tor
  ].includes(protocolHost);

  let isCheckedNitter = [
    ...nitterNormalRedirectsChecks,
    ...nitterNormalCustomRedirects,
    ...nitterTorRedirectsChecks,
    ...nitterTorCustomRedirects
  ].includes(protocolHost);

  if (alwaysUsePreferred && isNitter && !isCheckedNitter) return changeInstance(url);

  if (disable) return null;

  if (!targets.some((rx) => rx.test(url.href))) return null;

  if (url.pathname.split("/").includes("home")) return null;

  if (
    bypassWatchOnTwitter &&
    initiator &&
    [...redirects.nitter.normal,
    ...redirects.nitter.tor,
    ...nitterTorCustomRedirects,
    ...nitterNormalCustomRedirects
    ].includes(initiator.origin)

  ) return 'BYPASSTAB';

  let instancesList;
  if (protocol == 'normal')
    instancesList = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects];
  else if (protocol == 'tor')
    instancesList = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects];

  if (instancesList.length === 0) return null;
  let randomInstance = commonHelper.getRandomInstance(instancesList)

  if (url.host.split(".")[0] === "pbs" || url.host.split(".")[0] === "video")
    return `${randomInstance}/pic/${encodeURIComponent(url.href)}`;

  else if (url.pathname.split("/").includes("tweets"))
    return `${randomInstance}${url.pathname.replace("/tweets", "")}${url.search}`;

  else
    return `${randomInstance}${url.pathname}${url.search}`;
}

function changeInstance(url) {
  let protocolHost = `${url.protocol}//${url.host}`;

  let twitterList = [
    ...redirects.nitter.normal,
    ...redirects.nitter.tor,
    ...nitterNormalCustomRedirects,
    ...nitterTorCustomRedirects,
  ];

  if (!twitterList.includes(protocolHost)) return null;

  let instancesList;
  if (protocol == 'normal') instancesList = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects];
  else if (protocol == 'tor') instancesList = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects];

  console.log("instancesList", instancesList);
  let index = instancesList.indexOf(protocolHost);
  if (index > -1) instancesList.splice(index, 1);

  if (instancesList.length === 0) return null;

  let randomInstance = commonHelper.getRandomInstance(instancesList);
  return `${randomInstance}${url.pathname}${url.search}`;
}

function isNitter(url, type) {
  let protocolHost = `${url.protocol}//${url.host}`;

  if (type !== "main_frame" && type !== "sub_frame") return false;

  return [
    ...redirects.nitter.normal,
    ...redirects.nitter.tor,
    ...nitterNormalCustomRedirects,
    ...nitterTorCustomRedirects,
  ].includes(protocolHost);
}

let theme;
let applyThemeToSites;
function initNitterCookies(url) {
  let protocolHost = `${url.protocol}//${url.host}`;
  let themeValue;
  if (theme == 'light') themeValue = 'Twitter';
  if (theme == 'dark') themeValue = 'Twitter Dark';

  if (applyThemeToSites && themeValue != 'DEFAULT')
    browser.cookies.set({
      url: protocolHost,
      name: "theme",
      value: themeValue
    })
}

async function init() {
  return new Promise((resolve) => {
    fetch('/instances/data.json').then(response => response.text()).then(data => {
      let dataJson = JSON.parse(data);
      browser.storage.local.get(
        [
          "disableTwitter",

          "twitterRedirects",

          "theme",
          "applyThemeToSites",

          "nitterNormalRedirectsChecks",
          "nitterNormalCustomRedirects",

          "nitterTorRedirectsChecks",
          "nitterTorCustomRedirects",

          "twitterProtocol",

          "alwaysUsePreferred",
        ],
        r => {
          disable = r.disableTwitter ?? false;

          protocol = r.twitterProtocol ?? "normal";

          bypassWatchOnTwitter = r.bypassWatchOnTwitter ?? true;

          alwaysUsePreferred = r.alwaysUsePreferred ?? true;

          theme = r.theme ?? 'DEFAULT';
          applyThemeToSites = r.applyThemeToSites ?? false;

          redirects.nitter = dataJson.nitter;
          if (r.twitterRedirects) redirects = r.twitterRedirects;

          nitterNormalRedirectsChecks = r.nitterNormalRedirectsChecks ?? [...redirects.nitter.normal];
          nitterNormalCustomRedirects = r.nitterNormalCustomRedirects ?? [];

          nitterTorRedirectsChecks = r.nitterTorRedirectsChecks ?? [...redirects.nitter.tor];
          nitterTorCustomRedirects = r.nitterTorCustomRedirects ?? [];

          resolve();
        }
      );
    });
  });
}

export default {
  getRedirects,
  getCustomRedirects,
  setRedirects,

  getDisable,
  setDisable,

  getNitterNormalRedirectsChecks,
  setNitterNormalRedirectsChecks,

  getNitterNormalCustomRedirects,
  setNitterNormalCustomRedirects,

  getNitterTorRedirectsChecks,
  setNitterTorRedirectsChecks,

  getNitterTorCustomRedirects,
  setNitterTorCustomRedirects,

  getBypassWatchOnTwitter,
  setBypassWatchOnTwitter,

  getProtocol,
  setProtocol,

  isNitter,
  initNitterCookies,

  redirect,
  init,
  changeInstance,
};
