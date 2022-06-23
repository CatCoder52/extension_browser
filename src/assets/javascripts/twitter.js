window.browser = window.browser || window.chrome;

import utils from './utils.js'

const targets = [
  /^https?:\/{2}(www\.|mobile\.|)twitter\.com/,
  /^https?:\/{2}(pbs\.|video\.|)twimg\.com/,
  /^https?:\/{2}platform\.twitter\.com\/embed/,
  /^https?:\/{2}t\.co/
];

let redirects = {
  "nitter": {
    "normal": [],
    "tor": []
  },
};

function setRedirects(val) {
  browser.storage.local.get(['cloudflareBlackList', 'authenticateBlackList'], r => {
    redirects.nitter = val;
    nitterNormalRedirectsChecks = [...redirects.nitter.normal];
    for (const instance of [...r.cloudflareBlackList, ...r.authenticateBlackList]) {
      let i = nitterNormalRedirectsChecks.indexOf(instance);
      if (i > -1) nitterNormalRedirectsChecks.splice(i, 1);
    }
    browser.storage.local.set({
      twitterRedirects: redirects,
      nitterNormalRedirectsChecks,
      nitterTorRedirectsChecks: [...redirects.nitter.tor]
    })
  })
}

let
  disableTwitter,
  twitterProtocol,
  twitterRedirects,
  twitterRedirectType,
  nitterNormalRedirectsChecks,
  nitterNormalCustomRedirects,
  nitterTorRedirectsChecks,
  nitterTorCustomRedirects;

function init() {
  return new Promise(async resolve => {
    browser.storage.local.get(
      [
        "disableTwitter",
        "twitterProtocol",
        "twitterRedirects",
        "twitterRedirectType",
        "nitterNormalRedirectsChecks",
        "nitterNormalCustomRedirects",
        "nitterTorRedirectsChecks",
        "nitterTorCustomRedirects",
      ],
      r => {
        disableTwitter = r.disableTwitter;
        twitterProtocol = r.twitterProtocol;
        twitterRedirects = r.twitterRedirects;
        twitterRedirectType = r.twitterRedirectType;
        nitterNormalRedirectsChecks = r.nitterNormalRedirectsChecks;
        nitterNormalCustomRedirects = r.nitterNormalCustomRedirects;
        nitterTorRedirectsChecks = r.nitterTorRedirectsChecks;
        nitterTorCustomRedirects = r.nitterTorCustomRedirects;
        resolve();
      }
    )
  })
}

init();
browser.storage.onChanged.addListener(init)

function all() {
  return [
    ...nitterNormalRedirectsChecks,
    ...nitterTorRedirectsChecks,
    ...nitterNormalCustomRedirects,
    ...nitterTorCustomRedirects,
  ];
}

function redirect(url, type, initiator, disableOverride) {
  if (disableTwitter && !disableOverride) return;
  if (!targets.some(rx => rx.test(url.href))) return;
  if (url.pathname.split("/").includes("home")) return;
  if (initiator && all().includes(initiator.origin)) return 'BYPASSTAB';
  if (twitterRedirectType == 'sub_frame' && type == "main_frame") return;
  if (twitterRedirectType == 'main_frame' && type != "main_frame") return;

  let instancesList;
  if (twitterProtocol == 'normal') instancesList = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects];
  else if (twitterProtocol == 'tor') instancesList = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects];
  if (instancesList.length === 0) return;

  const randomInstance = utils.getRandomInstance(instancesList);
  // https://pbs.twimg.com/profile_images/648888480974508032/66_cUYfj_400x400.jpg
  if (url.host.split(".")[0] === "pbs" || url.host.split(".")[0] === "video") {
    const [, id, format, extra] = url.search.match(/(.*)\?format=(.*)&(.*)/);
    const query = encodeURIComponent(`${id}.${format}?${extra}`);
    return `${randomInstance}/pic${url.pathname}${query}`;
  }
  else if (url.pathname.split("/").includes("tweets"))
    return `${randomInstance}${url.pathname.replace("/tweets", "")}${url.search}`;
  else if (url.host == 't.co')
    return `${randomInstance}/t.co${url.pathname}`;
  else
    return `${randomInstance}${url.pathname}${url.search}`;
}

function reverse(url) {
  return new Promise(async resolve => {
    await init();
    const protocolHost = utils.protocolHost(url);
    if (!all().includes(protocolHost)) { resolve(); return; }
    resolve(`https://twitter.com${url.pathname}${url.search}`);
  })
}

function switchInstance(url, disableOverride) {
  return new Promise(async resolve => {
    await init();
    if (disableTwitter && !disableOverride) { resolve(); return; }
    const protocolHost = utils.protocolHost(url);
    if (!all().includes(protocolHost)) { resolve(); return; }
    let instancesList;
    if (twitterProtocol == 'normal') instancesList = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects];
    else if (twitterProtocol == 'tor') instancesList = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects];

    let index = instancesList.indexOf(protocolHost);
    if (index > -1) instancesList.splice(index, 1);
    if (instancesList.length === 0) { resolve(); return; }

    const randomInstance = utils.getRandomInstance(instancesList);
    resolve(`${randomInstance}${url.pathname}${url.search}`);
  })
}

