'use strict';

let rpm = 0;
let hbeat;
let runtimeObj = chrome && chrome.runtime ? chrome.runtime : browser.runtime;

// Orphan checks
function pulse()
{
	window.postMessage({ id: runtimeObj.id, timestamp: Date.now()}, "https://discordapp.com");
	rpm = rpm + (runtimeObj.id === undefined);
	if (rpm > 2)
	{
		clearInterval(hbeat);
		hbeat = null;
	}
}

// Shortcut helper
function isElementInViewport (el)
{
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

// Injecting the main script into the page
if (!document.getElementById("tEmbed_injected"))
{
	const script = document.createElement('script');
	script.id = 'tEmbed_injected';
	script.type = 'text/javascript';
	script.className = chrome.runtime.id;
	script.src = chrome.runtime.getURL('inject.js');
	document.head.appendChild(script);
	console.log("[toggleEmbed]: Page worker script injected.")

	if (!document.getElementById("tEmbed_GlobalStyle"))
	{
		const style = document.createElement("link");
		style.id = "tEmbed_GlobalStyle";
		style.type = "text/css";
		style.href = chrome.extension.getURL("css/tgEmbed.css");
		style.rel = "stylesheet";
		document.head.appendChild(style);
		console.log("[toggleEmbed]: Custom page style injected.")
	}

	hbeat = setInterval(pulse, 25000);
}
else { console.log("[toggleEmbed]: skipping injection because old script found"); }

document.addEventListener("keydown", function(event)
{
	if(event.ctrlKey && event.keyCode == 81)
	{ 
		const btns = document.getElementsByClassName("toggleEmbed_button");
		for (let i = btns.length - 1; i >= 0; i--)
		{
			if (isElementInViewport(btns[i].parentElement))
				btns[i].click();
		}
	}
});
