"use strict";window.DOMHandler=class{constructor(c,a){this._iRuntime=c,this._componentId=a,this._hasTickCallback=!1,this._tickCallback=()=>this.Tick()}Attach(){}PostToRuntime(e,a,b,c){this._iRuntime.PostToRuntimeComponent(this._componentId,e,a,b,c)}PostToRuntimeAsync(e,a,b,c){return this._iRuntime.PostToRuntimeComponentAsync(this._componentId,e,a,b,c)}_PostToRuntimeMaybeSync(d,a,b){this._iRuntime.UsesWorker()?this.PostToRuntime(d,a,b):this._iRuntime._GetLocalRuntime()._OnMessageFromDOM({type:"event",component:this._componentId,handler:d,dispatchOpts:b||null,data:a,responseId:null})}AddRuntimeMessageHandler(c,a){this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId,c,a)}AddRuntimeMessageHandlers(d){for(const[a,b]of d)this.AddRuntimeMessageHandler(a,b)}GetRuntimeInterface(){return this._iRuntime}GetComponentID(){return this._componentId}_StartTicking(){this._hasTickCallback||(this._iRuntime._AddRAFCallback(this._tickCallback),this._hasTickCallback=!0)}_StopTicking(){this._hasTickCallback&&(this._iRuntime._RemoveRAFCallback(this._tickCallback),this._hasTickCallback=!1)}Tick(){}},"use strict",window.DOMElementHandler=class extends DOMHandler{constructor(c,a){super(c,a),this._elementMap=new Map,this._autoAttach=!0,this.AddRuntimeMessageHandler("create",b=>this._OnCreate(b)),this.AddRuntimeMessageHandler("destroy",b=>this._OnDestroy(b)),this.AddRuntimeMessageHandler("set-visible",b=>this._OnSetVisible(b)),this.AddRuntimeMessageHandler("update-position",b=>this._OnUpdatePosition(b)),this.AddRuntimeMessageHandler("update-state",b=>this._OnUpdateState(b)),this.AddRuntimeMessageHandler("focus",b=>this._OnSetFocus(b)),this.AddRuntimeMessageHandler("set-css-style",b=>this._OnSetCssStyle(b))}SetAutoAttach(b){this._autoAttach=!!b}AddDOMElementMessageHandler(c,e){this.AddRuntimeMessageHandler(c,b=>{const a=b.elementId,c=this._elementMap.get(a);return e(c,b)})}_OnCreate(d){const a=d.elementId,b=this.CreateElement(a,d);this._elementMap.set(a,b),d.isVisible||(b.style.display="none"),this._autoAttach&&document.body.appendChild(b)}CreateElement(){throw new Error("required override")}DestroyElement(){}_OnDestroy(d){const a=d.elementId,b=this._elementMap.get(a);this.DestroyElement(b),this._autoAttach&&b.parentElement.removeChild(b),this._elementMap.delete(a)}PostToRuntimeElement(d,a,b){b||(b={}),b.elementId=a,this.PostToRuntime(d,b)}_PostToRuntimeElementMaybeSync(d,a,b){b||(b={}),b.elementId=a,this._PostToRuntimeMaybeSync(d,b)}_OnSetVisible(c){if(this._autoAttach){const a=this._elementMap.get(c.elementId);a.style.display=c.isVisible?"":"none"}}_OnUpdatePosition(d){if(this._autoAttach){const a=this._elementMap.get(d.elementId);a.style.left=d.left+"px",a.style.top=d.top+"px",a.style.width=d.width+"px",a.style.height=d.height+"px";const b=d.fontSize;null!==b&&(a.style.fontSize=b+"em")}}_OnUpdateState(c){const a=this._elementMap.get(c.elementId);this.UpdateState(a,c)}UpdateState(){throw new Error("required override")}_OnSetFocus(c){const a=this._elementMap.get(c.elementId);c.focus?a.focus():a.blur()}_OnSetCssStyle(c){const a=this._elementMap.get(c.elementId);a.style[c.prop]=c.val}GetElementById(b){return this._elementMap.get(b)}},"use strict";{function n(e){return new Promise((a,b)=>{const c=document.createElement("script");c.onload=a,c.onerror=b,c.async=!1,c.src=e,document.head.appendChild(c)})}async function o(c){const a=await p(c),b=new TextDecoder("utf-8");return b.decode(a)}function p(e){return new Promise((f,b)=>{const a=new FileReader;a.onload=b=>f(b.target.result),a.onerror=c=>b(c),a.readAsArrayBuffer(e)})}const a=/(iphone|ipod|ipad)/i.test(navigator.userAgent);let b=new Audio;const c={"audio/webm; codecs=opus":!!b.canPlayType("audio/webm; codecs=opus"),"audio/ogg; codecs=opus":!!b.canPlayType("audio/ogg; codecs=opus"),"audio/webm; codecs=vorbis":!!b.canPlayType("audio/webm; codecs=vorbis"),"audio/ogg; codecs=vorbis":!!b.canPlayType("audio/ogg; codecs=vorbis"),"audio/mp4":!!b.canPlayType("audio/mp4"),"audio/mpeg":!!b.canPlayType("audio/mpeg")};b=null;const d=[];let e=0;window.RealFile=window.File;const f=[],i=new Map,g=new Map;let h=0;const j=[];self.runOnStartup=function(b){if("function"!=typeof b)throw new Error("runOnStartup called without a function");j.push(b)},window.RuntimeInterface=class b{constructor(b){this._useWorker=b.useWorker,this._messageChannelPort=null,this._baseUrl="",this._scriptFolder=b.scriptFolder,this._workerScriptBlobURLs={},this._worker=null,this._localRuntime=null,this._domHandlers=[],this._runtimeDomHandler=null,this._canvas=null,this._jobScheduler=null,this._rafId=-1,this._rafFunc=()=>this._OnRAFCallback(),this._rafCallbacks=[],this._exportType=b.exportType,("cordova"===this._exportType||"playable-ad"===this._exportType||"instant-games"===this._exportType)&&this._useWorker&&(console.warn("[C3 runtime] Worker mode is enabled and supported, but is disabled in WebViews due to crbug.com/923007. Reverting to DOM mode."),this._useWorker=!1),/CrOS/.test(navigator.userAgent)&&(console.warn("[C3 runtime] Worker mode is enabled and supported, but is disabled in Chrome OS due to reports of crashes. Reverting to DOM mode."),this._useWorker=!1),this._transferablesBroken=!1,this._localFileBlobs=null,("html5"===this._exportType||"playable-ad"===this._exportType)&&"file"===location.protocol.substr(0,4)&&alert("Exported games won't work until you upload them. (When running on the file: protocol, browsers block many features from working for security reasons.)"),this.AddRuntimeComponentMessageHandler("runtime","cordova-fetch-local-file",b=>this._OnCordovaFetchLocalFile(b)),this.AddRuntimeComponentMessageHandler("runtime","create-job-worker",b=>this._OnCreateJobWorker(b)),"cordova"===this._exportType?document.addEventListener("deviceready",()=>this._Init(b)):this._Init(b)}Release(){this._CancelAnimationFrame(),this._messageChannelPort&&(this._messageChannelPort.onmessage=null,this._messageChannelPort=null),this._worker&&(this._worker.terminate(),this._worker=null),this._localRuntime&&(this._localRuntime.Release(),this._localRuntime=null),this._canvas&&(this._canvas.parentElement.removeChild(this._canvas),this._canvas=null)}GetCanvas(){return this._canvas}GetBaseURL(){return this._baseUrl}UsesWorker(){return this._useWorker}GetExportType(){return this._exportType}IsWKWebView(){return"cordova"===this._exportType&&a}IsAndroid(){return"cordova"===this._exportType&&!1===a}async _Init(d){if("playable-ad"===this._exportType){this._localFileBlobs=self.c3_base64files,await this._ConvertDataUrisToBlobs();for(let a=0,b=d.engineScripts.length;a<b;++a){const b=d.engineScripts[a].toLowerCase();this._localFileBlobs.hasOwnProperty(b)&&(d.engineScripts[a]=URL.createObjectURL(this._localFileBlobs[b]))}}if(d.baseUrl)this._baseUrl=d.baseUrl;else{const c=location.origin;this._baseUrl=("null"===c?"file:///":c)+location.pathname;const a=this._baseUrl.lastIndexOf("/");-1!==a&&(this._baseUrl=this._baseUrl.substr(0,a+1))}if(d.workerScripts)for(const[a,b]of Object.entries(d.workerScripts))this._workerScriptBlobURLs[a]=URL.createObjectURL(b);const a=new MessageChannel;this._messageChannelPort=a.port1,this._messageChannelPort.onmessage=b=>this._OnMessageFromRuntime(b.data),window.c3_addPortMessageHandler&&window.c3_addPortMessageHandler(b=>this._OnMessageFromDebugger(b)),this._jobScheduler=new self.JobSchedulerDOM(this),await this._jobScheduler.Init(),this.MaybeForceBodySize(),"object"==typeof window.StatusBar&&window.StatusBar.hide(),"object"==typeof window.AndroidFullScreen&&window.AndroidFullScreen.immersiveMode(),await this._TestTransferablesWork(),this._useWorker?await this._InitWorker(d,a.port2):await this._InitDOM(d,a.port2)}_GetWorkerURL(b){return this._workerScriptBlobURLs.hasOwnProperty(b)?this._workerScriptBlobURLs[b]:b.endsWith("/workermain.js")&&this._workerScriptBlobURLs.hasOwnProperty("workermain.js")?this._workerScriptBlobURLs["workermain.js"]:"playable-ad"===this._exportType&&this._localFileBlobs.hasOwnProperty(b.toLowerCase())?URL.createObjectURL(this._localFileBlobs[b.toLowerCase()]):b}async CreateWorker(f,a,g){if(f.startsWith("blob:"))return new Worker(f,g);if(this.IsWKWebView()){const a=await this.CordovaFetchLocalFileAsArrayBuffer(this._scriptFolder+f),b=new Blob([a],{type:"application/javascript"});return new Worker(URL.createObjectURL(b),g)}const c=new URL(f,a),b=location.origin!==c.origin;if(b){const d=await fetch(c);if(!d.ok)throw new Error("failed to fetch worker script");const a=await d.blob();return new Worker(URL.createObjectURL(a),g)}return new Worker(c,g)}MaybeForceBodySize(){if(this.IsWKWebView()){const f=document.documentElement.style,a=document.body.style,b=window.innerWidth<window.innerHeight,c=b?window.screen.width:window.screen.height,d=b?window.screen.height:window.screen.width;a.height=f.height=d+"px",a.width=f.width=c+"px"}}_GetCommonRuntimeOptions(d){return{baseUrl:this._baseUrl,windowInnerWidth:window.innerWidth,windowInnerHeight:window.innerHeight,devicePixelRatio:window.devicePixelRatio,isFullscreen:b.IsDocumentFullscreen(),projectData:d.projectData,previewImageBlobs:window.cr_previewImageBlobs||this._localFileBlobs,previewProjectFileBlobs:window.cr_previewProjectFileBlobs,exportType:d.exportType,isDebug:-1<self.location.search.indexOf("debug"),ife:!!self.ife,jobScheduler:this._jobScheduler.GetPortData(),supportedAudioFormats:c,opusWasmScriptUrl:window.cr_opusWasmScriptUrl||this._scriptFolder+"opus.wasm.js",opusWasmBinaryUrl:window.cr_opusWasmBinaryUrl||this._scriptFolder+"opus.wasm.wasm",isWKWebView:this.IsWKWebView(),isFBInstantAvailable:"undefined"!=typeof self.FBInstant}}async _InitWorker(e,a){const b=this._GetWorkerURL(e.workerMainUrl);this._worker=await this.CreateWorker(b,this._baseUrl,{name:"Runtime"}),this._canvas=document.createElement("canvas"),this._canvas.style.display="none";const c=this._canvas.transferControlToOffscreen();document.body.appendChild(this._canvas),window.c3canvas=this._canvas,this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(e),{type:"init-runtime",isInWorker:!0,messagePort:a,canvas:c,workerDependencyScripts:e.workerDependencyScripts||[],engineScripts:e.engineScripts,projectScripts:window.cr_allProjectScripts,projectScriptsStatus:self.C3_ProjectScriptsStatus}),[a,c,...this._jobScheduler.GetPortTransferables()]),this._domHandlers=f.map(b=>new b(this)),this._FindRuntimeDOMHandler(),self.c3_callFunction=(c,a)=>this._runtimeDomHandler._InvokeFunctionFromJS(c,a),"preview"===this._exportType&&(self.goToLastErrorScript=()=>this.PostToRuntimeComponent("runtime","go-to-last-error-script"))}async _InitDOM(a,b){this._canvas=document.createElement("canvas"),this._canvas.style.display="none",document.body.appendChild(this._canvas),window.c3canvas=this._canvas,this._domHandlers=f.map(b=>new b(this)),this._FindRuntimeDOMHandler();const c=a.engineScripts.map(b=>new URL(b,this._baseUrl).toString());if(Array.isArray(a.workerDependencyScripts)&&c.unshift(...a.workerDependencyScripts),await Promise.all(c.map(a=>n(a))),a.projectScripts&&0<a.projectScripts.length){const b=self.C3_ProjectScriptsStatus;try{if(await Promise.all(a.projectScripts.map(a=>n(a[1]))),Object.values(b).some(b=>!b))return void self.setTimeout(()=>this._ReportProjectScriptError(b),100)}catch(c){return console.error("[Preview] Error loading project scripts: ",c),void self.setTimeout(()=>this._ReportProjectScriptError(b),100)}}if("preview"===this._exportType&&"object"!=typeof self.C3.ScriptsInEvents)return console.error("[C3 runtime] Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."),void alert("Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax.");const d=Object.assign(this._GetCommonRuntimeOptions(a),{isInWorker:!1,messagePort:b,canvas:this._canvas,runOnStartupFunctions:j});this._localRuntime=self.C3_CreateRuntime(d),await self.C3_InitRuntime(this._localRuntime,d)}_ReportProjectScriptError(d){const a=Object.entries(d).filter(b=>!b[1]).map(b=>b[0]),b=`Failed to load project script '${a[0]}'. Check all your JavaScript code has valid syntax.`;console.error("[Preview] "+b),alert(b)}async _OnCreateJobWorker(){const b=await this._jobScheduler._CreateJobWorker();return{outputPort:b,transferables:[b]}}_GetLocalRuntime(){if(this._useWorker)throw new Error("not available in worker mode");return this._localRuntime}PostToRuntimeComponent(f,a,b,c,d){this._messageChannelPort.postMessage({type:"event",component:f,handler:a,dispatchOpts:c||null,data:b,responseId:null},this._transferablesBroken?void 0:d)}PostToRuntimeComponentAsync(i,a,b,c,d){const e=h++,f=new Promise((c,a)=>{g.set(e,{resolve:c,reject:a})});return this._messageChannelPort.postMessage({type:"event",component:i,handler:a,dispatchOpts:c||null,data:b,responseId:e},this._transferablesBroken?void 0:d),f}["_OnMessageFromRuntime"](c){const a=c.type;if("event"===a)this._OnEventFromRuntime(c);else if("result"===a)this._OnResultFromRuntime(c);else if("runtime-ready"===a)this._OnRuntimeReady();else if("alert"===a)alert(c.message);else throw new Error(`unknown message '${a}'`)}_OnEventFromRuntime(j){const k=j.component,b=j.handler,a=j.data,c=j.responseId,d=i.get(k);if(!d)return void console.warn(`[DOM] No event handlers for component '${k}'`);const e=d.get(b);if(!e)return void console.warn(`[DOM] No handler '${b}' for component '${k}'`);let f=null;try{f=e(a)}catch(d){return console.error(`Exception in '${k}' handler '${b}':`,d),void(null!==c&&this._PostResultToRuntime(c,!1,d.toString()))}null!==c&&(f&&f.then?f.then(b=>this._PostResultToRuntime(c,!0,b)).catch(d=>{console.error(`Rejection from '${k}' handler '${b}':`,d),this._PostResultToRuntime(c,!1,d.toString())}):this._PostResultToRuntime(c,!0,f))}_PostResultToRuntime(e,a,b){let c;b&&b.transferables&&(c=b.transferables),this._messageChannelPort.postMessage({type:"result",responseId:e,isOk:a,result:b},c)}_OnResultFromRuntime(f){const a=f.responseId,b=f.isOk,c=f.result,d=g.get(a);b?d.resolve(c):d.reject(c),g.delete(a)}AddRuntimeComponentMessageHandler(e,a,b){let c=i.get(e);if(c||(c=new Map,i.set(e,c)),c.has(a))throw new Error(`[DOM] Component '${e}' already has handler '${a}'`);c.set(a,b)}static AddDOMHandlerClass(b){if(f.includes(b))throw new Error("DOM handler already added");f.push(b)}_FindRuntimeDOMHandler(){for(const b of this._domHandlers)if("runtime"===b.GetComponentID())return void(this._runtimeDomHandler=b);throw new Error("cannot find runtime DOM handler")}_OnMessageFromDebugger(b){this.PostToRuntimeComponent("debugger","message",b)}_OnRuntimeReady(){for(const b of this._domHandlers)b.Attach()}static IsDocumentFullscreen(){return!!(document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement)}async GetRemotePreviewStatusInfo(){return await this.PostToRuntimeComponentAsync("runtime","get-remote-preview-status-info")}_AddRAFCallback(b){this._rafCallbacks.push(b),this._RequestAnimationFrame()}_RemoveRAFCallback(c){const a=this._rafCallbacks.indexOf(c);if(-1===a)throw new Error("invalid callback");this._rafCallbacks.splice(a,1),this._rafCallbacks.length||this._CancelAnimationFrame()}_RequestAnimationFrame(){-1===this._rafId&&this._rafCallbacks.length&&(this._rafId=requestAnimationFrame(this._rafFunc))}_CancelAnimationFrame(){-1!==this._rafId&&(cancelAnimationFrame(this._rafId),this._rafId=-1)}_OnRAFCallback(){this._rafId=-1;for(const b of this._rafCallbacks)b();this._RequestAnimationFrame()}TryPlayMedia(b){this._runtimeDomHandler.TryPlayMedia(b)}RemovePendingPlay(b){this._runtimeDomHandler.RemovePendingPlay(b)}_PlayPendingMedia(){this._runtimeDomHandler._PlayPendingMedia()}SetSilent(b){this._runtimeDomHandler.SetSilent(b)}IsAudioFormatSupported(b){return!!c[b]}async _WasmDecodeWebMOpus(c){const a=await this.PostToRuntimeComponentAsync("runtime","opus-decode",{arrayBuffer:c},null,[c]);return new Float32Array(a)}IsAbsoluteURL(b){return /^(?:[a-z]+:)?\/\//.test(b)||"data:"===b.substr(0,5)||"blob:"===b.substr(0,5)}IsRelativeURL(b){return!this.IsAbsoluteURL(b)}async _OnCordovaFetchLocalFile(c){const a=c.filename;switch(c.as){case"text":return await this.CordovaFetchLocalFileAsText(a);case"buffer":return await this.CordovaFetchLocalFileAsArrayBuffer(a);default:throw new Error("unsupported type");}}CordovaFetchLocalFile(c){const d=window.cordova.file.applicationDirectory+"www/"+c.toLowerCase();return new Promise((e,a)=>{window.resolveLocalFileSystemURL(d,c=>{c.file(e,a)},a)})}async CordovaFetchLocalFileAsText(b){const a=await this.CordovaFetchLocalFile(b);return await o(a)}_CordovaMaybeStartNextArrayBufferRead(){if(d.length&&!(8<=e)){e++;const b=d.shift();this._CordovaDoFetchLocalFileAsAsArrayBuffer(b.filename,b.successCallback,b.errorCallback)}}CordovaFetchLocalFileAsArrayBuffer(f){return new Promise((g,b)=>{d.push({filename:f,successCallback:b=>{e--,this._CordovaMaybeStartNextArrayBufferRead(),g(b)},errorCallback:c=>{e--,this._CordovaMaybeStartNextArrayBufferRead(),b(c)}}),this._CordovaMaybeStartNextArrayBufferRead()})}async _CordovaDoFetchLocalFileAsAsArrayBuffer(c,a,b){try{const b=await this.CordovaFetchLocalFile(c),d=await p(b);a(d)}catch(c){b(c)}}async _ConvertDataUrisToBlobs(){const d=[];for(const[a,b]of Object.entries(this._localFileBlobs))d.push(this._ConvertDataUriToBlobs(a,b));await Promise.all(d)}async _ConvertDataUriToBlobs(e,a){if("object"==typeof a)this._localFileBlobs[e]=new Blob([a.str],{type:a.type});else{const b=await fetch(a),c=await b.blob();this._localFileBlobs[e]=c}}_TestTransferablesWork(){let e=null;const f=new Promise(a=>e=a),b=new ArrayBuffer(1),c=new MessageChannel;return c.port2.onmessage=a=>{a.data&&a.data.arrayBuffer||(this._transferablesBroken=!0,console.warn("MessageChannel transfers determined to be broken. Disabling transferables.")),e()},c.port1.postMessage({arrayBuffer:b},[b]),f}}}{function p(b){return b.sourceCapabilities&&b.sourceCapabilities.firesTouchEvents||b.originalEvent&&b.originalEvent.sourceCapabilities&&b.originalEvent.sourceCapabilities.firesTouchEvents}function q(e){return new Promise((a,b)=>{const c=document.createElement("link");c.onload=()=>a(c),c.onerror=c=>b(c),c.rel="stylesheet",c.href=e,document.head.appendChild(c)})}function a(e){return new Promise((a,b)=>{const c=new Image;c.onload=()=>a(c),c.onerror=c=>b(c),c.src=e})}async function r(c){const d=URL.createObjectURL(c);try{return await a(d)}finally{URL.revokeObjectURL(d)}}function s(b){do{if(b.parentNode&&b.hasAttribute("contenteditable"))return!0;b=b.parentNode}while(b);return!1}function d(c){const a=c.target.tagName.toLowerCase();i.has(a)&&c.preventDefault()}function e(b){(b.metaKey||b.ctrlKey)&&b.preventDefault()}function b(){try{return window.parent&&window.parent.document.hasFocus()}catch(b){return!1}}const f=new Map([["OSLeft","MetaLeft"],["OSRight","MetaRight"]]),h={dispatchRuntimeEvent:!0,dispatchUserScriptEvent:!0},g={dispatchUserScriptEvent:!0},c={dispatchRuntimeEvent:!0},i=new Set(["canvas","body","html"]);self.C3_RasterSvgImage=async function(f,a,b){const c=document.createElement("canvas");c.width=a,c.height=b;const d=c.getContext("2d");return d.drawImage(f,0,0,a,b),c};let j=!1;document.addEventListener("pause",()=>j=!0),document.addEventListener("resume",()=>j=!1);const k=class extends DOMHandler{constructor(f){super(f,"runtime"),this._isFirstSizeUpdate=!0,this._simulatedResizeTimerId=-1,this._targetOrientation="any",this._attachedDeviceOrientationEvent=!1,this._attachedDeviceMotionEvent=!1,this._debugHighlightElem=null,f.AddRuntimeComponentMessageHandler("canvas","update-size",b=>this._OnUpdateCanvasSize(b)),f.AddRuntimeComponentMessageHandler("runtime","invoke-download",b=>this._OnInvokeDownload(b)),f.AddRuntimeComponentMessageHandler("runtime","raster-svg-image",b=>this._OnRasterSvgImage(b)),f.AddRuntimeComponentMessageHandler("runtime","set-target-orientation",b=>this._OnSetTargetOrientation(b)),f.AddRuntimeComponentMessageHandler("runtime","register-sw",()=>this._OnRegisterSW()),f.AddRuntimeComponentMessageHandler("runtime","post-to-debugger",b=>this._OnPostToDebugger(b)),f.AddRuntimeComponentMessageHandler("runtime","go-to-script",b=>this._OnPostToDebugger(b)),f.AddRuntimeComponentMessageHandler("runtime","before-start-ticking",()=>this._OnBeforeStartTicking()),f.AddRuntimeComponentMessageHandler("runtime","debug-highlight",b=>this._OnDebugHighlight(b)),f.AddRuntimeComponentMessageHandler("runtime","enable-device-orientation",()=>this._AttachDeviceOrientationEvent()),f.AddRuntimeComponentMessageHandler("runtime","enable-device-motion",()=>this._AttachDeviceMotionEvent()),f.AddRuntimeComponentMessageHandler("runtime","add-stylesheet",b=>this._OnAddStylesheet(b));const g=new Set(["input","textarea","datalist"]);window.addEventListener("contextmenu",b=>{const a=b.target,c=a.tagName.toLowerCase();g.has(c)||s(a)||b.preventDefault()}),window.addEventListener("selectstart",d),window.addEventListener("gesturehold",d),window.addEventListener("touchstart",d,{passive:!1});const a=f.GetCanvas();"undefined"==typeof PointerEvent?a.addEventListener("touchstart",d):(window.addEventListener("pointerdown",d,{passive:!1}),a.addEventListener("pointerdown",d)),this._mousePointerLastButtons=0,window.addEventListener("mousedown",b=>{1===b.button&&b.preventDefault()}),window.addEventListener("mousewheel",e,{passive:!1}),window.addEventListener("wheel",e,{passive:!1}),window.addEventListener("resize",()=>this._OnWindowResize()),this._mediaPendingPlay=new Set,this._mediaRemovedPendingPlay=new WeakSet,this._isSilent=!1}_OnBeforeStartTicking(){return"cordova"===this._iRuntime.GetExportType()?(document.addEventListener("pause",()=>this._OnVisibilityChange(!0)),document.addEventListener("resume",()=>this._OnVisibilityChange(!1))):document.addEventListener("visibilitychange",()=>this._OnVisibilityChange(document.hidden)),{isSuspended:!!(document.hidden||j)}}Attach(){window.addEventListener("focus",()=>this._PostRuntimeEvent("window-focus")),window.addEventListener("blur",()=>{this._PostRuntimeEvent("window-blur",{parentHasFocus:b()}),this._mousePointerLastButtons=0}),window.addEventListener("fullscreenchange",()=>this._OnFullscreenChange()),window.addEventListener("webkitfullscreenchange",()=>this._OnFullscreenChange()),window.addEventListener("mozfullscreenchange",()=>this._OnFullscreenChange()),window.addEventListener("fullscreenerror",b=>this._OnFullscreenError(b)),window.addEventListener("webkitfullscreenerror",b=>this._OnFullscreenError(b)),window.addEventListener("mozfullscreenerror",b=>this._OnFullscreenError(b)),window.addEventListener("keydown",b=>this._OnKeyEvent("keydown",b)),window.addEventListener("keyup",b=>this._OnKeyEvent("keyup",b)),window.addEventListener("dblclick",b=>this._OnMouseEvent("dblclick",b,h)),window.addEventListener("wheel",b=>this._OnMouseWheelEvent("wheel",b)),"undefined"==typeof PointerEvent?(window.addEventListener("mousedown",b=>this._OnMouseEventAsPointer("pointerdown",b)),window.addEventListener("mousemove",b=>this._OnMouseEventAsPointer("pointermove",b)),window.addEventListener("mouseup",b=>this._OnMouseEventAsPointer("pointerup",b)),window.addEventListener("touchstart",b=>this._OnTouchEvent("pointerdown",b)),window.addEventListener("touchmove",b=>this._OnTouchEvent("pointermove",b)),window.addEventListener("touchend",b=>this._OnTouchEvent("pointerup",b)),window.addEventListener("touchcancel",b=>this._OnTouchEvent("pointercancel",b))):(window.addEventListener("pointerdown",b=>this._OnPointerEvent("pointerdown",b)),window.addEventListener("pointermove",b=>this._OnPointerEvent("pointermove",b)),window.addEventListener("pointerup",b=>this._OnPointerEvent("pointerup",b)),window.addEventListener("pointercancel",b=>this._OnPointerEvent("pointercancel",b)));const c=()=>this._PlayPendingMedia();window.addEventListener("pointerup",c,!0),window.addEventListener("touchend",c,!0),window.addEventListener("click",c,!0),window.addEventListener("keydown",c,!0),window.addEventListener("gamepadconnected",c,!0)}_PostRuntimeEvent(d,a){this.PostToRuntime(d,a||null,c)}_GetWindowInnerWidth(){return Math.max(window.innerWidth,1)}_GetWindowInnerHeight(){return Math.max(window.innerHeight,1)}_OnWindowResize(){const c=this._GetWindowInnerWidth(),a=this._GetWindowInnerHeight();this._PostRuntimeEvent("window-resize",{innerWidth:c,innerHeight:a,devicePixelRatio:window.devicePixelRatio}),this._iRuntime.IsWKWebView()&&(-1!==this._simulatedResizeTimerId&&clearTimeout(this._simulatedResizeTimerId),this._OnSimulatedResize(c,a,0))}_ScheduleSimulatedResize(d,a,b){-1!==this._simulatedResizeTimerId&&clearTimeout(this._simulatedResizeTimerId),this._simulatedResizeTimerId=setTimeout(()=>this._OnSimulatedResize(d,a,b),48)}_OnSimulatedResize(f,a,b){const c=this._GetWindowInnerWidth(),d=this._GetWindowInnerHeight();this._simulatedResizeTimerId=-1,c!=f||d!=a?this._PostRuntimeEvent("window-resize",{innerWidth:c,innerHeight:d,devicePixelRatio:window.devicePixelRatio}):10>b&&this._ScheduleSimulatedResize(c,d,b+1)}_OnSetTargetOrientation(b){this._targetOrientation=b.targetOrientation}_TrySetTargetOrientation(){const c=this._targetOrientation;if(screen.orientation&&screen.orientation.lock)screen.orientation.lock(c).catch(b=>console.warn("[Construct 3] Failed to lock orientation: ",b));else try{let a=!1;screen.lockOrientation?a=screen.lockOrientation(c):screen.webkitLockOrientation?a=screen.webkitLockOrientation(c):screen.mozLockOrientation?a=screen.mozLockOrientation(c):screen.msLockOrientation&&(a=screen.msLockOrientation(c)),a||console.warn("[Construct 3] Failed to lock orientation")}catch(b){console.warn("[Construct 3] Failed to lock orientation: ",b)}}_OnFullscreenChange(){const b=RuntimeInterface.IsDocumentFullscreen();b&&"any"!==this._targetOrientation&&this._TrySetTargetOrientation(),this.PostToRuntime("fullscreenchange",{isFullscreen:b,innerWidth:this._GetWindowInnerWidth(),innerHeight:this._GetWindowInnerHeight()})}_OnFullscreenError(b){console.warn("[Construct 3] Fullscreen request failed: ",b),this.PostToRuntime("fullscreenerror",{isFullscreen:RuntimeInterface.IsDocumentFullscreen(),innerWidth:this._GetWindowInnerWidth(),innerHeight:this._GetWindowInnerHeight()})}_OnVisibilityChange(b){b?this._iRuntime._CancelAnimationFrame():this._iRuntime._RequestAnimationFrame(),this.PostToRuntime("visibilitychange",{hidden:b})}_OnKeyEvent(d,a){const b=f.get(a.code)||a.code;this._PostToRuntimeMaybeSync(d,{code:b,key:a.key,which:a.which,repeat:a.repeat,altKey:a.altKey,ctrlKey:a.ctrlKey,metaKey:a.metaKey,shiftKey:a.shiftKey,timeStamp:a.timeStamp},h)}_OnMouseWheelEvent(c,a){this.PostToRuntime(c,{clientX:a.clientX,clientY:a.clientY,deltaX:a.deltaX,deltaY:a.deltaY,deltaZ:a.deltaZ,deltaMode:a.deltaMode,timeStamp:a.timeStamp},h)}_OnMouseEvent(a,b,c){p(b)||("mousedown"===a&&window!==window.top&&window.focus(),this._PostToRuntimeMaybeSync(a,{button:b.button,buttons:b.buttons,clientX:b.clientX,clientY:b.clientY,timeStamp:b.timeStamp},c))}_OnMouseEventAsPointer(a,e){if(!p(e)){"pointerdown"===a&&window!==window.top&&window.focus();const b=this._mousePointerLastButtons;"pointerdown"===a&&0!==b?a="pointermove":"pointerup"==a&&0!==e.buttons&&(a="pointermove"),this._PostToRuntimeMaybeSync(a,{pointerId:1,pointerType:"mouse",button:e.button,buttons:e.buttons,lastButtons:b,clientX:e.clientX,clientY:e.clientY,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,timeStamp:e.timeStamp},h),this._mousePointerLastButtons=e.buttons,this._OnMouseEvent(e.type,e,g)}}_OnPointerEvent(d,a){"pointerdown"===d&&window!==window.top&&window.focus();let b=0;if("mouse"===a.pointerType&&(b=this._mousePointerLastButtons),this._PostToRuntimeMaybeSync(d,{pointerId:a.pointerId,pointerType:a.pointerType,button:a.button,buttons:a.buttons,lastButtons:b,clientX:a.clientX,clientY:a.clientY,width:a.width||0,height:a.height||0,pressure:a.pressure||0,tangentialPressure:a.tangentialPressure||0,tiltX:a.tiltX||0,tiltY:a.tiltY||0,twist:a.twist||0,timeStamp:a.timeStamp},h),"mouse"===a.pointerType){let b="mousemove";"pointerdown"===d?b="mousedown":"pointerup"==d&&(b="pointerup"),this._OnMouseEvent(b,a,g),this._mousePointerLastButtons=a.buttons}}_OnTouchEvent(e,a){"pointerdown"===e&&window!==window.top&&window.focus();for(let b=0,c=a.changedTouches.length;b<c;++b){const c=a.changedTouches[b];this._PostToRuntimeMaybeSync(e,{pointerId:c.identifier,pointerType:"touch",button:0,buttons:0,lastButtons:0,clientX:c.clientX,clientY:c.clientY,width:2*(c.radiusX||c.webkitRadiusX||0),height:2*(c.radiusY||c.webkitRadiusY||0),pressure:c.force||c.webkitForce||0,tangentialPressure:0,tiltX:0,tiltY:0,twist:c.rotationAngle||0,timeStamp:a.timeStamp},h)}}_AttachDeviceOrientationEvent(){this._attachedDeviceOrientationEvent||(this._attachedDeviceOrientationEvent=!0,window.addEventListener("deviceorientation",b=>this._OnDeviceOrientation(b)))}_AttachDeviceMotionEvent(){this._attachedDeviceMotionEvent||(this._attachedDeviceMotionEvent=!0,window.addEventListener("devicemotion",b=>this._OnDeviceMotion(b)))}_OnDeviceOrientation(b){this.PostToRuntime("deviceorientation",{alpha:b.alpha||0,beta:b.beta||0,gamma:b.gamma||0,timeStamp:b.timeStamp},h)}_OnDeviceMotion(i){let a=null;const j=i.acceleration;j&&(a={x:j.x||0,y:j.y||0,z:j.z||0});let c=null;const k=i.accelerationIncludingGravity;k&&(c={x:k.x||0,y:k.y||0,z:k.z||0});let e=null;const l=i.rotationRate;l&&(e={alpha:l.alpha||0,beta:l.beta||0,gamma:l.gamma||0}),this.PostToRuntime("devicemotion",{acceleration:a,accelerationIncludingGravity:c,rotationRate:e,interval:i.interval,timeStamp:i.timeStamp},h)}_OnUpdateCanvasSize(d){const a=this.GetRuntimeInterface(),b=a.GetCanvas();b.style.width=d.styleWidth+"px",b.style.height=d.styleHeight+"px",b.style.marginLeft=d.marginLeft+"px",b.style.marginTop=d.marginTop+"px",a.MaybeForceBodySize(),this._isFirstSizeUpdate&&(b.style.display="",this._isFirstSizeUpdate=!1)}_OnInvokeDownload(f){const b=f.url,c=f.filename,d=document.createElement("a"),e=document.body;d.textContent=c,d.href=b,d.download=c,e.appendChild(d),d.click(),e.removeChild(d)}async _OnRasterSvgImage(d){const a=d.blob,b=d.width,c=d.height,e=await r(a),f=await self.C3_RasterSvgImage(e,b,c);return await createImageBitmap(f)}async _OnAddStylesheet(b){await q(b.url)}_PlayPendingMedia(){const c=[...this._mediaPendingPlay];if(this._mediaPendingPlay.clear(),!this._isSilent)for(const d of c){const b=d.play();b&&b.catch(()=>{this._mediaRemovedPendingPlay.has(d)||this._mediaPendingPlay.add(d)})}}TryPlayMedia(c){if("function"!=typeof c.play)throw new Error("missing play function");this._mediaRemovedPendingPlay.delete(c);let a;try{a=c.play()}catch(a){return void this._mediaPendingPlay.add(c)}a&&a.catch(()=>{this._mediaRemovedPendingPlay.has(c)||this._mediaPendingPlay.add(c)})}RemovePendingPlay(b){this._mediaPendingPlay.delete(b),this._mediaRemovedPendingPlay.add(b)}SetSilent(b){this._isSilent=!!b}_OnDebugHighlight(d){const a=d.show;if(!a)return void(this._debugHighlightElem&&(this._debugHighlightElem.style.display="none"));this._debugHighlightElem||(this._debugHighlightElem=document.createElement("div"),this._debugHighlightElem.id="inspectOutline",document.body.appendChild(this._debugHighlightElem));const b=this._debugHighlightElem;b.style.display="",b.style.left=d.left-1+"px",b.style.top=d.top-1+"px",b.style.width=d.width+2+"px",b.style.height=d.height+2+"px",b.textContent=d.name}_OnRegisterSW(){window.C3_RegisterSW&&window.C3_RegisterSW()}_OnPostToDebugger(b){window.c3_postToMessagePort&&(b.from="runtime",window.c3_postToMessagePort(b))}_InvokeFunctionFromJS(c,a){return this.PostToRuntimeAsync("js-invoke-function",{name:c,params:a})}};RuntimeInterface.AddDOMHandlerClass(k)}{const c=document.currentScript.src;self.JobSchedulerDOM=class{constructor(a){this._runtimeInterface=a,this._baseUrl=c?c.substr(0,c.lastIndexOf("/")+1):a.GetBaseURL(),this._maxNumWorkers=Math.min(navigator.hardwareConcurrency||2,16),this._dispatchWorker=null,this._jobWorkers=[],this._inputPort=null,this._outputPort=null}async Init(){if(this._hasInitialised)throw new Error("already initialised");this._hasInitialised=!0;const c=this._runtimeInterface._GetWorkerURL("dispatchworker.js");this._dispatchWorker=await this._runtimeInterface.CreateWorker(c,this._baseUrl,{name:"DispatchWorker"});const a=new MessageChannel;this._inputPort=a.port1,this._dispatchWorker.postMessage({type:"_init","in-port":a.port2},[a.port2]),this._outputPort=await this._CreateJobWorker()}async _CreateJobWorker(){const f=this._jobWorkers.length,a=this._runtimeInterface._GetWorkerURL("jobworker.js"),b=await this._runtimeInterface.CreateWorker(a,this._baseUrl,{name:"JobWorker"+f}),c=new MessageChannel,d=new MessageChannel;return this._dispatchWorker.postMessage({type:"_addJobWorker",port:c.port1},[c.port1]),b.postMessage({type:"init",number:f,"dispatch-port":c.port2,"output-port":d.port2},[c.port2,d.port2]),this._jobWorkers.push(b),d.port1}GetPortData(){return{inputPort:this._inputPort,outputPort:this._outputPort,maxNumWorkers:this._maxNumWorkers}}GetPortTransferables(){return[this._inputPort,this._outputPort]}}}if("use strict",window.C3_IsSupported){"undefined"!=typeof OffscreenCanvas;window.c3_runtimeInterface=new RuntimeInterface({useWorker:!1,workerMainUrl:"workermain.js",engineScripts:["scripts/c3runtime.js"],scriptFolder:"scripts/",workerDependencyScripts:[],exportType:"html5"})}{const b=class extends DOMHandler{constructor(b){super(b,"touch"),this.AddRuntimeMessageHandler("request-permission",b=>this._OnRequestPermission(b))}async _OnRequestPermission(d){const a=d.type;let b=!0;0===a?b=await this._RequestOrientationPermission():1===a&&(b=await this._RequestMotionPermission()),this.PostToRuntime("permission-result",{type:a,result:b})}async _RequestOrientationPermission(){if(!self.DeviceOrientationEvent||!self.DeviceOrientationEvent.requestPermission)return!0;try{const b=await self.DeviceOrientationEvent.requestPermission();return"granted"===b}catch(b){return console.warn("[Touch] Failed to request orientation permission: ",b),!1}}async _RequestMotionPermission(){if(!self.DeviceMotionEvent||!self.DeviceMotionEvent.requestPermission)return!0;try{const b=await self.DeviceMotionEvent.requestPermission();return"granted"===b}catch(b){return console.warn("[Touch] Failed to request motion permission: ",b),!1}}};RuntimeInterface.AddDOMHandlerClass(b)}{function g(b){b.stopPropagation()}const a=class extends DOMElementHandler{constructor(b){super(b,"button")}CreateElement(a,b){const c=document.createElement("input"),d=b.isCheckbox;let e=c;if(d){c.type="checkbox";const b=document.createElement("label");b.appendChild(c),b.appendChild(document.createTextNode("")),b.style.fontFamily="sans-serif",b.style.userSelect="none",b.style.webkitUserSelect="none",b.style.display="inline-block",b.style.color="black",e=b}else c.type="button";return e.style.position="absolute",e.addEventListener("touchstart",g),e.addEventListener("touchmove",g),e.addEventListener("touchend",g),e.addEventListener("mousedown",g),e.addEventListener("mouseup",g),e.addEventListener("keydown",g),e.addEventListener("keyup",g),c.addEventListener("click",()=>this._PostToRuntimeElementMaybeSync("click",a,{isChecked:c.checked})),c.id=b.id,this.UpdateState(e,b),e}_GetInputElem(b){return"input"===b.tagName.toLowerCase()?b:b.firstChild}UpdateState(d,a){const b=this._GetInputElem(d);b.checked=a.isChecked,b.disabled=!a.isEnabled,d.title=a.title,d===b?b.value=a.text:d.lastChild.textContent=a.text}};RuntimeInterface.AddDOMHandlerClass(a)}