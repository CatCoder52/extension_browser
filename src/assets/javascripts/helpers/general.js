"use strict";
window.browser = window.browser || window.chrome;

let theme;
const getTheme = () => theme;
function setTheme(val) {
    theme = val
    browser.storage.local.set({ theme, instancesCookies: [] });
    console.log("theme: ", theme)
}

let exceptions = {
    "url": [],
    "regex": [],
};
const getExceptions = () => exceptions;
function setExceptions(val) {
    exceptions = val;
    browser.storage.local.set({ exceptions })
    console.log("exceptions: ", val)
}

let autoRedirect;
const getAutoRedirect = () => autoRedirect;
function setAutoRedirect(val) {
    autoRedirect = val;
    browser.storage.local.set({ autoRedirect })
    console.log("autoRedirect: ", val)
}

function isException(url) {
    for (const item of exceptions.url) {
        console.log(item, `${url.protocol}//${url.host}`)
        if (item == `${url.protocol}//${url.host}`) return true;
    }
    for (const item of exceptions.regex)
        if (new RegExp(item).test(url.href)) return true;
    return false;
}

async function init() {
    return new Promise(
        resolve => browser.storage.local.get(
            [
                "exceptions",
                "theme",
                "popupFrontends",
                "autoRedirect"
            ],
            r => {
                if (r.exceptions) exceptions = r.exceptions;

                theme = r.theme ?? "DEFAULT"

                popupFrontends = r.popupFrontends ?? [
                    "youtube",
                    "twitter",
                    "instagram",
                    "tikTok",
                    "imgur",
                    "reddit",
                    "search",
                    "medium",
                    "translate",
                    "maps",
                ];

                autoRedirect = r.autoRedirect ?? false;

                resolve();
            }
        )
    )
}


let popupFrontends;
const getPopupFrontends = () => popupFrontends;
function setPopupFrontends(val) {
    popupFrontends = val;
    browser.storage.local.set({ popupFrontends })
    console.log("popupFrontends: ", val)
}

let allPopupFrontends = [
    "youtube",
    "youtubeMusic",
    "twitter",
    "instagram",
    "tikTok",
    "imgur",
    "reddit",
    "search",
    "translate",
    "maps",
    "wikipedia",
    "medium",
    "peertube",
    "lbry",
    "sendTargets"
];


export default {
    getExceptions,
    setExceptions,

    getAutoRedirect,
    setAutoRedirect,

    getPopupFrontends,
    setPopupFrontends,

    allPopupFrontends,

    getTheme,
    setTheme,

    isException,
    init,
}