function removeXFrameOptions(e) {
  if (e.type != 'sub_frame') return;
  let url = new URL(e.url);
  let protocolHost = utils.protocolHost(url);
  if (!all().includes(protocolHost)) return;
  let isChanged = false;
  for (const i in e.responseHeaders) {
    if (e.responseHeaders[i].name == 'x-frame-options') {
      e.responseHeaders.splice(i, 1);
      isChanged = true;
    }
    else if (e.responseHeaders[i].name == 'content-security-policy') {
      e.responseHeaders.splice(i, 1);
      isChanged = true;
    }
  }
  if (isChanged) return { responseHeaders: e.responseHeaders };
}

function initNitterCookies(test, from) {
  return new Promise(async resolve => {
    await init();
    const protocolHost = utils.protocolHost(from);
    if (!all().includes(protocolHost)
    ) { resolve(); return; }
    if (!test) {
      let checkedInstances;
      if (twitterProtocol == 'normal') checkedInstances = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects]
      else if (twitterProtocol == 'tor') checkedInstances = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects]
      await utils.copyCookie('nitter', from, checkedInstances, 'theme');
      await utils.copyCookie('nitter', from, checkedInstances, 'infiniteScroll');
      await utils.copyCookie('nitter', from, checkedInstances, 'stickyProfile');
      await utils.copyCookie('nitter', from, checkedInstances, 'bidiSupport');
      await utils.copyCookie('nitter', from, checkedInstances, 'hideTweetStats');
      await utils.copyCookie('nitter', from, checkedInstances, 'hideBanner');
      await utils.copyCookie('nitter', from, checkedInstances, 'hidePins');
      await utils.copyCookie('nitter', from, checkedInstances, 'hideReplies');
      await utils.copyCookie('nitter', from, checkedInstances, 'squareAvatars');
      await utils.copyCookie('nitter', from, checkedInstances, 'mp4Playback');
      await utils.copyCookie('nitter', from, checkedInstances, 'hlsPlayback');
      await utils.copyCookie('nitter', from, checkedInstances, 'proxyVideos');
      await utils.copyCookie('nitter', from, checkedInstances, 'muteVideos');
      await utils.copyCookie('nitter', from, checkedInstances, 'autoplayGifs');

      await utils.copyCookie('nitter', from, checkedInstances, 'replaceInstagram');
      await utils.copyCookie('nitter', from, checkedInstances, 'replaceReddit');
      await utils.copyCookie('nitter', from, checkedInstances, 'replaceTwitter');
      await utils.copyCookie('nitter', from, checkedInstances, 'replaceYouTube');
    }
    resolve(true);
  })
}

function pasteNitterCookies() {
  return new Promise(async resolve => {
    await init();
    if (disableTwitter || twitterProtocol === undefined) { resolve(); return; }
    let checkedInstances;
    if (twitterProtocol == 'normal') checkedInstances = [...nitterNormalRedirectsChecks, ...nitterNormalCustomRedirects]
    else if (twitterProtocol == 'tor') checkedInstances = [...nitterTorRedirectsChecks, ...nitterTorCustomRedirects]
    utils.getCookiesFromStorage('nitter', checkedInstances, 'theme');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'infiniteScroll');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'stickyProfile');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'bidiSupport');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'hideTweetStats');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'hideBanner');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'hidePins');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'hideReplies');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'squareAvatars');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'mp4Playback');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'hlsPlayback');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'proxyVideos');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'muteVideos');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'autoplayGifs');

    utils.getCookiesFromStorage('nitter', checkedInstances, 'replaceInstagram');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'replaceReddit');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'replaceTwitter');
    utils.getCookiesFromStorage('nitter', checkedInstances, 'replaceYouTube');
    resolve();
  }
  )
}

function initDefaults() {
  return new Promise(resolve => {
    fetch('/instances/data.json').then(response => response.text()).then(data => {
      let dataJson = JSON.parse(data);
      redirects.nitter = dataJson.nitter;
      browser.storage.local.get(['cloudflareBlackList', 'authenticateBlackList'], async r => {
        nitterNormalRedirectsChecks = [...redirects.nitter.normal];
        for (const instance of [...r.cloudflareBlackList, ...r.authenticateBlackList]) {
          let i = nitterNormalRedirectsChecks.indexOf(instance);
          if (i > -1) nitterNormalRedirectsChecks.splice(i, 1);
        }
        browser.storage.local.set({
          disableTwitter: false,
          twitterRedirects: redirects,
          twitterProtocol: "normal",
          twitterRedirectType: "both",

          nitterNormalRedirectsChecks: nitterNormalRedirectsChecks,
          nitterNormalCustomRedirects: [],

          nitterTorRedirectsChecks: [...redirects.nitter.tor],
          nitterTorCustomRedirects: [],
        }, () => resolve());
      })
    })
  })
}

export default {
  setRedirects,
  redirect,
  switchInstance,
  reverse,
  removeXFrameOptions,
  initNitterCookies,
  pasteNitterCookies,
  initDefaults,
};
