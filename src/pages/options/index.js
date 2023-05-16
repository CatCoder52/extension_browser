import utils from "../../assets/javascripts/utils.js"

let config,
	options,
	divs = {}

for (const a of document.getElementById("links").getElementsByTagName("a")) {
	if (!a.href.includes("https://")) {
		a.addEventListener("click", e => {
			const path = a.getAttribute("href").replace("#", "")
			loadPage(path)
			e.preventDefault()
		})
	}
}

config = await utils.getConfig()
options = await utils.getOptions()

async function changeFrontendsSettings(service) {
	options = await utils.getOptions()
	const opacityDiv = document.getElementById(`${service}-opacity`)
	if (document.getElementById(`${service}-enabled`).checked) {
		opacityDiv.style.pointerEvents = 'auto'
		opacityDiv.style.opacity = 1
		opacityDiv.style.userSelect = 'auto'
	} else {
		opacityDiv.style.pointerEvents = 'none'
		opacityDiv.style.opacity = 0.4
		opacityDiv.style.userSelect = 'none'
	}
	for (const frontend in config.services[service].frontends) {
		if (config.services[service].frontends[frontend].instanceList) {
			const frontendDiv = document.getElementById(frontend)
			if (typeof divs[service].frontend !== "undefined") {
				if (frontend == divs[service].frontend.value) {
					frontendDiv.style.display = ""
					console.log(config.services[service].frontends[frontend].localhost)
					if (config.services[service].frontends[frontend].localhost === true) {
						document.getElementById(`${service}-instance-div`).style.display = ""

						if (options[service].instance == "localhost") {
							frontendDiv.style.display = "none"
						}
					} else {
						document.getElementById(`${service}-instance-div`).style.display = "none"
					}
				} else {
					frontendDiv.style.display = "none"
				}
			}
		}
	}
	if (document.getElementById(`${service}-redirectType`)) {
		const frontend = options[service].frontend
		if (config.services[service].frontends[frontend].embeddable) {
			document.getElementById(`${service}-redirectType`).innerHTML = `
			<option value="both" data-localise="__MSG_both__">both</options>
			<option value="sub_frame" data-localise="__MSG_onlyEmbedded__">Only Embedded</option>
			<option value="main_frame" data-localise="__MSG_onlyNotEmbedded__">Only Not Embedded</option>
			`
			document.getElementById(`${service}-redirectType`).value = options[frontend].redirectType = options[service].redirectType
		} else {
			document.getElementById(`${service}-redirectType`).innerHTML =
				'<option value="main_frame" data-localise="__MSG_onlyNotEmbedded__">Only Not Embedded</option>'
			options[service].redirectType = "main_frame"
			browser.storage.local.set({ options })
		}
	}
	const frontend_name_element = document.getElementById(`${service}_page`).getElementsByClassName("frontend_name")[0]
	frontend_name_element.href = config.services[service].frontends[divs[service].frontend.value].url
}

async function loadPage(path) {
	for (const section of document.getElementById("pages").getElementsByTagName("section")) section.style.display = "none"
	document.getElementById(`${path}_page`).style.display = "block"

	for (const a of document.getElementById("links").getElementsByTagName("a")) {
		if (a.getAttribute("href") == `#${path}`) {
			a.classList.add("selected")
		} else {
			a.classList.remove("selected")
		}
	}

	window.history.pushState({ id: "100" }, "Page 2", `/pages/options/index.html#${path}`)

	if (path != 'general') {
		const service = path;

		divs[service] = {}
		options = await utils.getOptions()
		for (const option in config.services[service].options) {
			divs[service][option] = document.getElementById(`${service}-${option}`)
			if (typeof config.services[service].options[option] == "boolean") divs[service][option].checked = options[service][option]
			else divs[service][option].value = options[service][option]


			divs[service][option].addEventListener("change", async () => {
				let options = await utils.getOptions()
				if (typeof config.services[service].options[option] == "boolean")
					options[service][option] = divs[service][option].checked
				else
					options[service][option] = divs[service][option].value
				browser.storage.local.set({ options })
				changeFrontendsSettings(service)
			})
		}

		changeFrontendsSettings(service)


		for (const frontend in config.services[service].frontends) {
			if (config.services[service].frontends[frontend].instanceList) {
				processCustomInstances(frontend, document)
				document.getElementById(`ping-${frontend}`).addEventListener("click", async () => {
					document.getElementById(`ping-${frontend}`).getElementsByTagName('x')[0].innerHTML = "Pinging..."
					await ping(frontend)
					document.getElementById(`ping-${frontend}`).getElementsByTagName('x')[0].innerHTML = "Ping instances"
				})
			}
		}

		!async function () {
			const blacklist = await utils.getBlacklist(options)
			const redirects = await utils.getList(options)

			for (const frontend in config.services[service].frontends) {
				if (config.services[service].frontends[frontend].instanceList) {
					if (redirects == 'disabled' || blacklist == 'disabled') {
						document.getElementById(frontend).getElementsByClassName('clearnet')[0].style.display = 'none'
						document.getElementById(frontend).getElementsByClassName('ping')[0].style.display = 'none'
					}
					else if (!redirects || !blacklist) {
						document.getElementById(frontend)
							.getElementsByClassName('clearnet')[0]
							.getElementsByClassName("checklist")[0]
							.getElementsByClassName('loading')[0]
							.innerHTML = 'Could not fetch instances.'
					}
					else {
						createList(frontend, config.networks, document, redirects, blacklist)
					}
				}
			}
		}()
	}
}

