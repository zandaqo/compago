!function(t){var e={};function s(i){if(e[i])return e[i].exports;var n=e[i]={i:i,l:!1,exports:{}};return t[i].call(n.exports,n,n.exports,s),n.l=!0,n.exports}s.m=t,s.c=e,s.d=function(t,e,i){s.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},s.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},s.t=function(t,e){if(1&e&&(t=s(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)s.d(i,n,function(e){return t[e]}.bind(null,n));return i},s.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return s.d(e,"a",e),e},s.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},s.p="",s(s.s=0)}([function(t,e,s){"use strict";s.r(e);
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const i=new WeakMap,n=t=>"function"==typeof t&&i.has(t),r="undefined"!=typeof window&&null!=window.customElements&&void 0!==window.customElements.polyfillWrapFlushCallback,o=(t,e,s=null,i=null)=>{for(;e!==s;){const s=e.nextSibling;t.insertBefore(e,i),e=s}},a=(t,e,s=null)=>{for(;e!==s;){const s=e.nextSibling;t.removeChild(e),e=s}},l={},c={},h=`{{lit-${String(Math.random()).slice(2)}}}`,d=`\x3c!--${h}--\x3e`,u=new RegExp(`${h}|${d}`);class p{constructor(t,e){this.parts=[],this.element=e;const s=[],i=[],n=document.createTreeWalker(e.content,133,null,!1);let r=0,o=-1,a=0;const{strings:l,values:{length:c}}=t;for(;a<c;){const t=n.nextNode();if(null!==t){if(o++,1===t.nodeType){if(t.hasAttributes()){const e=t.attributes,{length:s}=e;let i=0;for(let t=0;t<s;t++)m(e[t].name,"$lit$")&&i++;for(;i-- >0;){const e=l[a],s=v.exec(e)[2],i=s.toLowerCase()+"$lit$",n=t.getAttribute(i);t.removeAttribute(i);const r=n.split(u);this.parts.push({type:"attribute",index:o,name:s,strings:r}),a+=r.length-1}}"TEMPLATE"===t.tagName&&(i.push(t),n.currentNode=t.content)}else if(3===t.nodeType){const e=t.data;if(e.indexOf(h)>=0){const i=t.parentNode,n=e.split(u),r=n.length-1;for(let e=0;e<r;e++){let s,r=n[e];if(""===r)s=g();else{const t=v.exec(r);null!==t&&m(t[2],"$lit$")&&(r=r.slice(0,t.index)+t[1]+t[2].slice(0,-"$lit$".length)+t[3]),s=document.createTextNode(r)}i.insertBefore(s,t),this.parts.push({type:"node",index:++o})}""===n[r]?(i.insertBefore(g(),t),s.push(t)):t.data=n[r],a+=r}}else if(8===t.nodeType)if(t.data===h){const e=t.parentNode;null!==t.previousSibling&&o!==r||(o++,e.insertBefore(g(),t)),r=o,this.parts.push({type:"node",index:o}),null===t.nextSibling?t.data="":(s.push(t),o--),a++}else{let e=-1;for(;-1!==(e=t.data.indexOf(h,e+1));)this.parts.push({type:"node",index:-1}),a++}}else n.currentNode=i.pop()}for(const t of s)t.parentNode.removeChild(t)}}const m=(t,e)=>{const s=t.length-e.length;return s>=0&&t.slice(s)===e},f=t=>-1!==t.index,g=()=>document.createComment(""),v=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
class y{constructor(t,e,s){this.__parts=[],this.template=t,this.processor=e,this.options=s}update(t){let e=0;for(const s of this.__parts)void 0!==s&&s.setValue(t[e]),e++;for(const t of this.__parts)void 0!==t&&t.commit()}_clone(){const t=r?this.template.element.content.cloneNode(!0):document.importNode(this.template.element.content,!0),e=[],s=this.template.parts,i=document.createTreeWalker(t,133,null,!1);let n,o=0,a=0,l=i.nextNode();for(;o<s.length;)if(n=s[o],f(n)){for(;a<n.index;)a++,"TEMPLATE"===l.nodeName&&(e.push(l),i.currentNode=l.content),null===(l=i.nextNode())&&(i.currentNode=e.pop(),l=i.nextNode());if("node"===n.type){const t=this.processor.handleTextExpression(this.options);t.insertAfterNode(l.previousSibling),this.__parts.push(t)}else this.__parts.push(...this.processor.handleAttributeExpressions(l,n.name,n.strings,this.options));o++}else this.__parts.push(void 0),o++;return r&&(document.adoptNode(t),customElements.upgrade(t)),t}}
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */const _=` ${h} `;class b{constructor(t,e,s,i){this.strings=t,this.values=e,this.type=s,this.processor=i}getHTML(){const t=this.strings.length-1;let e="",s=!1;for(let i=0;i<t;i++){const t=this.strings[i],n=t.lastIndexOf("\x3c!--");s=(n>-1||s)&&-1===t.indexOf("--\x3e",n+1);const r=v.exec(t);e+=null===r?t+(s?_:d):t.substr(0,r.index)+r[1]+r[2]+"$lit$"+r[3]+h}return e+=this.strings[t],e}getTemplateElement(){const t=document.createElement("template");return t.innerHTML=this.getHTML(),t}}
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const S=t=>null===t||!("object"==typeof t||"function"==typeof t),w=t=>Array.isArray(t)||!(!t||!t[Symbol.iterator]);class E{constructor(t,e,s){this.dirty=!0,this.element=t,this.name=e,this.strings=s,this.parts=[];for(let t=0;t<s.length-1;t++)this.parts[t]=this._createPart()}_createPart(){return new x(this)}_getValue(){const t=this.strings,e=t.length-1;let s="";for(let i=0;i<e;i++){s+=t[i];const e=this.parts[i];if(void 0!==e){const t=e.value;if(S(t)||!w(t))s+="string"==typeof t?t:String(t);else for(const e of t)s+="string"==typeof e?e:String(e)}}return s+=t[e],s}commit(){this.dirty&&(this.dirty=!1,this.element.setAttribute(this.name,this._getValue()))}}class x{constructor(t){this.value=void 0,this.committer=t}setValue(t){t===l||S(t)&&t===this.value||(this.value=t,n(t)||(this.committer.dirty=!0))}commit(){for(;n(this.value);){const t=this.value;this.value=l,t(this)}this.value!==l&&this.committer.commit()}}class C{constructor(t){this.value=void 0,this.__pendingValue=void 0,this.options=t}appendInto(t){this.startNode=t.appendChild(g()),this.endNode=t.appendChild(g())}insertAfterNode(t){this.startNode=t,this.endNode=t.nextSibling}appendIntoPart(t){t.__insert(this.startNode=g()),t.__insert(this.endNode=g())}insertAfterPart(t){t.__insert(this.startNode=g()),this.endNode=t.endNode,t.endNode=this.startNode}setValue(t){this.__pendingValue=t}commit(){if(null===this.startNode.parentNode)return;for(;n(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=l,t(this)}const t=this.__pendingValue;t!==l&&(S(t)?t!==this.value&&this.__commitText(t):t instanceof b?this.__commitTemplateResult(t):t instanceof Node?this.__commitNode(t):w(t)?this.__commitIterable(t):t===c?(this.value=c,this.clear()):this.__commitText(t))}__insert(t){this.endNode.parentNode.insertBefore(t,this.endNode)}__commitNode(t){this.value!==t&&(this.clear(),this.__insert(t),this.value=t)}__commitText(t){const e=this.startNode.nextSibling,s="string"==typeof(t=null==t?"":t)?t:String(t);e===this.endNode.previousSibling&&3===e.nodeType?e.data=s:this.__commitNode(document.createTextNode(s)),this.value=t}__commitTemplateResult(t){const e=this.options.templateFactory(t);if(this.value instanceof y&&this.value.template===e)this.value.update(t.values);else{const s=new y(e,t.processor,this.options),i=s._clone();s.update(t.values),this.__commitNode(i),this.value=s}}__commitIterable(t){Array.isArray(this.value)||(this.value=[],this.clear());const e=this.value;let s,i=0;for(const n of t)s=e[i],void 0===s&&(s=new C(this.options),e.push(s),0===i?s.appendIntoPart(this):s.insertAfterPart(e[i-1])),s.setValue(n),s.commit(),i++;i<e.length&&(e.length=i,this.clear(s&&s.endNode))}clear(t=this.startNode){a(this.startNode.parentNode,t.nextSibling,this.endNode)}}class P{constructor(t,e,s){if(this.value=void 0,this.__pendingValue=void 0,2!==s.length||""!==s[0]||""!==s[1])throw new Error("Boolean attributes can only contain a single expression");this.element=t,this.name=e,this.strings=s}setValue(t){this.__pendingValue=t}commit(){for(;n(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=l,t(this)}if(this.__pendingValue===l)return;const t=!!this.__pendingValue;this.value!==t&&(t?this.element.setAttribute(this.name,""):this.element.removeAttribute(this.name),this.value=t),this.__pendingValue=l}}class N extends E{constructor(t,e,s){super(t,e,s),this.single=2===s.length&&""===s[0]&&""===s[1]}_createPart(){return new k(this)}_getValue(){return this.single?this.parts[0].value:super._getValue()}commit(){this.dirty&&(this.dirty=!1,this.element[this.name]=this._getValue())}}class k extends x{}let O=!1;(()=>{try{const t={get capture(){return O=!0,!1}};window.addEventListener("test",t,t),window.removeEventListener("test",t,t)}catch(t){}})();class A{constructor(t,e,s){this.value=void 0,this.__pendingValue=void 0,this.element=t,this.eventName=e,this.eventContext=s,this.__boundHandleEvent=t=>this.handleEvent(t)}setValue(t){this.__pendingValue=t}commit(){for(;n(this.__pendingValue);){const t=this.__pendingValue;this.__pendingValue=l,t(this)}if(this.__pendingValue===l)return;const t=this.__pendingValue,e=this.value,s=null==t||null!=e&&(t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive),i=null!=t&&(null==e||s);s&&this.element.removeEventListener(this.eventName,this.__boundHandleEvent,this.__options),i&&(this.__options=T(t),this.element.addEventListener(this.eventName,this.__boundHandleEvent,this.__options)),this.value=t,this.__pendingValue=l}handleEvent(t){"function"==typeof this.value?this.value.call(this.eventContext||this.element,t):this.value.handleEvent(t)}}const T=t=>t&&(O?{capture:t.capture,passive:t.passive,once:t.once}:t.capture)
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */;const M=new class{handleAttributeExpressions(t,e,s,i){const n=e[0];if("."===n){return new N(t,e.slice(1),s).parts}return"@"===n?[new A(t,e.slice(1),i.eventContext)]:"?"===n?[new P(t,e.slice(1),s)]:new E(t,e,s).parts}handleTextExpression(t){return new C(t)}};
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */function j(t){let e=$.get(t.type);void 0===e&&(e={stringsArray:new WeakMap,keyString:new Map},$.set(t.type,e));let s=e.stringsArray.get(t.strings);if(void 0!==s)return s;const i=t.strings.join(h);return s=e.keyString.get(i),void 0===s&&(s=new p(t,t.getTemplateElement()),e.keyString.set(i,s)),e.stringsArray.set(t.strings,s),s}const $=new Map,R=new WeakMap;
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
"undefined"!=typeof window&&(window.litHtmlVersions||(window.litHtmlVersions=[])).push("1.2.1");const V=(t,...e)=>new b(t,e,"html",M),L=(t,e)=>{const s=t.startNode.parentNode,i=void 0===e?t.endNode:e.startNode,n=s.insertBefore(g(),i);s.insertBefore(g(),i);const r=new C(t.options);return r.insertAfterNode(n),r},U=(t,e)=>(t.setValue(e),t.commit(),t),I=(t,e,s)=>{const i=t.startNode.parentNode,n=s?s.startNode:t.endNode,r=e.endNode.nextSibling;r!==n&&o(i,e.startNode,r,n)},q=t=>{a(t.startNode.parentNode,t.startNode,t.endNode.nextSibling)},z=(t,e,s)=>{const i=new Map;for(let n=e;n<=s;n++)i.set(t[n],n);return i},W=new WeakMap,F=new WeakMap,H=(B=(t,e,s)=>{let i;return void 0===s?s=e:void 0!==e&&(i=e),e=>{if(!(e instanceof C))throw new Error("repeat can only be used in text bindings");const n=W.get(e)||[],r=F.get(e)||[],o=[],a=[],l=[];let c,h,d=0;for(const e of t)l[d]=i?i(e,d):d,a[d]=s(e,d),d++;let u=0,p=n.length-1,m=0,f=a.length-1;for(;u<=p&&m<=f;)if(null===n[u])u++;else if(null===n[p])p--;else if(r[u]===l[m])o[m]=U(n[u],a[m]),u++,m++;else if(r[p]===l[f])o[f]=U(n[p],a[f]),p--,f--;else if(r[u]===l[f])o[f]=U(n[u],a[f]),I(e,n[u],o[f+1]),u++,f--;else if(r[p]===l[m])o[m]=U(n[p],a[m]),I(e,n[p],n[u]),p--,m++;else if(void 0===c&&(c=z(l,m,f),h=z(r,u,p)),c.has(r[u]))if(c.has(r[p])){const t=h.get(l[m]),s=void 0!==t?n[t]:null;if(null===s){const t=L(e,n[u]);U(t,a[m]),o[m]=t}else o[m]=U(s,a[m]),I(e,s,n[u]),n[t]=null;m++}else q(n[p]),p--;else q(n[u]),u++;for(;m<=f;){const t=L(e,o[f+1]);U(t,a[m]),o[m++]=t}for(;u<=p;){const t=n[u++];null!==t&&q(t)}W.set(e,o),F.set(e,l)}},(...t)=>{const e=B(...t);return i.set(e,!0),e});var B;function D(t){return(D="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function J(t,e){for(var s=0;s<e.length;s++){var i=e[s];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(t,i.key,i)}}
/*!
 * @copyright 2017- Commenthol
 * @license
 */
var X=/([a-zA-Z_$][a-zA-Z_$0-9]{0,50})/,Z=new RegExp("\\$\\+{".concat(X.source,"}"),"g"),G=new RegExp("^[?:]&".concat(X.source)),K=new RegExp("^[?:]<".concat(X.source,">([^]*)")),Q=/([\\]?[()])/g,Y=/\(\)/g;var tt=function(){function t(e,s){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t);var i=function(t,e){var s={},i={};(t=t||"")instanceof RegExp&&((e=e||t.flags||"")||(t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.global&&(e+="g")),t=t.source);var n={count:0,groups:[""],names:[]},r=0,o=t.split(Q);return{source:o.map((function(t,e){var a,l;switch(t){case"(":n.groups.push(""),n.names.push("");break;case")":l=n.groups.pop(),(a=n.names.pop())&&(i[a]=l.substr(1));break;default:"("===o[e-1]&&!/^\?[:!=]/.test(t)&&(r++,(a=K.exec(t))&&a[1]?(s[a[1]]?s[n.count++]=r:(n.names[n.names.length-1]=a[1],s[a[1]]=r),t=a[2]||"",")"!==o[e+1]||a[2]||(t="[^]+")):s[n.count++]=r,(a=G.exec(t))&&a[1]&&(t=i[a[1]]||""))}return n.groups=n.groups.map((function(e){return e+t})),t})).join("").replace(Y,""),flags:e,groups:s,named:i}}(e,s);this.regex=new RegExp(i.source,i.flags),this.source=this.regex.source,this.groups=i.groups}var e,s,i;return e=t,(s=[{key:"exec",value:function(t){var e=this,s=this.regex.exec(t);return s&&(s.groups={},Object.keys(this.groups).forEach((function(t){s.groups[t]=s[e.groups[t]]}))),s}},{key:"test",value:function(t){return this.regex.test(t)}},{key:"toString",value:function(){return this.regex.toString()}},{key:Symbol.replace,value:function(t,e){var s=this,i=e;switch(D(i)){case"string":i=i.replace(Z,(function(t,e){var i=s.groups[e];return null==i?"":"$"+s.groups[e]}));break;case"function":i=e.bind(this);break;default:return String(i)}return t.replace(this.regex,i)}},{key:Symbol.match,value:function(t){return this.exec(t)}},{key:Symbol.split,value:function(t){return t.split(this.regex)}},{key:Symbol.search,value:function(t){return t.search(this.regex)}}])&&J(e.prototype,s),i&&J(e,i),t}(),et=(t=Object)=>EventTarget.prototype.isPrototypeOf(t.prototype)?t:t===Object?EventTarget:class extends t{constructor(){super(),Object.defineProperty(this,Symbol.for("c_fragment"),{value:new EventTarget,enumerable:!1,writable:!0,configurable:!0})}addEventListener(...t){return this[Symbol.for("c_fragment")].addEventListener(...t)}removeEventListener(...t){return this[Symbol.for("c_fragment")].removeEventListener(...t)}dispatchEvent(...t){return this[Symbol.for("c_fragment")].dispatchEvent(...t)}};const st=Object.seal(Object.create(null)),it=t=>"object"==typeof t&&null!==t&&("[object Object]"===Object.prototype.toString.call(t)||"[object Array]"===Object.prototype.toString.call(t));class nt extends EventTarget{constructor(t,{collection:e,storage:s}=st){return super(),nt.definePrivate(this,{[Symbol.for("c_collection")]:e,[Symbol.for("c_storage")]:s,addEventListener:this.addEventListener.bind(this),removeEventListener:this.removeEventListener.bind(this),dispatchEvent:this.dispatchEvent.bind(this)}),this.set(t),this.constructor._getProxy(this,"",this,[this])}set(t){return Object.keys(this).forEach(t=>delete this[t]),Object.assign(this,t)}assign(t){return Object.assign(this,t)}merge(t,e=this){return Object.keys(t).forEach(s=>{const i=t[s],n=e[s];e[s]=it(n)&&it(i)?this.merge(i,n):e[s]=i}),e}get id(){return this[this.constructor.idAttribute]}toJSON(){return{...this}}read(t=st){return this.sync("read",t).then(e=>{if(!t.skip){this[t.method in this?t.method:"assign"](e)}return t.silent||this.dispatchEvent(new CustomEvent("sync",{detail:{emitter:this,response:e,options:t}})),e}).catch(e=>{throw this.dispatchEvent(new CustomEvent("error",{detail:{emitter:this,error:e,options:t}})),e})}write(t=st){return this.sync("write",t).then(e=>{if(it(e)&&!t.skip){this[t.method in this?t.method:"assign"](e)}return t.silent||this.dispatchEvent(new CustomEvent("sync",{detail:{emitter:this,response:e,options:t}})),e}).catch(e=>{throw this.dispatchEvent(new CustomEvent("error",{detail:{emitter:this,error:e,options:t}})),e})}erase(t=st){return this.sync("erase",t).then(e=>(t.silent||this.dispatchEvent(new CustomEvent("sync",{detail:{emitter:this,response:e,options:t}})),t.keep||this.dispose(),e)).catch(e=>{throw this.dispatchEvent(new CustomEvent("error",{detail:{emitter:this,error:e,options:t}})),e})}sync(t,e){const s=this[Symbol.for("c_collection")],i=s&&s.storage?s.storage:this[Symbol.for("c_storage")];return i?i.sync(t,this,e):Promise.reject(new Error("Storage is not defined."))}dispose({silent:t}=st){return t||this.dispatchEvent(new CustomEvent("dispose",{detail:{emitter:this}})),this}static definePrivate(t,e){Reflect.ownKeys(e).forEach(s=>{Object.defineProperty(t,s,{value:e[s],enumerable:!1,writable:!0,configurable:!0})})}static _emitChanges(t,e,s,i){t.dispatchEvent(new CustomEvent("change",{detail:{emitter:t,path:`${e}:${s}`,previous:i}}))}static _getProxy(t,e,s,i){let n;return t[Symbol.for("c_model")]?(n=t,n[Symbol.for("c_model")]=s,n[Symbol.for("c_path")]=e):(n=new Proxy(t,this.proxyHandler),this.definePrivate(n,{[Symbol.for("c_model")]:s,[Symbol.for("c_path")]:e}),t===s&&(t[Symbol.for("c_model")]=n,s=n)),Object.keys(t).forEach(n=>{it(t[n])&&!i.includes(t[n])&&(i.push(t[n]),t[n]=this._getProxy(t[n],`${e}:${n}`,s,i))}),n}}nt.idAttribute="_id",nt.proxyHandler={set(t,e,s,i){if("symbol"==typeof e||Reflect.has(t,e)&&!t.propertyIsEnumerable(e))return Reflect.set(t,e,s,i),!0;if(function t(e,s){if(e===s)return!0;if(e&&s&&"object"==typeof e&&"object"==typeof s){const i=Array.isArray(e),n=Array.isArray(s);let r,o,a;if(i&&n){if(o=e.length,o!==s.length)return!1;for(r=o;0!=r--;)if(!t(e[r],s[r]))return!1;return!0}if(i!==n)return!1;const l=e instanceof Date,c=s instanceof Date;if(l!==c)return!1;if(l&&c)return e.getTime()===s.getTime();const h=e instanceof RegExp,d=s instanceof RegExp;if(h!==d)return!1;if(h&&d)return e.toString()===s.toString();const u=Object.keys(e);if(o=u.length,o!==Object.keys(s).length)return!1;for(r=o;0!=r--;)if(!s.hasOwnProperty(u[r]))return!1;for(r=o;0!=r--;)if(a=u[r],!t(e[a],s[a]))return!1;return!0}return e!=e&&s!=s}(t[e],s))return!0;const n=t[Symbol.for("c_path")],r=t[Symbol.for("c_model")],o=t[e];return t[e]=it(s)?nt._getProxy(s,`${n}:${e}`,r,[s]):s,nt._emitChanges(r,n,e,o),!0},deleteProperty(t,e){if(!Reflect.has(t,e))return!0;if("symbol"==typeof e||!t.propertyIsEnumerable(e))return delete t[e],!0;const s=t[Symbol.for("c_path")],i=t[Symbol.for("c_model")],n=t[e];return delete t[e],nt._emitChanges(i,s,e,n),!0}};var rt=nt;const ot=Object.seal(Object.create(null));class at extends(et(Array)){constructor(t,e={}){const{storage:s,model:i,comparator:n}=e;super(),this.storage=s,this.Model=i||rt,this.comparator=n,this._byId={},e.silent=!0,this._onModelEvent=this._onModelEvent.bind(this),t&&this.set(t,e)}set(t=[],e={}){const{keep:s,at:i,silent:n,unsorted:r}=e,o=this.comparator&&!Number.isInteger(i)&&!r,a=this._parseModels(t,e,o),[l,c]=a;let h=a[2];const d=[];if(!s){for(let t=this.length-1;t>=0;t-=1){const e=this[t];l.has(e)||d.push(e)}d.length&&this.unset(d,{save:e.save,silent:n})}if(c.length&&(o&&(h=!0),Number.isInteger(i)?super.splice(i,0,...c):super.push(...c)),h&&this.sort({silent:!0}),n)return this;let u=i;for(let t=0;t<c.length;t+=1)c[t].dispatchEvent(new CustomEvent("add",{detail:{emitter:c[t],at:u,sort:h,collection:this}})),Number.isInteger(i)&&(u+=1);return h&&this.dispatchEvent(new CustomEvent("sort",{detail:{emitter:this}})),(c.length||d.length)&&this.dispatchEvent(new CustomEvent("update",{detail:{emitter:this}})),this}unset(t,{silent:e,save:s}=ot){let i=!1;const n=[].concat(t);for(let t=0;t<n.length;t+=1){const r=n[t],o=this.indexOf(r);~o&&(super.splice(o,1),i=!0,e||r.dispatchEvent(new CustomEvent("remove",{detail:{emitter:r,index:o,collection:this,save:s}})),this._removeReference(r),s||r.dispose())}return!e&&i&&this.dispatchEvent(new CustomEvent("update",{detail:{emitter:this}})),this}push(...t){return this.set(t,{keep:!0,skip:!0})}pop(){const t=this[this.length-1];return this.unset(t),t}unshift(...t){return this.set(t,{keep:!0,skip:!0,at:0})}shift(){const t=this[0];return this.unset(t),t}sort(t=ot){if("function"==typeof t)super.sort(t);else{const{descending:e}=t;let s=t.comparator||this.comparator;if(!s)return this;if("string"==typeof s){const t=s;s=(s,i)=>{let n=s[t],r=i[t];if(e&&([n,r]=[r,n]),n!==r){if(n>r||void 0===n)return 1;if(n<r||void 0===r)return-1}return 0}}super.sort(s)}return t&&t.silent||this.dispatchEvent(new CustomEvent("sort",{detail:{emitter:this,options:t}})),this}reverse(){return super.reverse(),this.dispatchEvent(new CustomEvent("sort",{detail:{emitter:this}})),this}splice(t,e,...s){const i=t>=0?t:this.length+t,n=e>=0?e:this.length,r=this.slice(i,i+n);return this.unset(r),s&&s.length&&this.set(s,{keep:!0,skip:!0,at:t}),r}get(t){return this._byId[t]}where(t={},e){const s=Object.keys(t);return s.length?this[e?"find":"filter"](e=>{for(let i=0;i<s.length;i+=1){const n=s[i];if(t[n]!==e[n])return!1}return!0}):[]}read(t={}){return this.sync("read",t).then(e=>{this.set(e,t),t.silent||this.dispatchEvent(new CustomEvent("sync",{detail:{emitter:this,options:t}}))}).catch(e=>{throw this.dispatchEvent(new CustomEvent("error",{detail:{emitter:this,error:e,options:t}})),e})}toJSON(){return this.map(t=>t.toJSON())}sync(t,e){return this.storage?this.storage.sync(t,this,e):Promise.reject(new Error("Storage is not defined."))}dispose({silent:t,save:e}=ot){return t||this.dispatchEvent(new CustomEvent("dispose",{detail:{emitter:this,save:e}})),this.unset(this,{silent:!0,save:e}),this}_parseModels(t,e,s){const{keep:i,skip:n}=e,r="string"==typeof this.comparator?this.comparator:void 0,o=new Set,a=[];let l=!1;const c=[].concat(t);for(let t=0;t<c.length;t+=1){const h=c[t],d=h instanceof this.Model,u=d?this[this.indexOf(h)]:this.get(h[this.Model.idAttribute]);if(u)i||o.add(u),n||d||(u.assign(h),s&&r&&(l=!0));else{const t=this._prepareModel(h,e);if(!t)continue;this._addReference(t),a.push(t)}}return[o,a,l]}_prepareModel(t,e){return"object"==typeof t&&(t instanceof rt?t:(e.collection=this,new this.Model(t,e)))}_onModelEvent(t){const{type:e,detail:{emitter:s,collection:i,previous:n,path:r}}=t;("add"!==e&&"remove"!==e||i===this)&&("dispose"!==e?("change"===e&&r.startsWith(":"+s.constructor.idAttribute)&&(this._byId[n]=void 0,void 0!==s.id&&(this._byId[s.id]=s)),this.dispatchEvent(new CustomEvent(e,{detail:t.detail}))):this.unset(s,{save:!0}))}_addReference(t){t[Symbol.for("c_collection")]||(t[Symbol.for("c_collection")]=this),t.id&&(this._byId[t.id]=t),t.addEventListener("add",this._onModelEvent),t.addEventListener("remove",this._onModelEvent),t.addEventListener("dispose",this._onModelEvent),t.addEventListener("change",this._onModelEvent)}_removeReference(t){this._byId[t.id]=void 0,t[Symbol.for("c_collection")]===this&&(t[Symbol.for("c_collection")]=void 0),t.removeEventListener("add",this._onModelEvent),t.removeEventListener("remove",this._onModelEvent),t.removeEventListener("dispose",this._onModelEvent),t.removeEventListener("change",this._onModelEvent)}static get[Symbol.species](){return Array}}var lt=at;const ct=Object.seal(Object.create(null));class ht extends EventTarget{constructor({url:t=window.location.origin,init:e}=ct){super(),this.url=t,this.init=e}sync(t,e,{silent:s,patch:i,url:n=this.url,init:r=this.init}=ct){const o={...r},{methods:a}=this.constructor;if(o.method=a[t],!o.method)return Promise.reject(new Error("Method is not found."));const l=this.constructor.isStored(e),c=!(!i||!e.changes)&&e.changes;return l&&(n+="/"+e.id,"write"===t&&(o.method=c?a.patch:a.update)),"write"===t&&(o.body=this.serialize(c||e)),s||this.dispatchEvent(new CustomEvent("request",{detail:{emitter:this,model:e,options:o}})),this.constructor.fetch(n,o).then(t=>{if(s||this.dispatchEvent(new CustomEvent("response",{detail:{emitter:this,model:e,options:o,response:t}})),t.ok||304===t.status)return this.deserialize(t);const i=new Error(t.status);throw i.response=t,i}).catch(t=>{throw t})}dispose({silent:t}=ct){return t||this.dispatchEvent(new CustomEvent("dispose",{detail:{emitter:this}})),this}serialize(t){return JSON.stringify(t)}deserialize(t){const e=t.headers.get("content-type");return e&&~e.indexOf("application/json")?t.json():void 0}static fetch(t,e={}){return e.headers={...this.headers,...e.headers},window.fetch(t,e)}static isStored(t){return void 0!==t.id}}ht.methods={write:"POST",erase:"DELETE",read:"GET",update:"PUT",patch:"PATCH"},ht.headers={"X-Requested-With":"XMLHttpRequest","Content-Type":"application/json"};function dt(t,e){const{element:{content:s},parts:i}=t,n=document.createTreeWalker(s,133,null,!1);let r=pt(i),o=i[r],a=-1,l=0;const c=[];let h=null;for(;n.nextNode();){a++;const t=n.currentNode;for(t.previousSibling===h&&(h=null),e.has(t)&&(c.push(t),null===h&&(h=t)),null!==h&&l++;void 0!==o&&o.index===a;)o.index=null!==h?-1:o.index-l,r=pt(i,r),o=i[r]}c.forEach(t=>t.parentNode.removeChild(t))}const ut=t=>{let e=11===t.nodeType?0:1;const s=document.createTreeWalker(t,133,null,!1);for(;s.nextNode();)e++;return e},pt=(t,e=-1)=>{for(let s=e+1;s<t.length;s++){const e=t[s];if(f(e))return s}return-1};
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const mt=(t,e)=>`${t}--${e}`;let ft=!0;void 0===window.ShadyCSS?ft=!1:void 0===window.ShadyCSS.prepareTemplateDom&&(console.warn("Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1."),ft=!1);const gt=t=>e=>{const s=mt(e.type,t);let i=$.get(s);void 0===i&&(i={stringsArray:new WeakMap,keyString:new Map},$.set(s,i));let n=i.stringsArray.get(e.strings);if(void 0!==n)return n;const r=e.strings.join(h);if(n=i.keyString.get(r),void 0===n){const s=e.getTemplateElement();ft&&window.ShadyCSS.prepareTemplateDom(s,t),n=new p(e,s),i.keyString.set(r,n)}return i.stringsArray.set(e.strings,n),n},vt=["html","svg"],yt=new Set,_t=(t,e,s)=>{yt.add(t);const i=s?s.element:document.createElement("template"),n=e.querySelectorAll("style"),{length:r}=n;if(0===r)return void window.ShadyCSS.prepareTemplateStyles(i,t);const o=document.createElement("style");for(let t=0;t<r;t++){const e=n[t];e.parentNode.removeChild(e),o.textContent+=e.textContent}(t=>{vt.forEach(e=>{const s=$.get(mt(e,t));void 0!==s&&s.keyString.forEach(t=>{const{element:{content:e}}=t,s=new Set;Array.from(e.querySelectorAll("style")).forEach(t=>{s.add(t)}),dt(t,s)})})})(t);const a=i.content;s?function(t,e,s=null){const{element:{content:i},parts:n}=t;if(null==s)return void i.appendChild(e);const r=document.createTreeWalker(i,133,null,!1);let o=pt(n),a=0,l=-1;for(;r.nextNode();){for(l++,r.currentNode===s&&(a=ut(e),s.parentNode.insertBefore(e,s));-1!==o&&n[o].index===l;){if(a>0){for(;-1!==o;)n[o].index+=a,o=pt(n,o);return}o=pt(n,o)}}}(s,o,a.firstChild):a.insertBefore(o,a.firstChild),window.ShadyCSS.prepareTemplateStyles(i,t);const l=a.querySelector("style");if(window.ShadyCSS.nativeShadow&&null!==l)e.insertBefore(l.cloneNode(!0),e.firstChild);else if(s){a.insertBefore(o,a.firstChild);const t=new Set;t.add(o),dt(s,t)}};window.JSCompiler_renameProperty=(t,e)=>t;const bt={toAttribute(t,e){switch(e){case Boolean:return t?"":null;case Object:case Array:return null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){switch(e){case Boolean:return null!==t;case Number:return null===t?null:Number(t);case Object:case Array:return JSON.parse(t)}return t}},St=(t,e)=>e!==t&&(e==e||t==t),wt={attribute:!0,type:String,converter:bt,reflect:!1,hasChanged:St};class Et extends HTMLElement{constructor(){super(),this._updateState=0,this._instanceProperties=void 0,this._updatePromise=new Promise(t=>this._enableUpdatingResolver=t),this._changedProperties=new Map,this._reflectingProperties=void 0,this.initialize()}static get observedAttributes(){this.finalize();const t=[];return this._classProperties.forEach((e,s)=>{const i=this._attributeNameForProperty(s,e);void 0!==i&&(this._attributeToPropertyMap.set(i,s),t.push(i))}),t}static _ensureClassProperties(){if(!this.hasOwnProperty(JSCompiler_renameProperty("_classProperties",this))){this._classProperties=new Map;const t=Object.getPrototypeOf(this)._classProperties;void 0!==t&&t.forEach((t,e)=>this._classProperties.set(e,t))}}static createProperty(t,e=wt){if(this._ensureClassProperties(),this._classProperties.set(t,e),e.noAccessor||this.prototype.hasOwnProperty(t))return;const s="symbol"==typeof t?Symbol():"__"+t,i=this.getPropertyDescriptor(t,s,e);void 0!==i&&Object.defineProperty(this.prototype,t,i)}static getPropertyDescriptor(t,e,s){return{get(){return this[e]},set(s){const i=this[t];this[e]=s,this._requestUpdate(t,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this._classProperties&&this._classProperties.get(t)||wt}static finalize(){const t=Object.getPrototypeOf(this);if(t.hasOwnProperty("finalized")||t.finalize(),this.finalized=!0,this._ensureClassProperties(),this._attributeToPropertyMap=new Map,this.hasOwnProperty(JSCompiler_renameProperty("properties",this))){const t=this.properties,e=[...Object.getOwnPropertyNames(t),..."function"==typeof Object.getOwnPropertySymbols?Object.getOwnPropertySymbols(t):[]];for(const s of e)this.createProperty(s,t[s])}}static _attributeNameForProperty(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}static _valueHasChanged(t,e,s=St){return s(t,e)}static _propertyValueFromAttribute(t,e){const s=e.type,i=e.converter||bt,n="function"==typeof i?i:i.fromAttribute;return n?n(t,s):t}static _propertyValueToAttribute(t,e){if(void 0===e.reflect)return;const s=e.type,i=e.converter;return(i&&i.toAttribute||bt.toAttribute)(t,s)}initialize(){this._saveInstanceProperties(),this._requestUpdate()}_saveInstanceProperties(){this.constructor._classProperties.forEach((t,e)=>{if(this.hasOwnProperty(e)){const t=this[e];delete this[e],this._instanceProperties||(this._instanceProperties=new Map),this._instanceProperties.set(e,t)}})}_applyInstanceProperties(){this._instanceProperties.forEach((t,e)=>this[e]=t),this._instanceProperties=void 0}connectedCallback(){this.enableUpdating()}enableUpdating(){void 0!==this._enableUpdatingResolver&&(this._enableUpdatingResolver(),this._enableUpdatingResolver=void 0)}disconnectedCallback(){}attributeChangedCallback(t,e,s){e!==s&&this._attributeToProperty(t,s)}_propertyToAttribute(t,e,s=wt){const i=this.constructor,n=i._attributeNameForProperty(t,s);if(void 0!==n){const t=i._propertyValueToAttribute(e,s);if(void 0===t)return;this._updateState=8|this._updateState,null==t?this.removeAttribute(n):this.setAttribute(n,t),this._updateState=-9&this._updateState}}_attributeToProperty(t,e){if(8&this._updateState)return;const s=this.constructor,i=s._attributeToPropertyMap.get(t);if(void 0!==i){const t=s.getPropertyOptions(i);this._updateState=16|this._updateState,this[i]=s._propertyValueFromAttribute(e,t),this._updateState=-17&this._updateState}}_requestUpdate(t,e){let s=!0;if(void 0!==t){const i=this.constructor,n=i.getPropertyOptions(t);i._valueHasChanged(this[t],e,n.hasChanged)?(this._changedProperties.has(t)||this._changedProperties.set(t,e),!0!==n.reflect||16&this._updateState||(void 0===this._reflectingProperties&&(this._reflectingProperties=new Map),this._reflectingProperties.set(t,n))):s=!1}!this._hasRequestedUpdate&&s&&(this._updatePromise=this._enqueueUpdate())}requestUpdate(t,e){return this._requestUpdate(t,e),this.updateComplete}async _enqueueUpdate(){this._updateState=4|this._updateState;try{await this._updatePromise}catch(t){}const t=this.performUpdate();return null!=t&&await t,!this._hasRequestedUpdate}get _hasRequestedUpdate(){return 4&this._updateState}get hasUpdated(){return 1&this._updateState}performUpdate(){this._instanceProperties&&this._applyInstanceProperties();let t=!1;const e=this._changedProperties;try{t=this.shouldUpdate(e),t?this.update(e):this._markUpdated()}catch(e){throw t=!1,this._markUpdated(),e}t&&(1&this._updateState||(this._updateState=1|this._updateState,this.firstUpdated(e)),this.updated(e))}_markUpdated(){this._changedProperties=new Map,this._updateState=-5&this._updateState}get updateComplete(){return this._getUpdateComplete()}_getUpdateComplete(){return this._updatePromise}shouldUpdate(t){return!0}update(t){void 0!==this._reflectingProperties&&this._reflectingProperties.size>0&&(this._reflectingProperties.forEach((t,e)=>this._propertyToAttribute(e,this[e],t)),this._reflectingProperties=void 0),this._markUpdated()}updated(t){}firstUpdated(t){}}Et.finalized=!0;
/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const xt="adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype;Symbol();
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
(window.litElementVersions||(window.litElementVersions=[])).push("2.3.1");const Ct={};class Pt extends Et{static getStyles(){return this.styles}static _getUniqueStyles(){if(this.hasOwnProperty(JSCompiler_renameProperty("_styles",this)))return;const t=this.getStyles();if(void 0===t)this._styles=[];else if(Array.isArray(t)){const e=(t,s)=>t.reduceRight((t,s)=>Array.isArray(s)?e(s,t):(t.add(s),t),s),s=e(t,new Set),i=[];s.forEach(t=>i.unshift(t)),this._styles=i}else this._styles=[t]}initialize(){super.initialize(),this.constructor._getUniqueStyles(),this.renderRoot=this.createRenderRoot(),window.ShadowRoot&&this.renderRoot instanceof window.ShadowRoot&&this.adoptStyles()}createRenderRoot(){return this.attachShadow({mode:"open"})}adoptStyles(){const t=this.constructor._styles;0!==t.length&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow?xt?this.renderRoot.adoptedStyleSheets=t.map(t=>t.styleSheet):this._needsShimAdoptedStyleSheets=!0:window.ShadyCSS.ScopingShim.prepareAdoptedCssText(t.map(t=>t.cssText),this.localName))}connectedCallback(){super.connectedCallback(),this.hasUpdated&&void 0!==window.ShadyCSS&&window.ShadyCSS.styleElement(this)}update(t){const e=this.render();super.update(t),e!==Ct&&this.constructor.render(e,this.renderRoot,{scopeName:this.localName,eventContext:this}),this._needsShimAdoptedStyleSheets&&(this._needsShimAdoptedStyleSheets=!1,this.constructor._styles.forEach(t=>{const e=document.createElement("style");e.textContent=t.cssText,this.renderRoot.appendChild(e)}))}render(){return Ct}}Pt.finalized=!0,Pt.render=(t,e,s)=>{if(!s||"object"!=typeof s||!s.scopeName)throw new Error("The `scopeName` option is required.");const i=s.scopeName,n=R.has(e),r=ft&&11===e.nodeType&&!!e.host,o=r&&!yt.has(i),l=o?document.createDocumentFragment():e;if(((t,e,s)=>{let i=R.get(e);void 0===i&&(a(e,e.firstChild),R.set(e,i=new C(Object.assign({templateFactory:j},s))),i.appendInto(e)),i.setValue(t),i.commit()})(t,l,Object.assign({templateFactory:gt(i)},s)),o){const t=R.get(l);R.delete(l);const s=t.value instanceof y?t.value.template:void 0;_t(i,l,s),a(e,e.firstChild),e.appendChild(l),R.set(e,t)}!n&&r&&window.ShadyCSS.styleElement(e.host)};const Nt=Symbol.for("c_fragment");class kt extends Pt{bond(t){const{target:e}=t;if(!e||!e.binding)return;const{value:s="value",property:i,parse:n,prevent:r}=e.binding;r&&t.preventDefault();let o=i;const a="function"==typeof n?n(e[s]):e[s];if(":"!==o[0])return void this.setAttribute(o,a);if(o=o.slice(1),!o.includes("."))return void(this.model[o]=a);let{model:l}=this;const c=o.split("."),h=c[c.length-1];for(let t=0;t<c.length-1;t+=1)l=l[c[t]];l&&(l[h]=a)}navigate(t){const e=t&&t.target;if(!e)return;const s=e.href||e.getAttribute("data-href");s&&(t.preventDefault(),globalThis.history.pushState({},globalThis.document.title,s))}onPopstate(){const{root:t,routes:e}=this.constructor,{location:s}=globalThis;let i=decodeURIComponent(s.pathname);if(i===this[Nt])return;if(this[Nt]=i,t&&!i.startsWith(t))return;i=i.slice(t.length);const n=Object.keys(e);for(let t=0;t<n.length;t+=1){const r=n[t],o=e[r].exec(i);if(!o)continue;const a=o.groups,l=decodeURIComponent(s.hash),c={emitter:this,route:r,params:a,query:decodeURIComponent(s.search),hash:l};return void this.dispatchEvent(new CustomEvent("route",{detail:c,bubbles:!0,composed:!0}))}}async onModelChange(){await this.requestUpdate()}dispose(){this.constructor.routes&&globalThis.removeEventListener("popstate",this.onPopstate),this.model&&(this.model.removeEventListener("change",this.onModelChange),this.model=void 0)}connectedCallback(){super.connectedCallback(),this.constructor.routes&&(this[Nt]="",this.onPopstate=this.onPopstate.bind(this),globalThis.addEventListener("popstate",this.onPopstate)),this.model&&(this.onModelChange=this.onModelChange.bind(this),this.model.addEventListener("change",this.onModelChange))}disconnectedCallback(){this.dispose(),super.disconnectedCallback()}}kt.routes=void 0,kt.root="";var Ot=kt;let At=0;var Tt=class extends rt{constructor(t,e){super(t,e),this.set({...this.defaults(),...this}),this.uid=At,At+=1}defaults(){return{title:"empty todo...",order:this[Symbol.for("c_collection")].nextOrder(),completed:!1}}};var Mt=class extends lt{constructor(t,e={}){super(t,Object.assign(e,{model:Tt,comparator:"order"}))}completed(){return this.filter(t=>t.completed)}remaining(){return this.filter(t=>!t.completed)}nextOrder(){return this.length?this[this.length-1].order+1:1}};class jt extends Ot{constructor(){super(),this.model=new Mt}connectedCallback(){super.connectedCallback(),this.setAttribute("data-filter","all"),this.addEventListener("route",this.onFilterRoute.bind(this)),this.model.addEventListener("add",this.onModelChange),this.model.addEventListener("remove",this.onModelChange)}getTodoModel(t){const e=t.closest("[data-lid]");if(e)return this.model[parseInt(e.getAttribute("data-lid"),10)]}toggleCompleted(t){const e=this.getTodoModel(t.target);e&&e.toggleComplete()}edit(t){const e=this.getTodoModel(t.target);if(e){e.editing=!0;const t=this.model.indexOf(e),s=this.querySelector(`[data-lid="${t}"] .edit`);s&&s.focus()}}updateOnEnter(t){13===t.which&&this.close(t)}revertOnEscape(t){const e=this.getTodoModel(t.target);e&&27===t.which&&(e.editing=!1)}close(t){const e=this.getTodoModel(t.target),s=t.target.value&&t.target.value.trim();e&&s&&(e.title=s,e.editing=!1)}destroy(t){const e=this.getTodoModel(t.target);e&&this.model.unset(e)}createOnEnter(t){const e=t.target.value.trim();13===t.which&&e&&(t.target.value="",this.model.push({title:e,order:this.model.nextOrder(),completed:!1}))}clearCompleted(){return this.model.unset(this.model.completed()),!1}toggleAllComplete(){const t=this.querySelector("#toggle-all").checked;this.model.forEach(e=>{e.completed=t})}onFilterRoute(t){this.setAttribute("data-filter",t.detail.params.filter)}render(){const{model:t}=this,e=t.remaining().length,s=t.completed().length,i=this.getAttribute("data-filter"),n=t.map(t=>{const e=[];return t.completed&&e.push("completed"),t.editing&&e.push("editing"),e.join(" ")});return V` <link rel="stylesheet" href="styles.css" />
      <div>
        <header id="header">
          <h1>todos</h1>
          <input
            id="new-todo"
            @keypress="${this.createOnEnter}"
            class="new-todo"
            placeholder="What needs to be done?"
            autofocus
          />
        </header>
        <section id="main" class="main" ?hidden=${!t.length}>
          <input
            id="toggle-all"
            @click="${this.toggleAllComplete}"
            class="toggle-all"
            type="checkbox"
            .checked="${!e}"
          />
          <label for="toggle-all">Mark all as complete</label>
          <ul id="todo-list" class="todo-list">
            ${H(t,t=>t.uid,(t,e)=>{const s=t.completed?"completed":"active",r="all"===i||i===s;return V`<li
                  class="${n[e]}"
                  ?hidden="${!r}"
                  data-lid="${e}"
                >
                  <div class="view">
                    <input
                      class="toggle"
                      @click="${this.toggleCompleted}"
                      type="checkbox"
                      .checked="${t.completed}"
                    />
                    <label @dblclick="${this.edit}">${t.title}</label>
                    <button class="destroy" @click="${this.destroy}"></button>
                  </div>
                  <input
                    class="edit"
                    @keypress="${this.updateOnEnter}"
                    @keydown="${this.revertOnEscape}"
                    @focusout="${this.close}"
                    type="text"
                    .value="${t.title}"
                  />
                </li>`})}
          </ul>
        </section>
        <footer id="footer" class="footer" ?hidden="${!t.length}">
          <span id="todo-count" class="todo-count">
            <strong>${e}</strong> ${1===e?" item":" items"} left</span
          >
          <ul id="filters" class="filters">
            <li>
              <a
                href="/all"
                @click="${this.navigate}"
                class="${"all"===i?"selected":""}"
              >
                All
              </a>
            </li>
            <li>
              <a
                href="/active"
                @click="${this.navigate}"
                class="${"active"===i?"selected":""}"
                >Active</a
              >
            </li>
            <li>
              <a
                href="/completed"
                @click="${this.navigate}"
                class="${"completed"===i?"selected":""}"
                >Completed</a
              >
            </li>
          </ul>
          <button
            id="clear-completed"
            @click="${this.clearCompleted}"
            class="clear-completed"
            hidden="${!s}"
          >
            Clear completed ${s}
          </button>
        </footer>
      </div>`}}jt.root=window.location.pathname.slice(0,-1),jt.routes={filter:new tt("/(?<filter>[^]+)")},customElements.define("todo-app",jt);document.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("todo-app");document.querySelector("#todoapp").appendChild(t)})}]);