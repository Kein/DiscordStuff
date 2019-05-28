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
		this.BD = new BD2tools();
		this.hb = 0;
		this.chanEvent = 0;
		this.msgEvent = 0;
	}

	// Helpers
	findModuleByProps(...props)
	{
		return this.BD.WebpackModules.findByUniqueProperties(props);
	}

	findRInst(element)
	{
		return element[Object.keys(element).find(x => x.indexOf("Instance") > -1)];
	}


	// Main stuff
	Init()
	{
		this.cancelPatch = MonkeyTools.monkeyPatch(this.findModuleByProps("dispatch"), 'dispatch', { after: this.dispatch.bind(this) });
		window.addEventListener('message', ev => this.heartbeat(ev), false);
	}

	heartbeat(event)
	{
		if (event.source != window || event.origin !== window.origin)
    		return;
		this.hb = this.hb + (event.data.hasOwnProperty("id") && event.data.id  === undefined)
		if (this.hb == 2)
		{
			this.hb = -1;
			this.cancelPatch();
			document.getElementById("tEmbed_injected").remove();
			document.getElementById("tEmbed_GlobalStyle").remove();
			console.log("[toggleEmbed]: content script appears to be orphaned, disabling monkeyPatch, cleaning up!")
		}
	}

	updateDOM(ms)
	{
		const self = this;
		setTimeout(function()
		{
			const ctns = document.getElementsByClassName("embed-IeVjo6");
			for (let i = ctns.length - 1; i >= 0; i--)
			{
				const curr = ctns[i];
				if (!curr.querySelector(".toggleEmbed_button"))
				{
					curr.prepend(self.makeButton());
					curr.prepend(self.makeIcon(curr));
				}
			}
		}, ms);
	}

	makeIcon(embedElm)
	{
		const prv = document.createElement("div");
		const rInst = this.findRInst(embedElm);
		if (rInst)
		{
			const tag = rInst.stateNode.className.indexOf("spoilerAttachment") > -1
						? rInst.return.firstEffect.elementType
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
		button.addEventListener("click", event => this.clF(event), false);
	  	return button;
	}

	clF(event)
	{
		const me = event.target;
		if (me.parentElement.className.indexOf('embed-IeVjo6') > -1)
		{
			const embParent = me.parentElement;
			if (embParent.style.visibility === "hidden" || embParent.style.visibility === "")
			{
				embParent.style.visibility = "visible";
				embParent.style.height = "100%";
				me.innerText = "−";
				const latest = embParent.closest(".container-1YxwTf");
				const msgWrpInst = this.findRInst(document.querySelector(".messagesWrapper-3lZDfY"));
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
		const DOMmessages = document.getElementsByClassName("message-1PNnaP");
		for (let i = DOMmessages.length - 1; i >= 0; i--)
		{
			const DOMmsg = DOMmessages[i];
			const id = this.findRInst(DOMmsg).return.key;
			if (message.id === id)
			{
				const msgs = DOMmsg.getElementsByClassName("embed-IeVjo6");
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
							const tag = rInst.stateNode.className.indexOf("spoilerAttachment") > -1
										? rInst.return.firstEffect.elementType
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
			case "CHANNEL_SELECT":
				this.chanEvent = 1;
				break;

			case "LOAD_MESSAGES_SUCCESS":
			case "LOAD_MESSAGES_SUCCESS_CACHED":
				this.updateDOM(100);
				break;

			case "UPDATE_CHANNEL_DIMENSIONS":
				if (this.chanEvent)
				{
					this.chanEvent = 0;
					this.updateDOM(0);
				}
				break;

			case "MESSAGE_UPDATE":
			case "MESSAGE_CREATE":
			{
				const message = data.methodArguments[0].message;
				const msgWrpInst = this.findRInst(document.querySelector(".messagesWrapper-3lZDfY"));
				if (message.embeds.length < 1 || !msgWrpInst.return.memoizedProps.channel.id || msgWrpInst.return.memoizedProps.channel.id !== message.channel_id)
					return;

				setTimeout(() => this.processMessage(message), 0);
			}
		}
	}
}

let s = new toggleMain();
s.Init();

}());
