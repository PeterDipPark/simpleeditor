// Core
import {EditorState, Plugin} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema as schema_model, DOMParser, DOMSerializer} from "prosemirror-model"
// import {schema as schema_basic} from "prosemirror-schema-basic"
import {schema as schema_basic} from "se-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
// import {exampleSetup} from "prosemirror-example-setup"
import {setup as setup_basic} from "se-setup-basic"
import {undo, redo, history} from "prosemirror-history"
import {keymap} from "prosemirror-keymap"
import {baseKeymap, chainCommands, exitCode, toggleMark, setBlockType, wrapIn} from "prosemirror-commands"

// NEW 
function create(dom_, content_, callback_upload_, callback_update_, callback_scope_, opt_devTools_) {


	// Mix the nodes from prosemirror-schema-list into the basic schema to create a schema with list support.
		const mySchema = new schema_model({
			// extend default schema with schema-list
			nodes: addListNodes(schema_basic.spec.nodes,  "paragraph (paragraph | ordered_list | bullet_list)*", "block"), //->THIS WILL ALLOW LI SPLITING and DISABLE PASTING OTHER BLOCK CONTENT like img title etc. // OTHERS FAILS //"inline*", "block"),  //"paragraph block*", "block"), //"paragraph (ordered_list | bullet_list)*"
			// default schema makrs
			marks: schema_basic.spec.marks
		})


	// Init (non IE)
		/*
		let oDomEdit = document.getElementById('editor');
		let oState = EditorState.create({
			doc: DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
			schema: mySchema
			,plugins: customSetup({schema: mySchema})
		})
		let oView = new EditorView({ mount: oDomEdit}, {
			state: oState,
			dispatchTransaction(transaction) {
			    // console.log("Document size went from", transaction.before.content.size,
			    //             "to", transaction.doc.content.size);
			   	//console.warn("changed?", transaction.steps.length);
			   	let newState = oView.state.apply(transaction)
			    oView.updateState(newState)
			    // now we can grab new source if changed
			    if (transaction.steps.length!=0) {
			    	// changed					    	
			   			//console.log("STORE NEW HTML", oDomEdit.innerHTML);
			   	}
			    
			  }
		})
		*/

	// Init (IE safe)
							

		// Init editor
			const oDomEdit = dom_; //document.getElementById('editor');
			const oDomContent = content_ || "";
			const parser = (content) => {
			    let domNode = document.createElement("div");
			    domNode.innerHTML = content;
			    return DOMParser.fromSchema(mySchema).parse(domNode);
			}
			const oState = EditorState.create({
				doc: parser(oDomContent), //DOMParser.fromSchema(mySchema).parse(document.querySelector("#content")),
				schema: mySchema
				,plugins: setup_basic({schema: mySchema}, callback_upload_)
			});
			const oView = new EditorView({mount: oDomEdit}, {state: oState
						// TEST:
						// ,nodeViews: {
					 //    	link(node) {
					 //    		//console.log("node",node);
					 //    			return new LinkView(node)
						// 		}
					 //    }
					}
				);

		// Export Methods
			const oExport = {
				toHTML(state) {
					let fragment = DOMSerializer.fromSchema(state.schema).serializeFragment(state.doc.content);
				    let tmp = document.createElement("div");
				    tmp.appendChild(fragment);
				    let html = tmp.innerHTML;
				    // tmp.remove();
				    // tmp.parentNode.removeChild(tmp);
				    return html;
				}
				// ,toAMP(state) {
				// 	// tbd
				// }
				// ,toMarkdown(state) {
				// 	// tbd
				// }
				// ,toPDF(state) {
				// 	// tbd
				// }
				// ,toWord(state) {
				// 	// tbd
				// } 
				// ,toWordPress(state) {
				// 	// tbd
				// }
				// ,toGoogleDocs(state) {
				// 	// tbd
				// }
			}

		// Return stripped View object		
			const oEditor = {
				destroy() {								
					oView.destroy();
					// DODO: [destroy-editor] Still we have active objects....
					// console.log(oView.state);
					// console.log(oView.state.plugins);
					// oView = null;
					// oState = null;
					// mySchema = null;
					// oDomEdit = null;
					// parser = null;
					// oState = null;
				},
				html(opt_html_) {
					if (opt_html_ && oDomEdit!==null) {						 
						oDomEdit.innerHTML = opt_html_;
					} else if (oView!=null) {
						//return oView.toHTML();
						return oExport.toHTML(oView.state);
						// DODO: [export-html] Abstract - remove toHTML() from library
						// SEE: https://discuss.prosemirror.net/t/saving-content-containing-dom-generated-by-nodeview/2594/5
						// let scratch = document.createElement("div")
						// scratch.appendChild(DOMSerializer.fromSchema(mySchema).serializeFragment(myDoc.content))
						// return scratch.innerHTML
					}
				}
				// ,testme() {
				// 	return oView;
				// } 
			}


		// Callbacks (if callback_scope_ not set, use oEditor as scope)
			if (callback_update_) {				
			    // Dispatch
				oView.props.dispatchTransaction = function(transaction) {
						// Test
							// console.log("Document size went from", transaction.before.content.size, "to", transaction.doc.content.size);
						// Apply editor changes
							var newState = oView.state.apply(transaction)
							oView.updateState(newState)
					    // now we can grab new source if changed
						    if (transaction.steps.length!=0) {
						    	// Send new html
						    	callback_update_.call(callback_scope_||oEditor, oExport.toHTML(oView.state));
						   	}
				}
			}

		// Dev Tools (https://github.com/d4rkr00t/prosemirror-dev-tools)
		// Must have script loaded: <script src="https://unpkg.com/prosemirror-dev-tools@2.1.1/dist/umd/prosemirror-dev-tools.min.js"></script>
		// This has issues with IE so we can use this only in Chrome, Safari...
			// if (opt_devTools_) {
			// 	ProseMirrorDevTools.applyDevTools(oView, { EditorState: EditorState });
			// }
		
		// Return
			return oEditor;
}