async function calcCustomInstances(frontend) {
	let options = await utils.getOptions()
	let customInstances = options[frontend]
	document.getElementById(frontend).getElementsByClassName("custom-checklist")[0].innerHTML = customInstances
		.map(
			x => `
			<div>
				${x}
				<button class="add clear-${x}">
					<svg xmlns="https://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor">
						<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
					</svg>
				</button>
			</div>
			<hr>`
		)
		.join("\n")
	for (const item of customInstances) {
		document.getElementById(frontend).getElementsByClassName(`clear-${item}`)[0].addEventListener("click", async () => {
			const index = customInstances.indexOf(item)
			if (index > -1) customInstances.splice(index, 1)
			options = await utils.getOptions()
			options[frontend] = customInstances
			browser.storage.local.set({ options }, () => calcCustomInstances(frontend))
		})
	}
}

async function processCustomInstances(frontend, document) {
	calcCustomInstances(frontend)
	document.getElementById(frontend).getElementsByClassName("custom-instance-form")[0].addEventListener("submit", async event => {
		event.preventDefault()
		let options = await utils.getOptions()
		let customInstances = options[frontend]
		let frontendCustomInstanceInput = document.getElementById(frontend).getElementsByClassName("custom-instance")[0]
		let url
		try {
			url = new URL(frontendCustomInstanceInput.value)
		} catch (error) {
			return
		}
		let protocolHostVar = utils.protocolHost(url)
		if (frontendCustomInstanceInput.validity.valid) {
			if (!customInstances.includes(protocolHostVar)) {
				customInstances.push(protocolHostVar)
				options = await utils.getOptions()
				options[frontend] = customInstances
				browser.storage.local.set({ options }, () => {
					frontendCustomInstanceInput.value = ""
					calcCustomInstances(frontend)
				})
			}
		}
	})
}

function createList(frontend, networks, document, redirects, blacklist) {
	for (const network in networks) {
		const checklist = document.getElementById(frontend)
			.getElementsByClassName(network)[0]
			.getElementsByClassName("checklist")[0]

		if (!redirects[frontend]) {
			checklist.innerHTML = '<div class="some-block option-block">No instances found.</div>'
			break
		}

		const instances = redirects[frontend][network]
		if (!instances || instances.length === 0) continue

		document.getElementById(frontend)
			.getElementsByClassName("custom-instance")[0]
			.placeholder = redirects[frontend].clearnet[0]

		const sortedInstances = instances
			.sort((a, b) => {
				return (blacklist.cloudflare.includes(a) && !blacklist.cloudflare.includes(b))
			})

		const content = sortedInstances
			.map(x => {
				const cloudflare = blacklist.cloudflare.includes(x) ?
					`<a target="_blank" href="https://libredirect.github.io/docs.html#instances">
                        <span style="color:red;">cloudflare</span>
                    </a>` : ""

				const warnings = [cloudflare].join(" ")
				return `<div class="frontend">
                            <x>
                                <a href="${x}" target="_blank">${x}</a>
								${warnings}
                            </x>
                            <button class="add add-${x}">
                                <svg xmlns="https://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                            </button>
                        </div>`
			})

		checklist.innerHTML = [
			`<div class="some-block option-block">
                <h4>${utils.camelCase(network)}</h4>
            </div>`,
			...content,
			"<br>"
		].join("\n<hr>\n")

		for (const instance of instances) {
			checklist.getElementsByClassName(`add-${instance}`)[0]
				.addEventListener("click", async () => {
					let options = await utils.getOptions()
					if (!options[frontend].includes(instance)) {
						options[frontend].push(instance)
						browser.storage.local.set({ options }, () => calcCustomInstances(frontend))
					}
				})
		}
	}
}

const r = window.location.href.match(/#(.*)/)
if (r) loadPage(r[1])
else loadPage("general")

async function ping(frontend) {
	let instanceElements = document.getElementById(frontend)
		.getElementsByClassName('clearnet')[0]
		.getElementsByTagName('x')
	for (const element of instanceElements) {
		let span = element.getElementsByClassName('ping')[0]
		if (!span) span = document.createElement('span')
		span.classList = ['ping']
		span.innerHTML = '<span style="color:lightblue">pinging...</span>'
		element.appendChild(span)

		const href = element.getElementsByTagName('a')[0].href
		let time = await utils.ping(href)

		let color
		let text

		if (time < 5000) {
			text = `${time}ms`
			if (time <= 1000) color = "green"
			else if (time <= 2000) color = "orange"
		}
		else if (time >= 5000) {
			color = "red"
			if (time == 5000) text = "5000ms+"
			if (time > 5000) text = `Error: ${time - 5000}`
		}
		else {
			color = "red"
			text = 'Server not found'
		}

		span.innerHTML = `<span style="color:${color};">${text}</span>`

	}
}
