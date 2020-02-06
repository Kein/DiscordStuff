( function() {

console.log("[toggleEmbed]: ToggleEmbed v0.2 for Discord loaded");

class BD2tools {
    constructor() {
        this.WebpackModules = (() => {
            const req = webpackJsonp.push([[], {__extra_id__: (module, exports, req) => module.exports = req}, [["__extra_id__"]]]);
            delete req.m.__extra_id__;
            delete req.c.__extra_id__;
            const find = (filter) => {
                for (let i in req.c) {
                    if (req.c.hasOwnProperty(i)) {
                        let m = req.c[i].exports;
                        if (m && m.__esModule && m.default && filter(m.default)) return m.default;
                        if (m && filter(m))	return m;
                    }
                }
                console.warn("Cannot find loaded module in cache");
                return null;
            };

            const findAll = (filter) => {
                const modules = [];
                for (let i in req.c) {
                    if (req.c.hasOwnProperty(i)) {
                        let m = req.c[i].exports;
                        if (m && m.__esModule && m.default && filter(m.default)) modules.push(m.default);
                        else if (m && filter(m)) modules.push(m);
                    }
                }
                return modules;
            };

            const findByUniqueProperties = (propNames) => find(module => propNames.every(prop => module[prop] !== undefined));
            const findByDisplayName = (displayName) => find(module => module.displayName === displayName);

            return {find, findAll, findByUniqueProperties, findByDisplayName};
        })();
    }
}


class MonkeyTools {

	static suppressErrors(method, message) {
		return (...params) => {
			try { return method(...params);	}
			catch (e) { console.error("Error occurred in " + message, e); }
		};
	}

	static monkeyPatch(what, methodName, options) {
		const {before, after, instead, once = false, silent = false, force = false} = options;
		const displayName = options.displayName || what.displayName || what.name || what.constructor.displayName || what.constructor.name;
		if (!silent) console.log("patch", methodName, "of", displayName);
		if (!what[methodName]) {
			if (force) what[methodName] = function() {};
			else return console.error(methodName, "does not exist for", displayName);
		}
		const origMethod = what[methodName];
		const cancel = () => {
			if (!silent) console.log("unpatch", methodName, "of", displayName);
			what[methodName] = origMethod;
		};
		what[methodName] = function() {
			const data = {
				thisObject: this,
				methodArguments: arguments,
				cancelPatch: cancel,
				originalMethod: origMethod,
				callOriginalMethod: () => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)
			};
			if (instead) {
				const tempRet = MonkeyTools.suppressErrors(instead, "`instead` callback of " + what[methodName].displayName)(data);
				if (tempRet !== undefined) data.returnValue = tempRet;
			}
			else {
				if (before) MonkeyTools.suppressErrors(before, "`before` callback of " + what[methodName].displayName)(data);
				data.callOriginalMethod();
				if (after) MonkeyTools.suppressErrors(after, "`after` callback of " + what[methodName].displayName)(data);
			}
			if (once) cancel();
			return data.returnValue;
		};
		what[methodName].__monkeyPatched = true;
		if (!what[methodName].__originalMethod) what[methodName].__originalMethod = origMethod;
		what[methodName].displayName = "patched " + (what[methodName].displayName || methodName);
		return cancel;
	}
}


class toggleMain {

	constructor()
	{
		//Body
		this.BD = new BD2tools();
		this.hb = 0;
		this.chanEvent = 0;
		this.activeGuild = null;
		this.activeChan = null;
		this.eventParent = null;
		this.clF = this.clF.bind(this);
		// Constants... kinda
		this.selectors =
		{
			chanNode: ".messagesWrapper-3lZDfY",
			searchNode: ".searchResultsWrap-2DKFzt",
			messagesClass: "message-2qnXI6",
			embedContainer: "embed-IeVjo6",
			messagesNode: ".messages-3amgkR",
			messageWrapper: ".messagesWrapper-3lZDfY",
			messageContainer: ".container-3FojY8"
		};
	}

	// Helpers
	findModuleByProps(...props)
	{
		return this.BD.WebpackModules.findByUniqueProperties(props);
	}

	findRInst(element)
	{
		let i = Object.keys(element).find(x => x.indexOf("reactInternalInstance") > -1);
		return i ? element[i] : undefined;
	}

	getRootNode(name)
	{
		return name == "chan" ? this.selectors.chanNode : this.selectors.searchNode;
	}


	// Main stuff
	Init()
	{
		this.cancelPatch = MonkeyTools.monkeyPatch(this.findModuleByProps("dispatch"), 'dispatch', { after: this.dispatch.bind(this) });
		window.addEventListener('message', this.heartbeat, false);
	}

	SelectorTest()
	{

	}

	Destroy()
	{
		this.cancelPatch();
		window.removeEventListener('message', this.heartbeat, false);
		if (this.eventParent)
			this.eventParent.removeEventListener("click", this.clF, false);
		document.getElementById("tEmbed_injected").remove();
		document.getElementById("tEmbed_GlobalStyle").remove();
				console.log("[toggleEmbed]: content script appears to be orphaned, disabling monkeyPatch, cleaning up!");
	}

	heartbeat(event)
	{
		if (event.source != window || event.origin !== window.origin)
    		return;
		this.hb = this.hb + (event.data.hasOwnProperty("id") && event.data.id  === undefined);
		if (this.hb == 2)
		{
			this.hb = -1;
			this.Destroy();
		}
	}

	setChanEvent(eventData)
	{	 //being explicit because this is finnicky
		 return this.activeChan == null && eventData.channelId != null ? 2 // switch from non-chat tab to chat tab
				: eventData.channelId != null && this.activeChan != null ? 1 // channel switch
				: 0; 
	}

	updateDOM(root, ms, chanEvent)
	{
		if (chanEvent > 0)
			this.updateListener();

		const self = this;
		setTimeout(function()
		{
			const node = document.querySelector(self.getRootNode(root));
			if (node)
			{
				const ctns = node.getElementsByClassName(self.selectors.embedContainer);
				for (let i = ctns.length - 1; i >= 0; i--)
				{
					const curr = ctns[i];
					if (!curr.querySelector(".toggleEmbed_button"))
					{
						curr.prepend(self.makeButton());
						curr.prepend(self.makeIcon(curr));
					}
				}
			}
		}, ms);
	}

	updateListener()
	{
		if (this.eventParent)
			this.eventParent.removeEventListener("click", this.clF, false);
		this.eventParent = document.body.querySelector(this.selectors.messagesNode);
		if (this.eventParent)
		{
			this.eventParent.removeEventListener("click", this.clF, false);
			this.eventParent.addEventListener("click", this.clF, false);
		}
	}

	makeIcon(embedElm)
	{
		const prv = document.createElement("div");
		const rInst = this.findRInst(embedElm);
		if (rInst)
		{
			const tag = rInst.stateNode.className.indexOf("spoiler") > -1
						? "spoiler"
						: rInst.return.memoizedProps.embed.type;
			prv.className = ["toggleEmbed_prv ", "tglEmbd_", tag].join('');
		}
		return prv;
	}

	makeButton()
	{
		const button = document.createElement("button");
		button.innerText = "+";
		button.setAttribute("class", "toggleEmbed_button");
	  	return button;
	}

	clF()
	{
		const me = event.target;
		if (me.className === "toggleEmbed_button" && me.parentElement && me.parentElement.className.indexOf(this.selectors.embedContainer) > -1)
		{
			const embParent = me.parentElement;
			if (embParent.style.visibility === "hidden" || embParent.style.visibility === "")
			{
				embParent.style.visibility = "visible";
				embParent.style.height = "100%";
				me.innerText = "−";
				const latest = embParent.closest(this.selectors.messageContainer);
				const msgWrpInst = this.findRInst(document.querySelector(this.selectors.messageWrapper));
				if (msgWrpInst)
					msgWrpInst.return.stateNode.forceUpdate();
				if (!latest.nextElementSibling)
					latest.parentElement.scrollTop = latest.parentElement.scrollHeight;
			}
			else
			{
				embParent.style.visibility = "hidden";
				embParent.style.height = "";
				me.innerText = "+";
			}
		}
	}

	processMessage(message)
	{
		const DOMmessages = document.getElementsByClassName(this.selectors.messagesClass);
		for (let i = DOMmessages.length - 1; i >= 0; i--)
		{
			const DOMmsg = DOMmessages[i];
			const inst = this.findRInst(DOMmsg);
			const id = inst.return.key == null ? inst.return.return.key : inst.return.key;
			if (message.id === id)
			{
				const msgs = DOMmsg.getElementsByClassName(this.selectors.embedContainer);
				for (let k = 0; k < msgs.length; k++)
				{
					let em = msgs[k];
					if (!em.querySelector(".toggleEmbed_button"))
						em.prepend(this.makeButton());

					const prv = em.querySelector(".toggleEmbed_prv");
					if (!prv)
					{
						em.prepend(this.makeIcon(em));
					}
					else
					{
						const rInst = this.findRInst(em);
						if (rInst)
						{
							const tag = rInst.stateNode.className.indexOf("spoiler") > -1
										? "spoiler"
										: rInst.return.memoizedProps.embed.type;
							prv.className = ["toggleEmbed_prv ", "tglEmbd_", tag].join('');
						}
					}
				}
			}
		}
	}

	dispatch(data)
	{
		const event = data.methodArguments[0].type;
		switch(event)
		{
			case "SESSIONS_REPLACE":
					this.updateListener();
					break;

			case "CHANNEL_SELECT":
				const eventData = data.methodArguments[0];
				this.chanEvent = this.setChanEvent(eventData);
				if (!this.chanEvent && this.eventParent) // currently it always null for ServerDiscovery and DM/PM
				{
					this.eventParent.removeEventListener("click", this.clF, false);
					this.eventParent = null;
				}
				this.activeGuild = eventData.guildId;
				this.activeChan = eventData.channelId;
				break;

			case "LOAD_MESSAGES_SUCCESS":
			case "LOAD_MESSAGES_SUCCESS_CACHED":
				this.updateDOM("chan", 100, 0);
				break;

			case "UPDATE_CHANNEL_DIMENSIONS": 
				if (this.chanEvent) //only update all messages if we switched
				{
					this.updateDOM("chan", 0, this.chanEvent);
					this.chanEvent = 0;
				}
				break;

			case "SEARCH_FINISH":
				if (data.methodArguments[0].totalResults > 1)
					this.updateDOM("search", 50, 0);
				break;

			case "MESSAGE_UPDATE":
			case "MESSAGE_CREATE":
			{
				const message = data.methodArguments[0].message;
				if (message.embeds.length < 1 || this.activeChan != message.channel_id)
					return;

				setTimeout(() => this.processMessage(message), 0);
			}
		}
	}
}

let s = new toggleMain();
s.Init();

}());