// POLIFILLs

	// PROMISE:
		// move to separate files and load via script or module based on browser support
		// E.g: https://www.npmjs.com/package/promise-polyfill
		// !function(e,n){"object"==typeof exports&&"undefined"!=typeof module?n():"function"==typeof define&&define.amd?define(n):n()}(0,function(){"use strict";function e(e){var n=this.constructor;return this.then(function(t){return n.resolve(e()).then(function(){return t})},function(t){return n.resolve(e()).then(function(){return n.reject(t)})})}function n(e){return!(!e||"undefined"==typeof e.length)}function t(){}function o(e){if(!(this instanceof o))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=undefined,this._deferreds=[],c(e,this)}function r(e,n){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,o._immediateFn(function(){var t=1===e._state?n.onFulfilled:n.onRejected;if(null!==t){var o;try{o=t(e._value)}catch(r){return void f(n.promise,r)}i(n.promise,o)}else(1===e._state?i:f)(n.promise,e._value)})):e._deferreds.push(n)}function i(e,n){try{if(n===e)throw new TypeError("A promise cannot be resolved with itself.");if(n&&("object"==typeof n||"function"==typeof n)){var t=n.then;if(n instanceof o)return e._state=3,e._value=n,void u(e);if("function"==typeof t)return void c(function(e,n){return function(){e.apply(n,arguments)}}(t,n),e)}e._state=1,e._value=n,u(e)}catch(r){f(e,r)}}function f(e,n){e._state=2,e._value=n,u(e)}function u(e){2===e._state&&0===e._deferreds.length&&o._immediateFn(function(){e._handled||o._unhandledRejectionFn(e._value)});for(var n=0,t=e._deferreds.length;t>n;n++)r(e,e._deferreds[n]);e._deferreds=null}function c(e,n){var t=!1;try{e(function(e){t||(t=!0,i(n,e))},function(e){t||(t=!0,f(n,e))})}catch(o){if(t)return;t=!0,f(n,o)}}var a=setTimeout;o.prototype["catch"]=function(e){return this.then(null,e)},o.prototype.then=function(e,n){var o=new this.constructor(t);return r(this,new function(e,n,t){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof n?n:null,this.promise=t}(e,n,o)),o},o.prototype["finally"]=e,o.all=function(e){return new o(function(t,o){function r(e,n){try{if(n&&("object"==typeof n||"function"==typeof n)){var u=n.then;if("function"==typeof u)return void u.call(n,function(n){r(e,n)},o)}i[e]=n,0==--f&&t(i)}catch(c){o(c)}}if(!n(e))return o(new TypeError("Promise.all accepts an array"));var i=Array.prototype.slice.call(e);if(0===i.length)return t([]);for(var f=i.length,u=0;i.length>u;u++)r(u,i[u])})},o.resolve=function(e){return e&&"object"==typeof e&&e.constructor===o?e:new o(function(n){n(e)})},o.reject=function(e){return new o(function(n,t){t(e)})},o.race=function(e){return new o(function(t,r){if(!n(e))return r(new TypeError("Promise.race accepts an array"));for(var i=0,f=e.length;f>i;i++)o.resolve(e[i]).then(t,r)})},o._immediateFn="function"==typeof setImmediate&&function(e){setImmediate(e)}||function(e){a(e,0)},o._unhandledRejectionFn=function(e){void 0!==console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)};var l=function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw Error("unable to locate global object")}();"Promise"in l?l.Promise.prototype["finally"]||(l.Promise.prototype["finally"]=e):l.Promise=o});

// Interface
export default {
	create
}