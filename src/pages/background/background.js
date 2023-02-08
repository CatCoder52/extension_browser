"use strict"

import generalHelper from "../../assets/javascripts/general.js"
import utils from "../../assets/javascripts/utils.js"
import servicesHelper from "../../assets/javascripts/services.js"

window.browser = window.browser || window.chrome

browser.runtime.onInstalled.addListener(async details => {
	if (details.previousVersion != browser.runtime.getManifest().version) {
		// ^Used to prevent this running when debugging with auto-reload
		if (details.reason == "install") {
			if (!(await utils.getOptions())) {
				await servicesHelper.initDefaults()
			}
			browser.runtime.openOptionsPage()
		}
		else if (details.reason == "update") {
			if (details.previousVersion == '2.5.2') {
				await servicesHelper.upgradeOptions()
			} else {
				await servicesHelper.processUpdate()
			}
		}
	}
})

let tabIdRedirects = {}

// true == Always redirect, false == Never redirect, null/undefined == follow options for services
browser.webRequest.onBeforeRequest.addListener(
	details => {
		const url = new URL(details.url)
		if (new RegExp(/^chrome-extension:\/{2}.*\/instances\/.*.json$/).test(url.href) && details.type == "xmlhttprequest") return
		let initiator
		try {
			if (details.originUrl) initiator = new URL(details.originUrl)
			else if (details.initiator) initiator = new URL(details.initiator)
		} catch {
			return null
		}
		if (tabIdRedirects[details.tabId] == false) return null
		let newUrl = servicesHelper.redirect(url, details.type, initiator, tabIdRedirects[details.tabId], details.tabId)

		if (details.frameAncestors && details.frameAncestors.length > 0 && generalHelper.isException(new URL(details.frameAncestors[0].url))) newUrl = null

		if (generalHelper.isException(url)) {
			if (details.type == "main_frame")
				newUrl = "BYPASSTAB"
			else
				return null
		}

		if (newUrl) {
			if (newUrl === "CANCEL") {
				console.log(`Canceled ${url}`)
				return { cancel: true }
			}
			if (newUrl === "BYPASSTAB") {
				console.log(`Bypassed ${details.tabId} ${url}`)
				if (tabIdRedirects[details.tabId] != false) tabIdRedirects[details.tabId] = false
				return null
			}
			console.info("Redirecting", url.href, "=>", newUrl)
			return { redirectUrl: newUrl }
		}
		return null
	},
	{ urls: ["<all_urls>"] },
	["blocking"]
)

browser.tabs.onRemoved.addListener(tabId => {
	if (tabIdRedirects[tabId] != undefined) {
		delete tabIdRedirects[tabId]
		console.log("Removed tab " + tabId + " from tabIdRedirects")
	}
})

browser.commands.onCommand.addListener(async command => {
	browser.tabs.query({ active: true, currentWindow: true }, async tabs => {
		const url = new URL(tabs[0].url)
		if (command == "switchInstance") {
			const newUrl = await servicesHelper.switchInstance(url)
			if (newUrl) browser.tabs.update({ url: newUrl })
		}
		else if (command == "copyRaw") {
			servicesHelper.copyRaw(url)
		}
	})
})

browser.contextMenus.create({
	id: "settings",
	title: browser.i18n.getMessage("settings"),
	contexts: ["browser_action"],
})

browser.contextMenus.create({
	id: "switchInstance",
	title: browser.i18n.getMessage("switchInstance"),
	contexts: ["browser_action"],
})

browser.contextMenus.create({
	id: "copyReverse",
	title: 'Copy reverse',
	contexts: ["browser_action"],
})

browser.contextMenus.create({
	id: "redirectTab",
	title: 'Redirect',
	contexts: ["browser_action"],
})

browser.contextMenus.create({
	id: "reverseTab",
	title: 'Reverse redirect',
	contexts: ["browser_action"],
})

browser.contextMenus.create({
	id: "redirectLink",
	title: 'Redirect',
	contexts: ["link"],
})

browser.contextMenus.create({
	id: "reverseLink",
	title: 'Reverse redirect',
	contexts: ["link"],
})

browser.contextMenus.create({
	id: "copyReverseLink",
	title: 'Copy Reverse',
	contexts: ["link"],
})

browser.contextMenus.create({
	id: "redirectBookmark",
	title: 'Redirect',
	contexts: ["bookmark"],
})

browser.contextMenus.create({
	id: "reverseBookmark",
	title: 'Reverse redirect',
	contexts: ["bookmark"],
})

browser.contextMenus.create({
	id: "copyReverseBookmark",
	title: 'Copy Reverse',
	contexts: ["bookmark"],
})


browser.contextMenus.onClicked.addListener(async (info) => {
	switch (info.menuItemId) {
		case 'switchInstance': {
			const url = new URL(info.pageUrl)
			const newUrl = await servicesHelper.switchInstance(url)
			if (newUrl) {
				browser.tabs.update({ url: newUrl })
			}
			return
		}
		case 'settings': {
			browser.runtime.openOptionsPage()
			return
		}
		case 'copyReverse': {
			const url = new URL(info.pageUrl)
			servicesHelper.copyRaw(url)
			return
		}
		case 'reverseTab': {
			const url = new URL(info.pageUrl)
			const newUrl = await servicesHelper.reverse(url)
			if (newUrl) {
				browser.tabs.create({ url: newUrl }, tab => {
					tabIdRedirects[tab.id] = false
				})
			}
			return
		}
		case 'redirectTab': {
			const url = new URL(info.pageUrl)
			const newUrl = servicesHelper.redirect(url, "main_frame", null, true)
			if (newUrl) {
				browser.tabs.create({ url: newUrl }, tab => {
					tabIdRedirects[tab.id] = false
				})
			}
			return
		}

		case 'copyReverseLink': {
			const url = new URL(info.linkUrl)
			servicesHelper.copyRaw(url)
			return
		}
		case 'redirectLink': {
			const url = new URL(info.linkUrl)
			const newUrl = servicesHelper.redirect(url, "main_frame", null, true)
			if (newUrl) browser.tabs.create({ url: newUrl })
			return
		}
		case 'reverseLink': {
			const url = new URL(info.linkUrl)
			const newUrl = await servicesHelper.reverse(url)
			if (newUrl) {
				browser.tabs.create({ url: newUrl }, tab => {
					tabIdRedirects[tab.id] = false
				})
			}
			return
		}

		case 'copyReverseBookmark': {
			browser.bookmarks.get(info.bookmarkId, bookmarks => {
				const url = new URL(bookmarks[0].url)
				servicesHelper.copyRaw(url)
			});
			return
		}
		case 'redirectBookmark': {
			browser.bookmarks.get(info.bookmarkId, bookmarks => {
				const url = new URL(bookmarks[0].url)
				const newUrl = servicesHelper.redirect(url, "main_frame", null, true)
				if (newUrl) browser.tabs.create({ url: newUrl })
			})
			return
		}
		case 'reverseBookmark': {
			browser.bookmarks.get(info.bookmarkId, async bookmarks => {
				const url = new URL(bookmarks[0].url)
				const newUrl = await servicesHelper.reverse(url)
				if (newUrl) {
					browser.tabs.update({ url: newUrl }, tab => {
						tabIdRedirects[tab.id] = false
					})
				}
			})
			return
		}

	}
})

browser.webRequest.onHeadersReceived.addListener(
	e => {
		let response = servicesHelper.modifyContentSecurityPolicy(e)
		if (!response) response = servicesHelper.modifyContentSecurityPolicy(e)
		return response
	},
	{ urls: ["<all_urls>"] },
	["blocking", "responseHeaders"]
)
