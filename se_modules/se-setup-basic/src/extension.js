import {Plugin,PluginKey,TextSelection} from "prosemirror-state"
import {Decoration, DecorationSet} from "prosemirror-view"
import {Slice, Fragment} from "prosemirror-model"
import {getIcon,icons} from "se-menu-basic"
import {toggleMark} from "prosemirror-commands"

// ***********************************************
// ************** Plugin Key Class ***************
// ***********************************************
	
/**
 * A key is used to tag plugins in a way that makes it possible to find them, given an editor state. Assigning a key does mean only one plugin of that type can be active in a state.
 * Docs: https://prosemirror.net/docs/ref/#state.PluginKey
 * @type {PluginKey}
 */
const extensionPluginKey = new PluginKey("extension")

/**
 * [createExtension description]
 * @param  {class} 	scheme 			Document schema
 * @param  {class} 	menuPlugin		Plugin handling editor menu
 * @param  {class} 	uploaderClass  	Externall Class responsible for handling upload
 * @return {class}            		Plugin
 */
export function extensionPlugin(schema, menuPlugin, uploaderClass) {	

	// ***********************************************
	// ************** Plugin Core Class **************
	// ***********************************************	
	
	/**
	 * Core class for Extension class
	 * @type {pluginCoreClass}
	 */
	let pluginCore = new pluginCoreClass(schema, menuPlugin, uploaderClass)	


	// ***********************************************
	// ***************** Plugin Class ****************
	// ***********************************************	
	
	/**
	 * Article Plugin - Create a plugin.
	 * Plugins bundle functionality that can be added to an editor. They are part of the editor state and may influence that state and the view that contains it.
	 * Docs: https://prosemirror.net/docs/ref/#state.Plugin
	 * @param {Object} 	PluginSpec (https://prosemirror.net/docs/ref/#state.PluginSpec)
	 * @return {Class}  Pluging
	 */
	let pluginClass = new Plugin(
									{
						            
							          	/**
							          	 * Plugin Spec Key
							          	 * Can be used to make this a keyed plugin. You can have only one plugin with a given key in a given state, but it is possible to access the plugin's configuration and state through the key, without having access to the plugin instance object.
							          	 * A key is used to tag plugins in a way that makes it possible to find them, given an editor state. Assigning a key does mean only one plugin of that type can be active in a state.
							          	 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.key
							          	 * @type {Class}	PluginKey (https://prosemirror.net/docs/ref/#state.PluginKey). E.g. new PluginKey("extension"), // must be constant so it will remain the same across all instances
							          	 */
							            key: extensionPluginKey, 
							            
						    			/**
						    			 * Plugin Spec State
						    			 * Allows a plugin to define a state field, an extra slot in the state object in which it can keep its own data.
						    			 * A plugin spec may provide a state field (under its state property) of this type, which describes the state it wants to keep. Functions provided here are always called with the plugin instance as their this binding.
						    			 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.state
						    			 * @type {Interface}	StateField interface (https://prosemirror.net/docs/ref/#state.StateField)
						    			 */
						    			state: {
						    				/**
						    				 * Initialize the value of the field. config will be the object passed to EditorState.create. Note that instance is a half-initialized state instance, and will not have values for plugin fields initialized after this one.
						    				 * Docs: https://prosemirror.net/docs/ref/#state.StateField.init
						    				 * @param  {Object} config   	Object passed to EditorState.create (https://prosemirror.net/docs/ref/#state.EditorState%5Ecreate)
						    				 * @param  {Class} 	instance 	Editor State - The state of a ProseMirror editor is represented by an object of this type. A state is a persistent data structure—it isn't updated, but rather a new state value is computed from an old one using the apply method.
						    				 * @return {Class}          	DecorationSet - A collection of decorations, organized in such a way that the drawing algorithm can efficiently use and compare them. This is a persistent data structure—it is not modified, updates create a new value. (https://prosemirror.net/docs/ref/#view.DecorationSet)
						    				 */
										    init(config, instance) { 
										    	return DecorationSet.empty 
										    },
										    /**
										     * Apply the given transaction to this state field, producing a new field value. Note that the newState argument is again a partially constructed state does not yet contain the state from plugins coming after this one.
										     * Docs: https://prosemirror.net/docs/ref/#state.StateField.apply
										     * @param  {Class} 	tr       		Transaction - An editor state transaction, which can be applied to a state to create an updated state.
										     * @param  {Class} 	set      		DecorationSet - A collection of decorations, organized in such a way that the drawing algorithm can efficiently use and compare them. This is a persistent data structure—it is not modified, updates create a new value. (https://prosemirror.net/docs/ref/#view.DecorationSet)
										     * @param  {Class} oldState 		Editor State - The state of a ProseMirror editor is represented by an object of this type. A state is a persistent data structure—it isn't updated, but rather a new state value is computed from an old one using the apply method.
										     * @param  {Class} newStatePartial 	Editor State (partially constructed) - The state of a ProseMirror editor is represented by an object of this type. A state is a persistent data structure—it isn't updated, but rather a new state value is computed from an old one using the apply method.
										     * @return {Class}          		DecorationSet - A collection of decorations, organized in such a way that the drawing algorithm can efficiently use and compare them. This is a persistent data structure—it is not modified, updates create a new value. (https://prosemirror.net/docs/ref/#view.DecorationSet)
										     */
										    apply(tr, set, oldState, newStatePartial) {										    	


												// Adjust decoration positions to changes made by the transaction
													set = set.map(tr.mapping, tr.doc
															, {
																onRemove: decoSpec => {
																						// Cancel Upload
																						if (typeof decoSpec.name != "undefined" && decoSpec.name == "imageUpload") { // if (typeof decoSpec.id != "undefined" && typeof decoSpec.id.uploader != "undefined") {																							
																							pluginCore.uploader(null, null, decoSpec);
																						}
																					}
															}
														)

												// See if the transaction has meta actions
													let action = tr.getMeta(this);

												// Apply changes per requested action
													if (action && action.add) {
														
														// Upload placeholder - add DOM for upload placeholder (SVG)
														
															// Default dimensions
																let widget_width = 550;
																let widget_height = 550;
															// Target Element Source:
																// let widget_html = 	"<svg width=\""+widget_width+"px\" height=\""+widget_height+"px\" viewBox=\"0 0 "+widget_width+" "+widget_height+"\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"> \
																// 					    <g id=\"Page-1\" stroke=\"none\" fill=\"none\" fill-rule=\"evenodd\"> \
																// 					        <rect id=\"Rectangle-1\" fill=\"#EEEEEE\" x=\"0\" y=\"0\" width=\""+widget_width+"\" height=\""+widget_height+"\"></rect> \
																// 					    </g> \
																// 					</svg> \
																// 					";			

															// Create SVG
																let widget = document.createElementNS("http://www.w3.org/2000/svg", "svg");
															    widget.setAttribute("style","display: none;");
															    widget.setAttribute("viewBox", "0 0 "+widget_width+" "+widget_height+"");
															    widget.setAttribute("version","1.1");
															    widget.setAttribute("xmlns","http://www.w3.org/2000/svg");
															    widget.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink");
																let widget_group = document.createElementNS("http://www.w3.org/2000/svg", "g");
																let widget_rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
															    widget_rect.setAttributeNS(null,"x",0);
															    widget_rect.setAttributeNS(null,"y",0);
															    widget_rect.setAttributeNS(null,"width",widget_width);
															    widget_rect.setAttributeNS(null,"height",widget_height);
															    widget_rect.setAttributeNS(null,"fill","transparent");
															    widget_rect.setAttributeNS(null,"stroke","0");
															    widget_group.appendChild(widget_rect);
															    widget.appendChild(widget_group);

															// Create Widget Decoration
																let deco = Decoration.widget(action.add.pos, widget, {id: action.add.id, name: "imageUpload", stopEvent: evt => {
																	// stop all
																	return true;
																} } );
															// Add to set
																//console.log("editor add deco: ", deco);
																set = set.add(tr.doc, [deco])

													} else if (action && action.open) {

														// Upload placeholder - add DOM wrapper for upload placeholder

															let deco = Decoration.node(action.open.pos.from, action.open.pos.to, {class: 'simpleeditor-figure-build'},{id: action.open.id, name: "figwrap" });
															set = set.add(tr.doc, [deco])
													
													} else if (action && action.close && action.removeAll) {

														// Upload placeholder - remove DOM wrapper for upload placeholder and close figure

															set = set.remove(set.find(null, null, spec => spec.id == action.close.id))
															set = set.remove(set.find(null, null, spec => (spec.name == action.removeAll.name &&  spec.id.uploader == action.removeAll.uploader )))

													} else if (action && action.close) {

														// Upload placeholder - remove DOM wrapper for upload placeholder

															set = set.remove(set.find(null, null, spec => spec.id == action.close.id))

													} else if (action && action.preview) {

														// Upload placeholder - update DOM preview for upload placeholder

															// Find placeholder
																let pset = set.find(null, null, spec => spec.id == action.preview.id);

																if (pset.length!=0) {
																	// Vars
																		let widget_svg = pset[0].type.toDOM;
																		let widget_rect = widget_svg.childNodes[0].childNodes[0];
																		let svgw, svgh;		
																	// Radians for the rotations we want to adress									
																		let rotation = {
																			// img: 1 8 3 6
																				// 1: 0, //'rotate(0deg)',
																				3: 180 * (Math.PI/180), //'rotate(180deg)',
																				6: 90 * (Math.PI/180), //'rotate(90deg)',
																				8: 270 * (Math.PI/180) //'rotate(270deg)'
																			// img-mirror: 2 7 4 5
																				// DODO: [upload-preview] correct mirror image
																		};

																	// Do we have image data from filereader
																		if (action.preview.dim!=null) {	
																			// Data Image received

																				// Flip dimensions if image is sideways
																					if (action.preview.dim[2]==8 || action.preview.dim[2]==6 || action.preview.dim[2]==7 || action.preview.dim[2]==5) {
																			        	svgw = action.preview.dim[1];
																						svgh = action.preview.dim[0];
																			        } else {
																			        	svgw = action.preview.dim[0];
																						svgh = action.preview.dim[1];
																			        }
																																	
																				// SVG - set viewbox and height to source size (width will be evaluated after max-height takes place)
																					widget_svg.setAttribute("viewBox","0 0 "+svgw+" "+svgh+"");												
																					widget_svg.setAttribute("height",svgh);

																				// RECT - set width and height so we the aspect ration is predetermined
																					widget_rect.setAttribute("width",svgw);
																					widget_rect.setAttribute("height",svgh);												
																				 	
																				 // SVG - remove display none from the svg so we can get bounding rectangle of the 1st child (rect)
																					widget_svg.removeAttribute("style");

																				// Correct dimension to size we are actually showing in the window
																				if (widget_svg.childNodes[0].getBoundingClientRect) {
																				
																					// Test values
																					// var bBox = widget_svg.getBBox();
																					// console.log( widget_svg.getBoundingClientRect(), bBox, widget_svg.childNodes[0].getBoundingClientRect(), widget_svg.childNodes[0].childNodes[0], widget_rect.getBBox());

																					// GET resize dimensions from Rectangle (it keeps the aspect ratio)
																					let brect = widget_svg.childNodes[0].getBoundingClientRect(); //must be 1st child to get correct rectangle

																					// Update width and height we are going to use for the svg and rotation
																						svgw = brect.width;
																						svgh = brect.height;

																					// Do we have valid dimensions
																					if (svgw!=0 && svgw!=0) {
																						// we have valid dimensions

																						// SVG - correct viewbox and height 
																							widget_svg.setAttribute("viewBox","0 0 "+svgw+" "+svgh+"");																
																							widget_svg.setAttribute("height",svgh);																						
																						
																						// RECT - correct width and height for the rectangle
																							widget_rect = widget_svg.childNodes[0].childNodes[0];
																							widget_rect.setAttribute("width",svgw);
																							widget_rect.setAttribute("height",svgh);

																						// IMAGE BG - set background image
																							if (action.preview.src) {
																								
																								// SVG - background style
																									widget_svg.style.backgroundRepeat = "no-repeat";
																									widget_svg.style.backgroundPosition = "center";
																									widget_svg.style.backgroundSize = "contain";

																								// Get the source
																									let bg_src = action.preview.src;

																								// Do we need to rotate the source
																									if (rotation[action.preview.dim[2]]) {
																										// We need to rotate the image preview
																										
																										// Create image element to hold the source we draw to canvas
																											var image_canvas = new Image();
																											image_canvas.src = action.preview.src;
																										// Onload draw to canvas and rotate
																											image_canvas.onload = function() {
																												// Source loadad																					
																												
																												// Is valid
																													if ('naturalHeight' in this) {
																											            if (this.naturalHeight + this.naturalWidth === 0) {
																											                this.onerror();
																											                return;
																											            }
																											        } else if (this.width + this.height == 0) {
																											            this.onerror();
																											            return;
																											        }

																												// Get Sizes (twice the source)
																													var cw = 2*svgw;
																													var ch = 2*svgh;

																												// Create Canvas
																													var canvas = document.createElement('canvas');
																													canvas.setAttribute("width", cw);
																													canvas.setAttribute("height", ch);

																												// Get position
																													var x = canvas.width / 2;
																													var y = canvas.height / 2;

																												// Get Image size (flip according to rotation)
																													if (action.preview.dim[2]==8 || action.preview.dim[2]==6 || action.preview.dim[2]==7 || action.preview.dim[2]==5) {
																											        	cw = 2*svgh;
																														ch = 2*svgw;
																											        }
																													var width = cw;
																													var height = ch;
																												
																												// Get the drawing context and rotate image
																													var context = canvas.getContext('2d');
																													context.translate(x, y);
																													context.rotate(rotation[action.preview.dim[2]]);															
																													context.drawImage(this, -width / 2, -height / 2, width, height);
																													context.rotate(-rotation[action.preview.dim[2]]);
																													context.translate(-x, -y);

																												// Get rotated image
																													bg_src = canvas.toDataURL();

																												// Add image to svg background		
																													widget_svg.style.backgroundImage = "url("+bg_src+")";

																												// Cleanup
																													bg_src = null;
																													image_canvas = null;

																											};
																											image_canvas.onerror = function() {
																												// Source not loaded - set not rotated version
																												widget_svg.style.backgroundImage = "url("+bg_src+")";
																											};

																									} else {
																										// No need to rotate
																										widget_svg.style.backgroundImage = "url("+bg_src+")";
																									}
																							}
																						
																					}
																				}
																		
																		} else {
																			// No image data received
																			
																				// RECT - set background color
																					widget_rect.setAttribute("fill","#EEE");
																				// SVG - remove display none from the svg so we can get bounding rectangle
																					widget_svg.removeAttribute("style");												
																				// DIM from window
																					if (widget_svg.childNodes[0].getBoundingClientRect) {
																						let brect = widget_svg.childNodes[0].getBoundingClientRect();
																						svgw = brect.width;
																						svgh = brect.height;
																						if (svgw!=0 && svgw!=0) {
																							widget_svg.setAttribute("viewBox","0 0 "+svgw+" "+svgh+"");
																							widget_svg.setAttribute("height",svgh);												
																							widget_rect.setAttribute("width",svgw);
																							widget_rect.setAttribute("height",svgh);												
																					 	}
																					 }
																		}		

																	// Add progress bar
																	
																		// Vars
																			var p_width_ = svgw;
																			var p_stroke_ = 4; 
																			var p_height_ = p_stroke_;
																			var p_dash_ = p_width_; 
																			// SOURCE:
																			// "<svg width=\""+p_width_+"\" height=\""+p_height_+"\" viewBox=\"0 0 "+(p_width_)+" "+(p_height_)+"\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" style=\"position: absolute;z-index: 1; margin: 0; display: block; left: 0;right: 0;bottom: 0;\"> \
							                                                //     <path d=\" M 0,"+(p_stroke_/2)+" h "+(p_width_)+"\" fill=\"transparent\" stroke-dasharray=\""+p_dash_+"\" stroke-dashoffset=\"0\" style=\" stroke-dashoffset: "+p_dash_+";transition: stroke-dashoffset 1s linear; stroke: #ff6766; stroke-width: "+p_stroke_+"px;\"></path> \
							                                                // </svg>";
																		
																		// PRG bar background - working but not needed
																			// let widget_prg_bg = document.createElementNS("http://www.w3.org/2000/svg", "path");
																			// widget_prg_bg.setAttributeNS(null,"d","M 0,"+(svgh-(p_stroke_/2))+" h "+(p_width_)+"");
																			// widget_prg_bg.setAttributeNS(null,"fill","transparent");
																			// widget_prg_bg.setAttributeNS(null,"stroke-dasharray",p_dash_);
																			// widget_prg_bg.setAttributeNS(null,"stroke-dashoffset","0");
																			// widget_prg_bg.setAttributeNS(null,"style","stroke: #e6e6e6b3; stroke-width: "+p_stroke_+"px;");
																			// widget_svg.appendChild(widget_prg_bg);	

																		// PRG bar
																			let widget_prg = document.createElementNS("http://www.w3.org/2000/svg", "path");
																			widget_prg.setAttributeNS(null,"d","M 0,"+(svgh-(p_stroke_/2))+" h "+(p_width_)+"");
																			widget_prg.setAttributeNS(null,"fill","transparent");
																			widget_prg.setAttributeNS(null,"stroke-dasharray",p_dash_);
																			widget_prg.setAttributeNS(null,"stroke-dashoffset","0");
																			widget_prg.setAttributeNS(null,"class","simpleeditor-progressbar");
																			widget_prg.setAttributeNS(null,"style","stroke-dashoffset: "+p_dash_+";transition: stroke-dashoffset 1s linear; stroke-width: "+p_stroke_+"px;");
																			widget_svg.appendChild(widget_prg);		
																}	

													} else if (action && action.progress) {

						         						// Upload placeholder - update DOM progress for upload placeholder
															let pset = set.find(null, null, spec => spec.id == action.progress.id);
															if (pset.length!=0) {
																let widget_svg = pset[0].type.toDOM;										
																if (widget_svg && action.progress.value!=null) {	
																	var prgbar = widget_svg.childNodes[1];
																	if (prgbar) {
																		var l = prgbar.getTotalLength();
																		var val = action.progress.value*100;
							                                            if (isNaN(val)) {
							                                                val = 100; 
							                                            }
							                                            if (val < 0) { val = 0;}
							                                            if (val > 100) { val = 100;}
							                                            var pct = ((100-val)/100)*l;
							                                            prgbar.style.strokeDashoffset = pct;
						                                        	}
																}
															}

													} else if (action && action.update) {
														
														// Upload placeholder - update

															// This rely on referenced update
															let deco_update = set.find(null, null, spec => spec.id == action.update.id);
															if (deco_update.length>0) {
																deco_update[0].spec.id.url = action.update.url;
															}
															// console.log("set", deco_update);
															// // set = set.remove(set.find(null, null, spec => spec.id == action.update.id))
															// // set = set.add(tr.doc, deco_update)

													} else if (action && action.removeAll) {

														// Upload placeholder - remove all

															if (action.removeAll == null) {
																set = DecorationSet.empty;
															} else {
																set = set.remove(set.find(null, null, spec => (spec.name == action.removeAll.name &&  spec.id.uploader == action.removeAll.uploader )))
															}

													} else if (action && action.remove) {
														
														// Upload placeholder - remove

															if (action.remove == null) {
																set = DecorationSet.empty;
															} else {
																set = set.remove(set.find(null, null, spec => spec.id == action.remove.id))
															}													

													} else if (action && action.videoSource) {

														// Remove Block menu														
															let remove_decorations = [];
															let decorations = set.find(null, null, spec => spec.name == "blockMenu");
															for (var i = 0; i < decorations.length; i++) {
																// Remove event listeners to prevent memory leaks
																	let el_ = decorations[i].type.toDOM || null;
																	if (el_!==null) {
									                  					let el_child_ = null;
									                  					for (var j = el_.childNodes.length - 1; j >= 0; j--) {
									                  					 	el_child_ = el_.childNodes[j];
									                  					 	if (el_child_.tagName == "BUTTON") {
									                  					 		el_child_.removeEventListener('mousedown',pluginCore.fnCallback_blockMenu);
									                  					 	}
									                  					};
								                  					}
																// Add to array 
																remove_decorations.push(decorations[i]);
															};
															if (remove_decorations.length!=0) {
																set = set.remove(remove_decorations);
																remove_decorations = null;
															}
														// Add video source decoration (called from Block menu)
															let videoSource_id = {};
															let deco_videoSource = Decoration.node(action.videoSource.pos.from, action.videoSource.pos.to, {class: 'simpleeditor-embed-node'},{id: videoSource_id, name: "videoSource" });
															set = set.add(tr.doc, [deco_videoSource])														

													} else if (action && (action.blockMenu || action.emptyNode || action.selectedEmptyNode || action.figureCaption)) {
										    	
														// Array of decoration that will be added to current set
														let deco_ = [];
														
														// Add empty node decoration
														if (action.emptyNode) {
															
															let deco_emptyNode = null;
															let emptyNode_id_ = null;
															if (Array.isArray(action.emptyNode)) {
																for (var i = 0; i < action.emptyNode.length; i++) {
																	emptyNode_id_ = new Date().getTime()+i; //action.emptyNode[i].id; -> for some reason this is not passed to node decoration so we need to create new unique id because decorations are compered by 3rd parameter (https://prosemirror.net/docs/ref/#view.Decoration^node^spec)
																	deco_emptyNode = Decoration.node(action.emptyNode[i].pos.from, action.emptyNode[i].pos.to, {class: "simpleeditor-empty-node"},{id: emptyNode_id_, name: "emptyNode"});
																	deco_.push(deco_emptyNode);
																};
															} else {
																emptyNode_id_ = new Date().getTime(); //action.emptyNode[i].id;
																deco_emptyNode = Decoration.node(action.emptyNode.pos.from, action.emptyNode.pos.to, {class: "simpleeditor-empty-node"},{id: emptyNode_id_, name: "emptyNode"});
																deco_.push(deco_emptyNode);
															}
														}

														// Add selected empty node decoration
														if (action.selectedEmptyNode) {
															let selectedEmptyNode_id = {};
										                    let deco_selectedEmptyNode = Decoration.node(action.selectedEmptyNode.pos.from-1, action.selectedEmptyNode.pos.to-1, {class: 'simpleeditor-empty-node-selected'},{id: selectedEmptyNode_id, name: "selectedEmptyNode"});
															// Add to array
															deco_.push(deco_selectedEmptyNode);
														}


														// Add figure caption placeholer node decoration
														if (action.figureCaption) {

															// ADD WIDGET FIGCAPTION
															
																// Create DOM
																
																	let fnCallback_cap = function(e) {
										                  				// stop event so we don't fuckup range and focus 
										                  				e.preventDefault();
										                  				e.stopPropagation();
										                  				// dom	                  				
										                  				let el_ = e.currentTarget; //e.target;
										                  				// let pel_ = el_.parentNode; 
										                  				// remove listener	                  				
										                  				el_.removeEventListener('mousedown',fnCallback_cap);	                  				
										                  				// call trans
										                  				this.aTrans = { "insertCaption": [el_.pos] };
										                  				this.mFixView(this.view);
										                  				// focus
										                  				// pel_.lastChild.focus();
										                  			} 
										                  			let figcap_el = document.createElement("figcaption");
										                  			figcap_el.setAttribute("class", "simpleeditor-empty-node");
										                  			figcap_el.appendChild(document.createTextNode(""));
										                  			// figcap_el.pos = pos+node.nodeSize-1;
										                  			// figcap_el.addEventListener('mousedown', fnCallback_cap.bind(pluginCore));
										                  			figcap_el.addEventListener('mousedown', pluginCore.fnCallback_figureCaption.bind(pluginCore,action.figureCaption.pos.from));

										                  		// Add to decoration
																	let figureCaption_key = new Date().getTime(); // Widgets are compared by key (https://prosemirror.net/docs/ref/#view.Decoration^widget^spec.key)
												                    let deco_figureCaption = Decoration.widget(action.figureCaption.pos.from, figcap_el, {key: figureCaption_key.toString(), name: "figureCaption" , side: -1, ignoreSelection: true, stopEvent: evt => {
												                    	// stop all - https://prosemirror.net/docs/ref/#view.Decoration^widget^spec.stopEvent
												                    	return true;
												                    } })
																	deco_.push(deco_figureCaption);

														}

														// Block Menu
														if (action.blockMenu) {															

															// Find other empty paragraph decorations
															let has_other_decoration = set.find(null, null, spec => spec.name == "videoSource");

															// Has other decoration in empty paragraph
															if (has_other_decoration.length==0) {
															
																// ADD WIDGET BLOCK MENU
																	
																	// FF issue with cursor not showing when added to new paragraph !!!
																	//
																	// https://bugs.chromium.org/p/chromium/issues/detail?id=977991
																	// https://bugzilla.mozilla.org/show_bug.cgi?id=1175495
																	//
																	// See also: 
																	// https://github.com/ProseMirror/prosemirror/issues/1069
																	// https://github.com/ProseMirror/prosemirror/issues/991
																	// 
																	// We will need to wait until this is resolved.
  
																	// Remove duplicates
																		set = set.remove(set.find(null, null, spec => spec.name == "blockMenu"));

										                        	// Create menu wrapper
											                        	let menu_tt_el = document.createElement("div");
											                  			menu_tt_el.setAttribute("class", "simpleeditor-menu-tooltip");
											                  			//menu_tt_el.setAttribute("tabindex","-1");

										                  			// Create buttons
										                  				
										                  				// IMG button
										                  					let el_img = document.createElement("button");
										                  					//el_img.setAttribute("tabindex","-1");
										                  					el_img.appendChild(getIcon(icons.image,"simpleeditor-menu-tooltip-icon"));
										                  					menu_tt_el.appendChild(el_img);
										                  					// external uploader callback
										                  					pluginCore.uploader(el_img, pluginCore.fnCallback_upload.bind(pluginCore, {from: action.blockMenu.pos.from, to: action.blockMenu.pos.to}));

										                  				// Video button
										                  					let el_vid = document.createElement("button");
										                  					//el_vid.setAttribute("tabindex","-1");
										                  					el_vid.appendChild(getIcon(icons.video,"simpleeditor-menu-tooltip-icon"));										                  					
										                  					el_vid.addEventListener('mousedown', pluginCore.fnCallback_blockMenu.bind(pluginCore,"replaceWithVideoDecoration",{from: action.blockMenu.pos.from-1, to: action.blockMenu.pos.from+1}));
										                  					menu_tt_el.appendChild(el_vid);				                  					
										                  				
										                  				// HR button
										                  					let el_hr = document.createElement("button");	
										                  					// el_hr.setAttribute("tabindex","-1");
										                  					el_hr.appendChild(getIcon(icons.hr,"simpleeditor-menu-tooltip-icon"));
										                  					el_hr.addEventListener('mousedown', pluginCore.fnCallback_blockMenu.bind(pluginCore,"replaceWithHr",(action.blockMenu.pos.from+1)));
										                  					menu_tt_el.appendChild(el_hr);				                  					
										                  			
										                  			// Add to decoration
										                  				let blockMenu_key = new Date().getTime(); // Widgets are compared by key (https://prosemirror.net/docs/ref/#view.Decoration^widget^spec.key)
													                    let deco_blockMenu = Decoration.widget(action.blockMenu.pos.from, menu_tt_el, {key: blockMenu_key.toString(), name: "blockMenu" , side: -1, ignoreSelection: true, stopEvent: evt => {
													                    	// stop all - https://prosemirror.net/docs/ref/#view.Decoration^widget^spec.stopEvent
													                    	return true;
													                    } })
																		deco_.push(deco_blockMenu);

													                // Add class to animate menu wrapper after short delay (handled by CSS)
													               		setTimeout(function(){ 
													               			try {
													               				menu_tt_el.setAttribute("class", "simpleeditor-menu-tooltip focus");
													               			} catch(e) {
													               				// console.warn("DOM element might be already removed", e);
													               			}
													               		}, 500);

															}

														}

														// Add decoration to current set
															if (deco_.length!=0) {
																set = set.add(tr.doc, deco_);
															}

													} else if (action && action.blurRemove) {

														// Remove selectedEmptyNode decoration onBlur (be aware that if they might be re-added unless view.hasFocus() is checked)
															
															set = set.remove(set.find(null, null, spec => spec.name == "selectedEmptyNode"));

													} else {

														// Remove decorations
															
															let el_ = null;
															let remove_decorations = [];
															let decorations = set.find(null, null, spec => spec.name != null);
															for (var i = 0; i < decorations.length; i++) {
																switch (decorations[i].spec.name) {
																	case "blockMenu":
																		// Remove event listeners to prevent memory leaks
																			el_ = decorations[i].type.toDOM || null;
																			if (el_!==null) {
											                  					let el_child_ = null;
											                  					for (var j = el_.childNodes.length - 1; j >= 0; j--) {
											                  					 	el_child_ = el_.childNodes[j];
											                  					 	if (el_child_.tagName == "BUTTON") {
											                  					 		el_child_.removeEventListener('mousedown',pluginCore.fnCallback_blockMenu);
											                  					 	}
											                  					};
										                  					}
																		// Add to remove array
																			remove_decorations.push(decorations[i]);
																	break;
																	case "videoSource":
																	case "selectedEmptyNode":
																		// Add to remove array
																			remove_decorations.push(decorations[i]);
																	break;
																	case "figureCaption":
																		// Remove event listeners to prevent memory leaks
																			el_ = decorations[i].type.toDOM || null;
																			if (el_!==null) {
																				el_.removeEventListener('mousedown',pluginCore.fnCallback_figureCaption);
																			}
																		// Add to remove array
																			remove_decorations.push(decorations[i]);
																	break;
																	case "emptyNode":
																		// For cases where the node for decoration might have been already removed from DOM
																		
																			// Update state to look at most recent nodes while looking for dom element
																				pluginCore.view.updateState(newStatePartial);
																			// Find DOM node
																				el_ = pluginCore.view.nodeDOM(decorations[i].from) || null;
																			// Remove only if DOM is element and has some text content
																				if (el_!=null && el_.nodeType==1 && el_.textContent.length != 0) {
																					// Add to remove array
																					remove_decorations.push(decorations[i]);
																				}
																	break;

																}
															};
															
															// Remove decorations
															if (remove_decorations.length!=0) {
																set = set.remove(remove_decorations);
															}

													}
												
												// Return updated set
												return set
										    }

										    // More methods - https://prosemirror.net/docs/ref/#state.StateField
										    /*
										    toJSON: ?⁠fn(value: T) → any
											Convert this field to JSON. Optional, can be left off to disable JSON serialization for the field.
											fromJSON: ?⁠fn(config: Object, value: any, state: EditorState) → T
											Deserialize the JSON representation of this field. Note that the state argument is again a half-initialized state.
										     */
										},
							            
										/**
										 * Plugin Spec Transaction to filter
										 * When present, this will be called before a transaction is applied by the state, allowing the plugin to cancel it (by returning false).
										 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.filterTransaction
										 * @param  {Object} transaction 	Transaction before applied to state (https://prosemirror.net/docs/ref/#state.Transaction)
										 * @param  {[type]} state       	EditorState before supplied transaction (https://prosemirror.net/docs/ref/#state.EditorState)
										 * @return {Boolean}             	True - pass the transaction, False - Cancel the transaction
										 */
										// filterTransaction: (transaction, state) => {
										// 	console.error("\t catch transaction before it is applied =>", transaction);
										// 	// Pass
										// 	return true;					
										// 	// Block
										// 	return false;
										// },
							            
							            /**
							             * Plugin Spec Transactions to append
							             * Allows the plugin to append another transaction to be applied after the given array of transactions. When another plugin appends a transaction after this was called, it is called again with the new state and new transactions—but only the new transactions, i.e. it won't be passed transactions that it already saw.
							             * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.appendTransaction
							             * @param  {Object} transactions 	Transaction to alter (https://prosemirror.net/docs/ref/#state.Transaction)
							             * @param  {[type]} oldState     	EditorState before supplied transaction (https://prosemirror.net/docs/ref/#state.EditorState)
							             * @param  {[type]} newState     	EditorState after supplied transaction (https://prosemirror.net/docs/ref/#state.EditorState)
							             * @return {Void}              		Transaction altered (https://prosemirror.net/docs/ref/#state.Transaction)
							             */
							            appendTransaction: (transactions, oldState, newState) => {
										    
										    // Do we have any changes in the queue
										    const tr_haveSteps = transactions.some((element) => element.docChanged === true); // OR: transactions.some((element) => element.steps.length > 0);
										    										    

										    // Get transaction object that will be altered. Work with new state transactions.
										    let tr = newState.tr

										    // Transaction that will be appended
										    let tr_updates = {};

										    // If some changes has happend, they might have producted new state with invalid nodes and decoration - eval fixes
											    
											    if (tr_haveSteps===true) {
												    

											    	// Eval fixes and decorations (we need to try to get rid of this iterator)												    
												    let tr_updates_fromRange = {};

												    // Get Update for affected positions
											    	for (var i = transactions.length - 1; i >= 0; i--) {
											    		for (var j = transactions[i].steps.length - 1; j >= 0; j--) {
												    		transactions[i].steps[j].getMap().forEach(function(oldStart, oldEnd, newStart, newEnd) {
												    			// Get Updates for the new nodes
												    				tr_updates_fromRange = pluginCore.getViewUpdates(newState,newStart,newEnd);	
												    			// Merge identified changes
													    			for (var key in tr_updates_fromRange) {
																        if (tr_updates.hasOwnProperty(key)) {
																        	tr_updates[key] = tr_updates[key].concat(tr_updates_fromRange[key]);
																        } else {
																        	tr_updates[key] = tr_updates_fromRange[key];
																        }
																    }
												    		});
											    		}
											    	};												  

											  	}

										  	// Eval Selection change										  		

									  			// Get Selections from new State
													
													let {from, $from, to, empty} = newState.selection;
													
													// TEST: do we have valid selection?
														// console.error("newState check selection", $from, empty, $from.parent.childCount, $from.start($from.depth));
														// let from_tr = newState.tr.selection.from;
														// console.log("compare selections: ", from, from_tr, (from===from_tr))

												// Add decoration for selection
													
													if (empty && $from.parent != null  && $from.parent.childCount === 0) {
														
														// Selected class - only if view has focus so we don't break blur transactions. Limit to specific nodes (empty LI trigger issues on delete enter)
														
															if (pluginCore.view.hasFocus() && ($from.parent.type.name == "title" || $from.parent.type.name == "figcaption")) {
																
																if (typeof tr_updates['setMeta'] == "undefined") {
																	tr_updates['setMeta'] = [];
																}
																tr_updates['setMeta'].push({key: "selectedEmptyNode", pos: {from: from, to: from + $from.parent.nodeSize}});
															
															}
														
														// Block Menu - add block menu to 1st level paragraphs

															if ($from.depth == 1 && $from.parent.type.name == "paragraph") {
															
																if (typeof tr_updates['setMeta'] == "undefined") {
																	tr_updates['setMeta'] = [];
																}
																tr_updates['setMeta'].push({key: "blockMenu", pos: {from: from, to: from + $from.parent.nodeSize}});
															}

													}

													if (!empty && $from.parent != null  && $from.parent.type.name == "figure") {
													
														// Figure content selected

															if ($from.parent.lastChild!=null && $from.parent.lastChild.type.name!="figcaption") {

																// Image/Embed selected in figure without caption

																	// Test last position in the figure where we want to append caption decoration
																	// let last_fig_postion = $from.after($from.depth) - 1; //($from.before($from.depth) + $from.parent.nodeSize - 1); //(from - $from.parentOffset + $from.parent.nodeSize - 2)
																	// console.warn("selected: ", $from, from, $from.parentOffset, (from - $from.parentOffset + $from.parent.nodeSize - 2), last_fig_postion);

																	if (typeof tr_updates['setMeta'] == "undefined") {
																		tr_updates['setMeta'] = [];
																	}
																	tr_updates['setMeta'].push({key: "figureCaption", pos: {from: ($from.after($from.depth)-1), to: ($from.after($from.depth)) }});
																	

															}

													}


											// Append if anything has been detected											    

											    // Append if anything has been detected
											    if (tr_updates.constructor === Object && Object.keys(tr_updates).length !== 0) {					    	

											    	// Alter tr object. Append updates to requested transaction
											    	tr = pluginCore.appendTransactions(newState, tr_updates, tr);												    	

											    	// Pass to new state
											    		return tr;
											    }

										  	// Don't alter requested transaction
										  		
										  		// no return value
										  		
										},

							            /**
							             * Plugin Spec properties 
							             * The view props added by this plugin. Props that are functions will be bound to have the plugin instance as their this binding.
							             * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.props
							             * @type {Object}
							             */
							            props: {
							            	
							            	/**
							            	 * A set of document decorations to show in the view.
							            	 * Docs: https://prosemirror.net/docs/ref/#view.EditorProps.decorations
							            	 * @param  {Class}	state 	Editor State - The state of a ProseMirror editor is represented by an object of this type. A state is a persistent data structure—it isn't updated, but rather a new state value is computed from an old one using the apply method.
							            	 * @return {Class}          DecorationSet - A collection of decorations, organized in such a way that the drawing algorithm can efficiently use and compare them. This is a persistent data structure—it is not modified, updates create a new value. (https://prosemirror.net/docs/ref/#view.DecorationSet)
							            	 */
									        decorations(state) {

									        	/**
									        	 * Extract the plugin's state field from an editor state.
									        	 * Docs: https://prosemirror.net/docs/ref/#state.Plugin.getState
									        	 */
												return this.getState(state);

									        },

											/**
											 * Can be an object mapping DOM event type names to functions that handle them. Such functions will be called before any handling ProseMirror does of events fired on the editable DOM element. Contrary to the other event handling props, when returning true from such a function, you are responsible for calling preventDefault yourself (or not, if you want to allow the default behavior).
											 * Docs: https://prosemirror.net/docs/ref/#view.EditorProps.handleDOMEvents
											 * @type {Object}
											 */
											handleDOMEvents: {
												/**
												 * Mouseover - Open link tooltip
												 * @param  {Class} 	oView 	An editor view manages the DOM structure that represents an editable document. Its state and behavior are determined by its props.
												 * @param  {Event} 	e     	Dom Event
												 * @return {Boolean}       	When returning true from such a function, you are responsible for calling preventDefault yourself (or not, if you want to allow the default behavior).
												 */
												mouseover(view, e) {

													// Has mark defined in this class and as well as the schema - block native event
													if ( ! view.state.schema.marks.link) { return false; }

													// Find DOM link from event bubble
													let link = pluginCore._mIsLinkFromDomEvent(view,e);
														// Check if hover matches the link and open tooltip
													if ( link ) { 
														// Show dialog
														pluginCore.mShowTooltip(view,link); 
														// Pass native event
														return true; 
													}

													// Pass native event
													return true;

												},
												/**
												 * onFocusout - Remove placeholder decorations
												 * @param  {Class} 	oView 	An editor view manages the DOM structure that represents an editable document. Its state and behavior are determined by its props.
												 * @param  {Event} 	e     	Dom Event
												 * @return {Boolean}       	When returning true from such a function, you are responsible for calling preventDefault yourself (or not, if you want to allow the default behavior).
												 */
												focusout(view, e) {
													
													// Get current selection
													let {$from, empty} = view.state.selection;
													
													// iOS focusout doesn't refer to button (e.relatedTarget) so we need to hard code the check for placeholder nodes
													if ($from.parent.type.name == "title" || $from.parent.type.name == "figcaption") {
														// Check if we are empty node
														if (empty && $from.parent != null  && $from.parent.childCount === 0) {	
															// Remove placeholder decorations
											            	view.dispatch(view.state.tr.setMeta(this, {blurRemove: {id:{}}}));
											            }
										        	}

					        						// Pass native event
													return true;

    											},
    											/**
												 * onFocusin - Add placeholder decorations
												 * @param  {Class} 	oView 	An editor view manages the DOM structure that represents an editable document. Its state and behavior are determined by its props.
												 * @param  {Event} 	e     	Dom Event
												 * @return {Boolean}       	When returning true from such a function, you are responsible for calling preventDefault yourself (or not, if you want to allow the default behavior).
												 */
    											focusin(view, e) {

    												// Get current selection
													let {from, $from, empty} = view.state.selection;													

													// iOS focusin doesn't refer to button (e.target) so we need to hard code the check for placeholder nodes
													if ($from.parent.type.name == "title" || $from.parent.type.name == "figcaption") {
														// Check if we are empty node
														if (empty && $from.parent != null  && $from.parent.childCount === 0) {														
															// Add placeholder decoration
															view.dispatch(view.state.tr.setMeta(this, {selectedEmptyNode: {id:{},pos:{from: from, to: from + $from.parent.nodeSize} }}));
														}
													}
					        						
					        						// Pass native event
													return true;

    											}

												// Other Dom Events			      
												// ,mouseout(oView, e) {	
												// 	// Has mark defined in this class and as well as the schema
												// 	if ( ! oView.state.schema.marks.link) { return false; }

												// 	// check if hover  matches the link
												// 	if ( pluginCore._mIsLinkFromDomEvent(oView,e) ) { 

												// 		pluginCore.linkTooltipOpen = e.target; 

												// 		return true; 
												// 	}

													
												// 	pluginCore._mCloseTooltip(oView,e);

												// 	return true;
												// }
											    // dragover: start,
											    // dragenter: start,
											    // drop(view) {
											    //   clear()
											    //   if (plugin.getState(view.state))
											    //     view.dispatch(view.state.tr.setMeta(plugin, false))
											    // },
											    // dragleave(view, e) {
											    //   if (e.target == view.dom && plugin.getState(view.state)) {
											    //     clear()
											    //     // Can't be synchronous because this is also fired when the drag goes onto a child element,
											    //     // and we can't tell from the event whether that's the case.
											    //     leaving = setTimeout(() => {
											    //       view.dispatch(view.state.tr.setMeta(plugin, false))
											    //       leaving = null
											    //     }, 50)
											    //   }
											    // }
											
											}

											// Other handlers
										      	

									          	// Docs: https://prosemirror.net/docs/ref/#view.EditorProps

												// handlePaste(view, event, slice) {
												// slice = unwrapContentFromTableCellsIfSelectionIsInTable(slice, view.state);
												// ....
												// dispatch(state.tr.replaceSelection(slice));
												// return true;
												// },
												// handleDrop(view, event, slice, moved) {
												// slice = unwrapContentFromTableCellsIfSelectionIsInTable(slice, view.state);
												// ....
												// // work out where the dropPos is and whether to
												// // replace or insert slice based off `moved` 
												// ....
												// dispatch(state.tr.doSomethingWith(slice));
												// return true;
												// },
												// handlePaste: ?⁠fn(view: EditorView, event: dom.Event, slice: Slice) → bool
												// handlePaste(view, event, slice) {
												// 	// SCHEMA workaround
												// 	// we need convert div to p if doesn't have valid iframe
												// 	console.info("handlePaste", view, event, slice);
												// 	//oTrans.setBlockType(oTransactions['setBlockType'][i]+1, oTransactions['setBlockType'][i]+1, oView.state.schema.nodes.heading, {level: 2})
												// 	return false; // pass // true: block paste
												// },
												// handleDrop: ?⁠fn(view: EditorView, event: dom.Event, slice: Slice, moved: bool) → bool
												// Called when something is dropped on the editor. moved will be true if this drop moves from the current selection (which should thus be deleted).

									    },			    
									    
									    /**
									     * Plugin Spec View 
									     * When the plugin needs to interact with the editor view, or set something up in the DOM, use this field. The function will be called when the plugin's state is associated with an editor view.
									     * Docs: // https://prosemirror.net/docs/ref/#state.PluginSpec.view
									     * @param  {Object} EditorView 	EditorView - An editor view manages the DOM structure that represents an editable document. Its state and behavior are determined by its props
									     * @return {Object}       		Should return an object with the following optional properties: update: ?⁠fn(view: EditorView, prevState: EditorState), destroy: ?⁠fn() - docs: https://prosemirror.net/docs/ref/#state.PluginSpec.view^returns
									     */
							            view(EditorView) {
							            				// Pass Editor View to pluginCore class. It will remain the same unless we inject other view to core.
							            					pluginCore.view = EditorView;
							            				// Set the Editor View DOM to pluginCore class - NOT NEEDED
							            					// pluginCore.aDomEdit = EditorView.dom;
							            				// Return Plugin View Class
							                            	return new pluginViewClass(EditorView, pluginCore) 
							            }	            
							            

							            // Other methods for the plugin - https://prosemirror.net/docs/ref/#state.Plugin
								            /*
									            spec: Object -> void (The plugin's spec object)
												getState(state: EditorState) → any (Extract the plugin's state field from an editor state)
								            */
							            
							            /**
							             * Pluging Spec Custom methods
							             * Custom method extending plugin so we can reach Core methods
							             * This is approach is not per documentation so we might want to refactor or remove these methods
							             */
							            
								            /**
								             * Open Link Edit dialog
								             * External call to plugin core from:
								             * 		1. menu.js::linkItem 
								             * 		2. keymap.js:399
								             * Command puts state, fnDispatch, view, domEvent but not all are passed here (lib: prosemirror-menu - https://github.com/prosemirror/prosemirror-menu)
								             * @param  {Class} 	state    	EditorState
								             * @param  {Class} 	dispatch 	Transaction
								             * @param  {Class} 	view     	EditorView
								             * @param  {Event} 	domEvent 	Event that triggered the command
								             * @return {Boolean} 	        Command success
								             */
								            ,openDialog(state, dispatch, view, domEvent) {
								            	pluginCore._mCloseTooltip();
												pluginCore._mCloseDialog(true); //set link
								            	pluginCore.mShowDialog(state, dispatch, view);		            	
								            	return true;
										    }
								            /**
								             * Remove Link 
								             * External call to plugin core from:
								             * 		1. menu.js::linkItem 
								             * Command puts state, fnDispatch, view, domEvent but not all are passed here (lib: prosemirror-menu - https://github.com/prosemirror/prosemirror-menu)
								             * @param  {Class} 	state    	EditorState
								             * @param  {Class} 	dispatch 	Transaction
								             * @param  {Class} 	view     	EditorView
								             * @param  {Event} 	domEvent 	Event that triggered the command
								             * @return {Boolean} 	        Command success
								             */
								            ,removeLink(state, dispatch, view, domEvent) {
								            	pluginCore._mCloseTooltip();
												pluginCore._mCloseDialog(true);
												pluginCore.mUnlink(state, dispatch, view);
												return true;
								            }
								            /**
								             * Find Image Placeholder decoration (to by replaced with the uploaded image)
								             * External call to plugin core uploader callback:
								             * @param  {class} 	state 	Editor State
								             * @param  {object}	id    	Decoration ID
								             * @param  {object} scope 	Scope to lookup decoration (this pluginClass)
								             * @return {Integer|Null}   Decoration positon or null if not found
								             */
								            ,imagePlaceholder(state, id, scope) {
											  let decos = scope.getState(state)
											  let found = decos.find(null, null, spec => spec.id == id)
											  return found.length ? found[0].from : null
											}

						          	}
	  							)

	/**
	 * Return Plugin
	 */
	return pluginClass
                
}


// ***********************************************
// ************** Plugin View Class **************
// ***********************************************
 
/**
 * Plugin Spec View Class
 * When the plugin needs to interact with the editor view, or set something up in the DOM, use this class. The function will be called when the plugin's state is associated with an editor view.
 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.view
 * @return {Object}       Object with constructor and the following optional properties: update: ?⁠fn(view: EditorView, prevState: EditorState), destroy: ?⁠fn() - docs: https://prosemirror.net/docs/ref/#state.PluginSpec.view^returns
 */
class pluginViewClass
{
		
	/**
	 * Construct Extension Plugin view object
	 * @param  {class} view Editor View
	 * @param  {class} core Plugin Core class
	 * @return {void}      	Setup object represeting plugin view
	 */
	constructor(view, core) {

		// Variables to use while handling object methods interacting with editor view (update, destroy)
			this.view = view;
			this.core = core;
		
		// Add resize listener to window so we can handle resize directly in plugin core class
			window.addEventListener('resize', this.core.fnWindwoResize.bind(this.core));
		
		// Focus view on load
		
			// This is still broken on iOS because Apple really doesn’t want you to focus input fields that the user hasn’t tapped on.
			// if (!this.core.isIOS()) {
				// This doesn't feel right
				//this.core.focus("start");
			// }
			
		// Fix view on load
			
			// Eval fixes and decorations
			let tr_updates = this.core.getViewUpdates(this.view.state);	
			// Dispatch transaction if any corrections have been detected
		    if (tr_updates.constructor === Object && Object.keys(tr_updates).length !== 0) {		    	
		    	let transaction_ = this.core.appendTransactions(this.view.state, tr_updates, this.view.state.tr);
				this.view.dispatch(transaction_);
		    }

	}
	
	/**
	 * Called whenever the view's state is updated. For plugin it meands on every cursor interaction with Editor View
	 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.view^returns.update
	 * @param  {Class} view      	Editor Views
	 * @param  {Class} lastState 	Editor State before
	 * @return {Void}           	Exec changes
	 */
	update(view,prevState) {

			// Close dialogs
				this.core._mCloseTooltip();
				this.core._mCloseDialog(true);

			// Close menu
				if (!this.view.state.selection.empty && typeof this.view.state.selection.node != "undefined" && (this.view.state.selection.node.type.name == "image" || this.view.state.selection.node.type.name == "div" || this.view.state.selection.node.type.name == "svg")  ) { 
					// We can show custom node menu here in future. For now just close menu.
					this.core.closeMenu();
				} else if (!this.view.state.selection.empty) {
					// Show Menu
					this.core.showMenu(this.view);
				} else {
					// Close Menu
					this.core.closeMenu();
				}

			// Done
				return false;

	}

	/**
	 * Called when the view is destroyed or receives a state with different plugins.
	 * Docs: https://prosemirror.net/docs/ref/#state.PluginSpec.view^returns.destroy
	 */
	destroy()
	{
		// Garbage Collector		

			// Get pluging by name (only way to access the plugin from this method)
				let pluginByKey = this.view.state.config.pluginsByKey["extension$"];
			
			// Do not build decorations anymore
				pluginByKey.props.decorations = function() { return null; }				

			// Cancel uploads
				// Find upload placeholders 
				let decos =  pluginByKey.getState(this.view.state);
				let uploads = decos.find(null, null, spec => spec.name == "imageUpload");
				if (uploads.length) {
					// Loop all placeholders
					for (var i = uploads.length - 1; i >= 0; i--) {				
						// Cancel upload by id
						this.core.uploader(null, null, uploads[i].spec.id);
					};
				}

			// Close tooltips
				this.core._mCloseTooltip()
				this.core._mCloseDialog(true)

			// Null core view
				this.core.view = null;

			// Remove window listeners
				window.removeEventListener('resize',this.core.fnWindwoResize);
		
	}

	
}	


// ***********************************************
// ************* Plugin Core Class ***************
// ***********************************************

/**
 * Providing core functionality for extentsion plugin
 */
class pluginCoreClass
{
	/**
	 * Construct Class
	 * @param  {class} 	scheme 			Document schema
	 * @param  {class} 	menuPlugin		Plugin handling editor menu
	 * @param  {class} 	uploaderClass  	Externall Class responsible for handling upload
	 * @return {void}            		Plugin Core Class
	 */
	constructor(schema, menuPlugin, uploaderClass) {
		
		// Variables to use within this class
			// this.aDomEdit = null; // Not needed. The editor dom is set from the view init plugin
			this.view = null;	// set in plugin view method
			this.menuBar = menuPlugin.spec.getMenu();
			this.uploader = uploaderClass;
			
		// Selection to work with while setting links
			this.selection = null;
		
		// Dialog and Tooltip Style Classes
			this.linkClassBottom = "simpleeditor-tooltip-bottom"
		    this.linkClassTop = "simpleeditor-tooltip-top"

		// Link menu
			this.linkDialog = false;
			this.initLinkDialog();
			this.fnLinkDialogEvent = {};
		
		// Link tooltip DOM and vars
			this.linkTooltip = document.createElement("div")
		    this.linkTooltip.className = this.linkClassTop;
		    this.linkTooltipOpen = null;
		    this.linkTooltipTimer = null
		    this.fnLinkTooltipEventClick = {};
			this.fnLinkTooltipEventOver = {};
			this.fnLinkTooltipEventOut = {};
			this.fnLinkTooltipOpenEventOut = {};

	}

	// ============================================
	// HELPERS
	// ============================================
	
		/**
		 * Handle Window resize
		 * @param  {Event} 	e 	Window resize event
		 * @return {void}   	Handle
		 */
		fnWindwoResize(e) {
			this._mCloseDialog(true); //set link
			this.closeMenu();
		}

		/**
		 * Determine if device is iOS - we should probably change this to is mobile since we need this only to determin menu UI for small touch screens.
		 * @return {Boolean} Is/Isn't iOS
		 */
		isIOS() {
		  if (typeof navigator == "undefined") return false
		  let agent = navigator.userAgent
		  return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent)
		}

		/**
		 * NOT USED. Find if element is in Editor DOM. For event target and releatedTarget we can use event.composedPath or event.path but those are not cross-browser supported.
		 * @param  {Element} element DOM to check
		 * @return {Boolean}         Is is editor
		 */
		// inEditor(element) {
		//   while ((element = element.parentElement) && (this.view.dom !== element));
		//   return (element === this.view.dom);
		// }

	// ============================================
	// MENU Methods
	// ============================================
	
		/**
		 * Display and position menu bar
		 * @param  {class} view  	Editor View
		 * @return {view}      		Handle request
		 */
		showMenu(view) {
			
			// Do we have any pending menu items available?
			if (this.menuBar.something) {
				// Yes, there are some available menu items
				
					// Set position				
					if (this.isIOS()) {
						// Mobile
						// DODO: [mobile-menu] - This need new design approach. Preffered, fixed bottom position doesn't work because of virtual keyboard.
							// Fixed bottom (keyboard is overlapping menu)
								// this.menuBar.menu.style.position = "fixed";
								// this.menuBar.menu.style.top = "auto";
								// this.menuBar.menu.style.bottom = "0px";
								// this.menuBar.menu.style.left = "50%";
								// this.menuBar.menu.style.borderRadius = "0px";
								// this.menuBar.menu.style.textAlign = "center";
								// this.menuBar.menu.style.width = "100%";
								// this.menuBar.menu.style.display = "";

							// Float somewhere near
								let hScroll = (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0)
								this.menuBar.menu.style.top = (hScroll+10)+"px";
								this.menuBar.menu.style.left = "50%";
								this.menuBar.menu.style.display = "";

							// Other
								// let menu_ = this.menuBar.menu;
								// let editor_ = this.menuBar.editor;
								// editor_.blur();
								// setTimeout(function(){ 
								// 	// editor_.blur();
								// 	// menu_.blur();
								// 	menu_.firstChild.focus();
								// 	// menu_.select();
								// }, 1500);
					} else {
						// Desktop
							let state = view.state;
							let selection = state.selection;
							if (selection.from == selection.to) {
								// Link is at the begining
								// console.warn("Link is at the begining ??? what was the purpose of this");
								let selectionFrom = state.selection.$from;
								selection.from = selectionFrom.pos-selectionFrom.parentOffset;
							}
							// Show DOM
							this.menuBar.menu.style.display = "";	
							this._mPos(this.menuBar.menu, view, selection, true, true)	

					}

				// Update Menu Bar state
					this.menuBar.isOpen = true;
			}
		}
		
		/**
		 * Hide and update menu bar state
		 * @return {void} Handle request
		 */
		closeMenu() {
			// Hide menu DOM
			this.menuBar.menu.style.display = "none";
			// Update Menu Bar state
			this.menuBar.isOpen = false;
		}

	// ============================================
	// DECORATIONS AND VIEW UPDATES
	// ============================================
		
		/**
		 * Iter over document and collect reuquired changes and/or decorations - KEEP THE LOOP as simple as possible
		 * @param  {class}		state 		Editor State
		 * @param  {integer} 	diffFrom 	Start position (optional)
		 * @param  {integer} 	diffTo   	End position (optional)
		 * @return {object}          		Collection of changes
		 */
		getViewUpdates(state, diffFrom, diffTo) {				

				// Iteration counter (just for development purpose - we want to minimaze/remove iterations)
				let cnt = 0;

				// Object to records required transactions
				const oTransactions = {};

				// Selection variables
				let {from, $from, to, empty} = state.selection

				// Iteration Callback
				const converttitle = (node, pos) => {
					
					// Iteration count
					cnt++;

					// Remove (replace) all invalid H1 (Title) Nodes - we can have only one Title at the top of the document
						
						// EXISTING
							// Working in all cases (remove once tested with new schema as described below)
							if (pos!=0 && ( node.type.name == "title" || (node.type.name == "heading" && node.attrs.level==1) ) ) { 
								
								// Convert to block
									if (typeof oTransactions['setBlockType'] == "undefined") {
										oTransactions['setBlockType'] = [];							
									}
									oTransactions['setBlockType'].push(pos);									
			    				
			    				// Do not traverse child nodes
			    					return false;	
							}
						// NEW
							// By changing schema specs for doc, title, heading we get only partial solution that break on pasted text and larger changes
							// DODO [title] Test after upgrading to latest lib
							// Might be a general issue. See: https://discuss.prosemirror.net/t/cut-and-paste-does-not-restore-the-document/2166/3

					// Check Nodes 

						// Check if specific nodes are empty so we can apply placeholder decoration
					        if (node.type.name == "figcaption" || node.type.name == "title") { // || node.type.name == "paragraph") {

					            if (node.type.isBlock && node.childCount === 0 ) {

					            	// Empty node

					                    if (typeof oTransactions['setMeta'] == "undefined") {
											oTransactions['setMeta'] = [];
										}
										oTransactions['setMeta'].push({key: "emptyNode", pos: {from: pos, to: (pos + node.nodeSize)}});
					            
									// Do not traverse child nodes
			                    		return false;
					            }
					        }						

						// Check figure
			                if (node.type.name=="figure") {
			                	
			                	// Check if figcaption changed so we can set alt attribute on images (must be before other figure/figcaption transactions)
				                	if (typeof oTransactions['catptionImgAlt'] == "undefined") {
										oTransactions['catptionImgAlt'] = [];							
									}			                	
				                	oTransactions['catptionImgAlt'].push({from:pos,to:pos+node.nodeSize});

			                  	// Remove figure that has only figcaption
			                  	if (node.childCount!=0 && node.firstChild.type.name == "figcaption") {
			      					
			      					// console.warn("tr.delete is causing possition issue. we need to keep it here. we should reale do this with schema: ", node.nodeAt(0), {from:pos+1,to:pos+1+node.nodeAt(0).nodeSize});

			      					/*
			      					// Delete (is breaking history and failing end the end of the node)
										if (typeof oTransactions['delete'] == "undefined") {
											oTransactions['delete'] = [];
										}
										// DELTE FIGURE
											//oTransactions['delete'].push({from:pos,to:pos+node.nodeSize});
										// DELETE CAPTION
											oTransactions['delete'].push({from:pos+1,to:pos+1+node.nodeAt(0).nodeSize});

									*/
								
									// Do not traverse
			                  		return false;

			                  	// Remove (Replace) empty figure
			                  	} else if (node.childCount==0) {			                  		

									// Check if figure has any DOM placeholders (if not we can remove the figure)
										
										let keepFigure = false;
										let linkKey = state.config.pluginsByKey["extension$"];
										let decos =  linkKey.getState(state);
										let placeholders = decos.find(null, null, spec => spec.name == "figwrap" ); // console.log("this.core.view.state", decos, uploads);

										if (placeholders.length!=0) {
											// all state decos are related to figure placeholders
											keepFigure = true;
										}
										if (!keepFigure) { 
											// console.log('remove figure'); // delete is  breaking history and causing errors
											if (typeof oTransactions['replaceWithParagraph'] == "undefined") {
												oTransactions['replaceWithParagraph'] = [];
											}
											oTransactions['replaceWithParagraph'].push({from:pos,to:pos+node.nodeSize});
										}
										

			                  		// Do not traverse child nodes
			                  			return false;
			                  	} else {	                  		
			                  		// Do traverse child nodes
			                  			return true;
			                  	}
			                } else {
			                	// Do not traverse child nodes
			                    	return false;
			                }
				}

				// Loop document nodes
					if (typeof diffFrom!=="undefined" && typeof diffTo!=="undefined") {
						// Range loop
						state.doc.nodesBetween(diffFrom,diffTo,converttitle);
					} else {
						// Full loop
						state.doc.descendants(converttitle);
					}

				// Info (try to minimize the iteration)
					// console.log("=====================")
					// console.log("\t=>Iter size", cnt);
					// console.log("=====================")					

				// Return changes to be appended transaction
					return oTransactions;

		}
		appendTransactions(oState,oTransactions,oTrans)
		{

				// Replace transactions
				
					for (var key in oTransactions) {
						switch (key) {
							case "setBlockType":
								for (var i = 0; i < oTransactions['setBlockType'].length; i++) {
									oTrans.setBlockType(oTransactions['setBlockType'][i]+1, oTransactions['setBlockType'][i]+1, oState.schema.nodes.heading, {level: 2})
								};
							break;
							case "replaceWithParagraph":
								let wrap_p = null;
								let wrap_pos = {}
								for (var i = 0; i < oTransactions['replaceWithParagraph'].length; i++) {
									oTrans.replaceRangeWith(oTransactions['replaceWithParagraph'][i].from, oTransactions['replaceWithParagraph'][i].to, oState.schema.nodes.paragraph.create());
								};
							break;
						}
					}
								
				
				// WE NEED TO AVOID DELETE transactions because they are breakin positions. Failed without workaround on paste whole text from https://www.jafholz.cz/produkty/sluzby/nabytkove-dilce. It breaks when we try to remove figcaption.
				/*
				
					var minusPos = 0;
					if (typeof oTransactions['delete'] != "undefined") {

						// must be last trans because we are shifting positions					
						for (var i = 0; i < oTransactions['delete'].length; i++) {

							// Test if node is there
							let $pos_d = oState.doc.resolve(oTransactions['delete'][i].from-minusPos); //, index = $pos_.index()

							console.warn("DELETE: is node still there? ", $pos_d, minusPos);

								// remove empty figure
								oTrans.delete(oTransactions['delete'][i].from-minusPos, oTransactions['delete'][i].to-minusPos)
								//console.warn("rem:",oTransactions['delete'][i].from, oTransactions['delete'][i].to, minusPos, oState.doc)
								
								// calc correction
								minusPos += oTransactions['delete'][i].to-oTransactions['delete'][i].from;		

		      					
						};
					}

				*/

				// Update Image Alt from Figcaption
					if (typeof oTransactions['catptionImgAlt'] != "undefined") {
						let cap_text = "";
						let fig_imgs = [];
						let img_el = null;
						for (var i = 0; i < oTransactions['catptionImgAlt'].length; i++) {
							// Update caption for affected figure images
								
								// Reset
								cap_text = "";
								fig_imgs = [];
								img_el = null;

								// Loop figure nodes
								oState.doc.nodesBetween(oTransactions['catptionImgAlt'][i].from, oTransactions['catptionImgAlt'][i].to, function(oNode, oPos)
								{
									
									switch (oNode.type.name) {
										case "image":
											// console.log(oNode);
											fig_imgs.push({pos:oPos,attrs:oNode.attrs,node:oNode});
										break;
										case "figcaption":
											if (String.prototype.trim) {
										      cap_text = oNode.textContent.trim();
										    } else {
										      // Since IE doesn't include non-breaking-space (0xa0) in their \s
										      // character class (as required by section 7.2 of the ECMAScript spec),
										      // we explicitly include it in the regexp to enforce consistent
										      // cross-browser behavior.
										      // NOTE: We don't use String#replace because it might have side effects
										      // causing this function to not compile to 0 bytes.
										      cap_text =  /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(oNode.textContent)[1];
										    };
										    if (cap_text.length==0)	{
										    	cap_text = null; // should remove alt
										    }
										break;
										case "figure":
											return true;
										break;
									}
									return false;
								});	

								// Update Images
								if (fig_imgs.length>0) {
									for (var j = fig_imgs.length - 1; j >= 0; j--) {
										if (fig_imgs[j].attrs.alt != cap_text) {											
											// Replacing src will flicker in Safari (Correct approach)
												//oTrans.setNodeMarkup(fig_imgs[j].pos, null, {src: fig_imgs[j].attrs.src, alt: cap_text});		
											// Change DOM and update Node directly (not-recommended but flicker is an issue)
												img_el = this.view.nodeDOM(fig_imgs[j].pos) || null;
												if (img_el!==null) {
													if (cap_text===null) {
														fig_imgs[j].node.attrs.alt = cap_text;
														img_el.removeAttribute('alt');
													} else {
														fig_imgs[j].node.attrs.alt = img_el.alt = cap_text;
													}
												}
  										}
									}
								}
						};
					}

				// Add FigCaption Node
					if (typeof oTransactions['insertCaption'] != "undefined") {
						let wrap_cap = null;
						let wrap_pos = null;
						for (var i = 0; i < oTransactions['insertCaption'].length; i++) {
							// Add caption but cursor must be set in subsequesnt dispatch call
								wrap_cap = new Slice(Fragment.from(oState.schema.nodes.figcaption.create()),0,0)
								wrap_pos = oTransactions['insertCaption'][i];
								oTrans.replace(wrap_pos, wrap_pos, wrap_cap);
						};
					}
				
				// Add HR Node
					if (typeof oTransactions['replaceWithHr'] != "undefined") {
						let wrap_hr_pos = null;
						let wrap_hr_ = null;
						for (var i = 0; i < oTransactions['replaceWithHr'].length; i++) {
							//TEST: not needed to work with position
								//wrap_hr_pos = oTransactions['replaceWithHr'][i]-minusPos+plusPos;	
								//// console.warn("replaceWithHr",wrap_hr_pos, oState.selection)
								//oTrans.replaceRange(wrap_hr_pos, wrap_hr_pos, oState.schema.nodes.horizontal_rule.create());
							//OK: wo/ new p
								//oTrans.replaceSelectionWith(oState.schema.nodes.horizontal_rule.create());
							//NEW wt/ new p
								wrap_hr_ = Fragment.empty;
								wrap_hr_ = wrap_hr_.append(Fragment.from(oState.schema.nodes.horizontal_rule.create()))
								wrap_hr_ = wrap_hr_.append(Fragment.from(oState.schema.nodes.paragraph.create()))						 	
							 	wrap_hr_ = new Slice(wrap_hr_,1,1);
								oTrans.replaceSelection(wrap_hr_);
								oTrans.scrollIntoView();
						}
					}
				
				// Add Decorations
					if (typeof oTransactions['setMeta'] != "undefined") {
						const plugin = oState.config.pluginsByKey["extension$"];
						const setMeta_decos = oTransactions['setMeta'];
						let setMeta_object = {}
						for (var i = setMeta_decos.length - 1; i >= 0; i--) {
							let id_ = setMeta_decos[i]['id'] || {};
							// in case key is already defined, create key array 
							if (setMeta_object.hasOwnProperty(setMeta_decos[i]['key'])) {
								if (Array.isArray(setMeta_object[setMeta_decos[i]['key']])) {
									setMeta_object[setMeta_decos[i]['key']].push({id_, pos:  setMeta_decos[i]['pos']});
								} else {
									setMeta_object[setMeta_decos[i]['key']] = [setMeta_object[setMeta_decos[i]['key']],{id_, pos:  setMeta_decos[i]['pos']}];
								}
							} else {
								setMeta_object[setMeta_decos[i]['key']] = {id_, pos:  setMeta_decos[i]['pos']};
							}
						};
						// Add to transaction
						oTrans.setMeta(plugin, setMeta_object);
					}


				// Add Text Selection
					if (typeof oTransactions['textSelection'] != "undefined") {

						let newPos = oState.doc.resolve(oTransactions['textSelection']) || null;
						if (newPos!==null) {
							let newSel = new TextSelection.between(newPos,newPos)
							try {
								oTrans.setSelection(newSel);
								oTrans.scrollIntoView();
							} catch (err) {
								//console.error("Selection doesn't point to valid position: ",err);
							}
							
						}

					}

				// Return updated
					return oTrans;

		}


	// ============================================
	// SET INI (and OTHER) FOCUS to the editor view - PENDING iOS because Apple really doesn’t want you to focus input fields that the user hasn’t tapped on.
	// ============================================
		
		focus(position = null) {
		    if ((this.view.hasFocus() && position === null) || position === false) {
		      return
		    }

		    const { from, to } = this.resolveSelection(position)		    

		    this.setSelection(from, to)
		    setTimeout(() => this.view.focus(), 0)
		}
		resolveSelection(position = null) {
		    
			const selection = {
		      from: this.view.state.selection.from,
		      to: this.view.state.selection.to,
		    }
		    
		    if (selection && position === null) {
		      return selection
		    }

		    // Change this to find 1st text focusable node
		    if (position === 'start' || position === true) {
		    	// Find 1st text focusable node
		    		//console.warn("start - iter over doc to find first text focusable node position", this.view.state.doc.firstChild);
		    		return {
						from: 1,
						to: 1,
					}
		    	// Return position
					// return {
					// 	from: 0,
					// 	to: 0,
					// }
		    }

		    // Change this to find last text focusable node
		    if (position === 'end') {
		      	// Get doc
		      		const { doc } = this.view.state		     
		      	// Find last text focusable node
		    		// console.warn("end - iter over doc to find last text focusable node position", this.view.state.doc.firstChild);
		    	// Return position
				return {
					from: doc.content.size,
					to: doc.content.size,
				}
		    }

		    return {
		      from: position,
		      to: position,
		    }
		 
		}
		minMax(value = 0, min = 0, max = 0) {
		  return Math.min(Math.max(parseInt(value, 10), min), max)
		}
		setSelection(from = 0, to = 0) {
		    const { doc, tr } = this.view.state;
		    const resolvedFrom = this.minMax(from, 0, doc.content.size)
		    const resolvedEnd = this.minMax(to, 0, doc.content.size)
		    const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd)
		    const transaction = tr.setSelection(selection)

		    this.view.dispatch(transaction)		    
		}

	// ============================================
	// BLOCK MENU HANDLER
	// ============================================
		
		fnCallback_blockMenu(type,arg,e) {				                  				
			// Stop event so we don't break range and focus 
				e.preventDefault();
				e.stopPropagation();
			// Remove all blockMenu listeners
				// Remove caller listener
					//e.target.removeEventListener('mousedown',this.fnCallback_blockMenu,type,arg);
				// Remove All block menu buttons' listeners to prevent memory leaks
					let el_ = e.currentTarget.parentNode;
					let el_child_ = null;
					for (var i = el_.childNodes.length - 1; i >= 0; i--) {
					 	el_child_ = el_.childNodes[i];
					 	if (el_child_.tagName == "BUTTON") {
					 		el_child_.removeEventListener('mousedown',this.fnCallback_blockMenu);
					 	}
					 };

			// Create transaction
				let transaction_ = {};
				switch (type) { 
					case "replaceWithVideoDecoration":
					// Add video source decorations																						
						transaction_ = this.appendTransactions(this.view.state, {"setMeta":[{key: "videoSource", pos: arg}]}, this.view.state.tr);
						this.view.dispatch(transaction_);
					break;
  				case "replaceWithHr":
      				// Create and dispatch transaction
      					transaction_ = this.appendTransactions(this.view.state, {"replaceWithHr":[arg]}, this.view.state.tr);
      					this.view.dispatch(transaction_);													                  					
  				break;
				}
			// Done (not needed becauase we are preventing default browser behavior anyway) 
				return true;
		} 


	// ============================================
	// FIGCAPTION DECORATIN HANDLER
	// ============================================
		
		fnCallback_figureCaption(arg,e) {	

			// Stop event so we don't break range and focus 
				e.preventDefault();
				e.stopPropagation();
			// Remove all blockMenu listeners
				e.target.removeEventListener('mousedown',this.fnCallback_figureCaption,arg);
			// Create transactions
				// Add Figcaption Node
					let transaction_ = this.appendTransactions(this.view.state, {"insertCaption":[arg]}, this.view.state.tr);
					this.view.dispatch(transaction_);
				// Add text selection to new Node
					let transaction__ = this.appendTransactions(this.view.state, {"textSelection": arg}, this.view.state.tr);
					this.view.dispatch(transaction__);
			// Done (not needed becauase we are preventing default browser behavior anyway) 
				return true;
		}

	// ============================================
	// IMAGE HANDLER
	// ============================================


		imagePreview(file) 
		{
			
		  var reader = new FileReader;
		  return new Promise(function (accept, fail) {
		    reader.onload = function () { 
		    
		    	// Helpers
			    	function _getOrientation(imageData) {
			    		// https://jsfiddle.net/wunderbart/dtwkfjpg/
						// find orientation
						try {
							//var view = new DataView(base64ToArrayBuffer(imageData));
							var view = new DataView(imageData);

						    if (view.getUint16(0, false) != 0xFFD8) return (-2);

						    var length = view.byteLength,
						        offset = 2;

						    while (offset < length) {
						      var marker = view.getUint16(offset, false);
						      offset += 2;

						      if (marker == 0xFFE1) {
						        if (view.getUint32(offset += 2, false) != 0x45786966) {
						          return (-1);
						        }
						        var little = view.getUint16(offset += 6, false) == 0x4949;
						        offset += view.getUint32(offset + 4, little);
						        var tags = view.getUint16(offset, little);
						        offset += 2;

						        for (var i = 0; i < tags; i++)
						          if (view.getUint16(offset + (i * 12), little) == 0x0112)
						            return (view.getUint16(offset + (i * 12) + 8, little));
						      }
						      else if ((marker & 0xFF00) != 0xFF00) break;
						      else offset += view.getUint16(offset, false);
						    }
						    return (-1);
						} catch(err){
							return (-1);
						}				    	
					}
					//
					function _arrayBufferToBase64( buffer ) {
					  var binary = ''
					  var bytes = new Uint8Array( buffer )
					  var len = bytes.byteLength;
					  //console.error("len",len);
					  for (var i = 0; i < len; i++) {
					    binary += String.fromCharCode( bytes[ i ] )
					  }
					  return window.btoa( binary );
					}
					//
					/*
					function _arrayBufferToBase64( buffer ) {
					  var binary = ''
					  var bytes = new Uint8Array( buffer )
					  var len = bytes.byteLength;
					  for (var i = 0; i < len; i++) {
					    binary += String.fromCharCode( bytes[ i ] )
					  }
					  return window.btoa( binary );
					}
					function getOrient(imageData) {
						var base64img = "data:" + file.type + ";base64," + _arrayBufferToBase64(imageData);
				        var scanner = new DataView(imageData);
				        var idx = 0;
				        var value = 1; // Non-rotated is the default
				        if (imageData.length < 2 || scanner.getUint16(idx) != 0xFFD8) {
				            // Not a JPEG
				            return [base64img, value];
				        }
				        idx += 2;
				        var maxBytes = scanner.byteLength;
				        var littleEndian = false;
				        while (idx < maxBytes - 2) {
				            var uint16 = scanner.getUint16(idx, littleEndian);
				            idx += 2;
				            switch (uint16) {
				                case 0xFFE1: // Start of EXIF
				                    var endianNess = scanner.getUint16(idx + 8);
				                    // II (0x4949) Indicates Intel format - Little Endian
				                    // MM (0x4D4D) Indicates Motorola format - Big Endian
				                    if (endianNess === 0x4949) {
				                        littleEndian = true;
				                    }
				                    var exifLength = scanner.getUint16(idx, littleEndian);
				                    maxBytes = exifLength - idx;
				                    idx += 2;
				                    break;
				                case 0x0112: // Orientation tag
				                    // Read the value, its 6 bytes further out
				                    // See page 102 at the following URL
				                    // http://www.kodak.com/global/plugins/acrobat/en/service/digCam/exifStandard2.pdf
				                    value = scanner.getUint16(idx + 6, littleEndian);
				                    maxBytes = 0; // Stop scanning
				                    break;
				            }
				        }
				        return [base64img, value];
					}
					*/

				// Get Orientation
					var image_data = _getOrientation(reader.result); //getOrient(reader.result);  // img: 1 8 3 6; img-mirror: 2 7 4 5

		    	// Return dimmensions
			    	
			    	var image_sz = new Image();
				    image_sz.src = "data:" + file.type + ";base64," + _arrayBufferToBase64(reader.result); //_arrayBufferToBase64(reader.result); //image_data[0]; //reader.result;
				    image_sz.onload = function() {
				    	if ('naturalHeight' in this) {
				            if (this.naturalHeight + this.naturalWidth === 0) {
				                this.onerror();
				                return;
				            }
				        } else if (this.width + this.height == 0) {
				            this.onerror();
				            return;
				        }
				        // access image size here 
				        //console.log("WIDTH x HEIGHT; Orientation", this.width, this.height, image_data);
				        var dim = [this.width, this.height, image_data];
				        image_sz = null;	

				        return accept( dim );
				    };
				    image_sz.onerror = function() {
				        //display error
				        return accept( null );
				    };
				    
				// Return source
		    		// return accept(reader.result);
		    		// return accept(image_data[0]);

		    };
		    reader.onerror = function () { return fail(reader.error); };
			//return reader.readAsDataURL(file.slice(0, 64 * 1024)); 
			return reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // array buffer to get the orientation 
		  })
		}

		fnCallback_upload(pos, action, data) 
		{

			// Has View
				if (this.view==null) {
					return;
				}
			
			// Vars
				let decos = [];															// Array of decorations to be found
	          	let oView = this.view;													// View we are at
	          	let oTrans = this.view.state.tr;										// View transactions
	          	let oPos =  pos.from+1;  												// Start position of the node widget is in (= oTrans.selection.from; for the 1st call)
	          	let oPosSel = pos.to; 													// End position of the node widget is in
	          	let linkKey = this.view.state.config.pluginsByKey["extension$"];		// This pluging            		
              	let id = {};								 							// ID for this upload
              	let wrap_img = null;													// Fragment var we will use to build wrapper (figure+p)

              	// console.warn("pos (i.e. if sel is 100 we need 99,101)", action, oTrans.selection.from, pos)
              	
            // Select action
				switch (action) {
					case "open":
						id = "figwrap_"+data;
						// Build wrapper
						wrap_img = Fragment.empty;				
						wrap_img = wrap_img.append(Fragment.from(oView.state.schema.nodes.figure.createAndFill()))
						wrap_img = wrap_img.append(Fragment.from(oView.state.schema.nodes.paragraph.createAndFill()))
						wrap_img = new Slice(wrap_img,0,0)						
						// Correct 1st pos - SOMETIMES pos is offset by 1 (insert hr and than img). i.e. if sel is 100 we need 99,101
						pos.from = oTrans.selection.from-1;
						pos.to = oTrans.selection.from+1;
						// Add wrapper to transactions
						if (this.view==null) {
							return;
						}						
						oView = this.view;													// View we are at
	          			oTrans = this.view.state.tr;						// View transactions
	          			oTrans.setMeta(linkKey, {open: {id, pos: pos}}) // to keep empty figure
						oTrans.replaceRange(pos.from, pos.to, wrap_img); //oTrans.replaceSelection(wrap_img) doesn't work if hr is before widget node
						// Dispatch transcations
							// ORIG
								// oView.dispatch(oTrans);
							// NEW - go to new paragraph now
								oView.dispatch(oTrans);
								oView = this.view;													// View we are at
		          				oTrans = this.view.state.tr;										// View transactions
								oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel)));
								oTrans.scrollIntoView();
								oView.dispatch(oTrans);
								oView.focus()
					break;
					case "add":
						// console.log("add")						
						// Add remove reference to id
						id.uploader = data.uploader;
						id.fileid = data.fileid;
						// Add decoration to transactions
						if (this.view==null) {
							return;
						}
						oView = this.view;													// View we are at
	          			oTrans = this.view.state.tr;										// View transactions					
						oTrans.setMeta(linkKey, {add: {id: id, pos: oPos}})
						// Dispatch 
						oView.dispatch(oTrans);


						// Preview, Dimensions
						this.imagePreview(data.file).then(function (dim_) {
							//console.warn("READ OK", this.view)
							if (this.view==null) {
								return;
							}						
							oView = this.view;													// View we are at
		          			oTrans = this.view.state.tr;										// View transactions
							// On Reader success							
							var ppos = linkKey.spec.imagePlaceholder(oView.state, id, linkKey);
			                // If the content around the placeholder has been deleted, drop the image
			                if (ppos == null) { return }	
			               	// Add preview to transaction			               	
			                oTrans.setMeta(linkKey, {preview: {id: id, dim: dim_, src: URL.createObjectURL(data.file) }} )
			                	// OLD
			                		// oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel))) // must re-focus at p after this async transaction
			                	// NEW:
			                		oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel))) // must re-focus at p after this async transaction
			                		oTrans.scrollIntoView();
			                		oView.focus()
			            	// Dispatch 
							oView.dispatch(oTrans);
						}.bind(this), function () {
							// console.warn("READ FAIL", this.view)
							if (this.view==null) {
								return;
							}						
							oView = this.view;													// View we are at
		          			oTrans = this.view.state.tr;										// View transactions
							// On Reader failure
							// On Reader success							
							var ppos = linkKey.spec.imagePlaceholder(oView.state, id, linkKey);
			                // If the content around the placeholder has been deleted, drop the image
			                if (ppos == null) { return } 
							// Add preview to transaction							
			                oTrans.setMeta(linkKey, {preview: {id: id, dim: null }} )
			                	//OLD: 
			                		// oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel))) // must re-focus at p after this async transaction
			                	// NEW:
			                		oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel))) // must re-focus at p after this async transaction
			                		oTrans.scrollIntoView();
			                		oView.focus()
			            	// Dispatch 
							oView.dispatch(oTrans);								
						}.bind(this));

						// Return id
						return id;
					break;
					case "progress":
						
						//console.log("progress:", data.id, data.value)
						if (this.view==null) {
							return;
						}						
						oView = this.view;													// View we are at
	          			oTrans = this.view.state.tr;										// View transactions
						oView.dispatch(oView.state.tr.setMeta(linkKey, {progress: {id: data.id, value: data.value}}));

					break;
					case "remove":

						if (this.view==null) {
							return;
						}

						oView = this.view;													// View we are at
	          			oTrans = this.view.state.tr;										// View transactions
						oView.dispatch(oView.state.tr.setMeta(linkKey, {remove: {id: data.id}}));

					break;
					case "update":

						// console.log("update:", data.id)
						if (this.view==null) {
							return;
						}
						oView = this.view;													// View we are at
	          			oTrans = this.view.state.tr;										// View transactions


						// Otherwise, insert it at the placeholder's position, and remove
						// the placeholder
						
						// preload url
						var image_preload = new Image();
					    image_preload.src = data.url;
					    image_preload.onload = function(data_,event_) {
					    	if (this.view==null) {
								return;
							}
							oView = this.view;													// View we are at
		          			oTrans = this.view.state.tr;										// View transactions
		          			
					    	if ('naturalHeight' in image_preload) {
					            if (image_preload.naturalHeight + image_preload.naturalWidth === 0) {
					                image_preload.onerror();
					                return;
					            }
					        } else if (image_preload.width + image_preload.height == 0) {
					            image_preload.onerror();
					            return;
					        }

					        // Find decoration position
					        var ppos = linkKey.spec.imagePlaceholder(oView.state, data_.id, linkKey);
							
					        // console.warn("update preview",data_,ppos);
					        // return;

							if (ppos == null) { 
								image_preload.onerror();
								return;
							}
							// if (data.id.fileid > 0) {
							// 	console.error("fix img class if there are still svg placeholders");
							// 	return;
							// }
							
					        // console.error("data.url - relative path, image_preload.src - absolute path");
					        // console.error("data.url", data.url);
					        // console.error("image_preload.src", image_preload.src);
					    	
					    	// OLD - wrong position if there are mutpliple placeholders with multiple images
						    	/*
						    	oView.dispatch(oView.state.tr
							      .replaceWith(ppos, ppos, oView.state.schema.nodes.image.create({src: data_.url})) //data.url - relative path, image_preload.src - absolute path
							      .setMeta(linkKey, {remove: {id: data_.id}}));
						    	*/
						    // NEW - update only meta
						    	// console.error("loaded but flickers...", data_);
						    	
						    	oView.dispatch(oView.state.tr
							      // .replaceWith(ppos, ppos, oView.state.schema.nodes.image.create({src: data_.url})) //data.url - relative path, image_preload.src - absolute path
							      .setMeta(linkKey, {update: {id: data_.id, url: data_.url}})); // might not be needed because url is already set by reference on the this decoration
								
					    	image_preload = null;
					    	// Is this last image?
					    	decos = linkKey.getState(oView.state)
							let figwrap = decos.find(null, null, spec => (spec.name == "figwrap" && spec.id == "figwrap_"+data_.id.uploader));
					    	if (figwrap.length>0) {
					    		this.fnCallback_upload({from: figwrap[0].from, to: figwrap[0].to}, "close", data_.id.uploader);
					    	}
					    }.bind(this, data);
					    image_preload.onerror = function(data_,event_) {
					        //display error
					        if (this.view==null) {
								return;
							}
							oView = this.view;													// View we are at
		          			oTrans = this.view.state.tr;										// View transactions
					        oView.dispatch(oView.state.tr.setMeta(linkKey, {remove: {id: data_.id}}));
					        // Is this last image?
					    	decos = linkKey.getState(oView.state)
							let figwrap = decos.find(null, null, spec => (spec.name == "figwrap" && spec.id == "figwrap_"+data_.id.uploader));
					    	if (figwrap.length>0) {
					    		this.fnCallback_upload({from: figwrap[0].from, to: figwrap[0].to}, "close", data_.id.uploader);
					    	}
					    }.bind(this, data);						

					break;
					case "close":
						if (this.view==null) {
							return;
						}

						// Is the upload still in progress
						decos = linkKey.getState(oView.state)
						let pendingUploads = decos.find(null, null, spec => (spec.name == "imageUpload" && spec.id.uploader == data && typeof spec.id.url == "undefined"));

						// console.error("has pending uploads: ", pendingUploads);
						
						if (pendingUploads.length>0){
							// Uploads are still
							return;
						} else {

							let completedUploads = decos.find(null, null, spec => (spec.name == "imageUpload" && spec.id.uploader == data));

							if (completedUploads.length>0) {

								//console.info("All uploaded we can now append images to document",completedUploads, oPosSel);

								// DODO: [image-flicker] - Try to remove img flicker while replacing placeholders (see also: https://discuss.prosemirror.net/t/update-node-attributes-without-re-rendering-the-node/2416)
								
								// Removing placeholders before add img reduces flicer 
								oTrans.setMeta(linkKey, {removeAll: {name: "imageUpload", uploader: data},close: {id:"figwrap_"+data}});
								
								// Add imgs
								for (var i = completedUploads.length - 1; i >= 0; i--) {
									// WORKING
										oTrans.replaceWith(completedUploads[i].from, completedUploads[i].to, oView.state.schema.nodes.image.create({src: completedUploads[i].spec.id.url})); //data.url - relative path, image_preload.src - absolute path									
									// TEST (no render replacement)
										// oTrans.replaceSelectionWith(oView.state.schema.nodes.image.create({src: completedUploads[i].spec.id.url})); //data.url - relative path, image_preload.src - absolute path									
										// const transaction = view.state.tr.setNodeMarkup(getPos(), null, {src: node.attrs.src, width: outer.style.width} ).setSelection(view.state.selection);
										// oTrans.setSelection(this.view.state.selection);
									// Image has size 1 
										//oPosSel++;
								};
								
								// // Dispatch
								//oView.dispatch(oTrans);
							}
						}

						// NEW 
							// Dispatch
								oView.dispatch(oTrans);
							// Refocus
								oView.focus()

						// ORIG - focus after upload comples

						/*
							id = "figwrap_"+data;
							oView = this.view;													// View we are at
		          			oTrans = this.view.state.tr;										// View transactions
							// Remove fig decoration
								oTrans.setMeta(linkKey, {close: {id:id}}) // to mark figure filled
							// Set selection to wrapper paragraph
								oTrans.setSelection(oView.state.selection.constructor.near(oView.state.tr.doc.resolve(oPosSel)));
							// Dispatch				
								oView.dispatch(oTrans.scrollIntoView());
							// Focus view
								oView.focus()
						*/
					break;
				}


		
		//--------

            // test on upload complete add src
              
              // setTimeout( function() {
              //     let pos = linkKey.spec.imagePlaceholder(view.state, id, linkKey);
              //     // If the content around the placeholder has been deleted, drop
              //     // the image
              //     if (pos == null) return
              //     // Otherwise, insert it at the placeholder's position, and remove
              //     // the placeholder
              //       console.log("id",id,attrs.src);
              //       // On success replace 
              //         // view.dispatch(view.state.tr
              //         //               .replaceWith(pos, pos, nodeType.create({src: attrs.src}))
              //         //               .setMeta(linkKey, {remove: {id}}))
              //       // On failure, just clean up the placeholder
              //         // view.dispatch(view.state.tr.setMeta(linkKey, {remove: {id}}))
              // }, 3000);
			


		}

	// ============================================
	// link stuff
	// ============================================
		

		// Only from interface method removeLink()
		mUnlink(oView, fn, oV)
		{
			// command puts oState, fnDispatch, oView
			if ( oV && oV.dispatch ) { oView = oV; }

			
			// NEW:
			toggleMark(oView.state.schema.marks.link)(oView.state, oView.dispatch)
          	return true

          	// OLD:
          	/*
			if ( ! this._mIsLink(oView, oPos) ) { return; }

			let oPos = this._mGetMarkPos(oView.state, 'link');
			// if (oPos.from == oPos.to && !oView.state.selection.empty) {
			if (oPos.from == oPos.to) { // && !oView.state.selection.empty) {
				// link is at the begingng
				let sFrom = oView.state.selection.$from;
				oPos.from = sFrom.pos-sFrom.parentOffset;
				//console.log("fix get parent postion", oPos.from, sFrom.parentOffset)
			}
			let oTransaction = oView.state.tr.removeMark(oPos.from, oPos.to, oView.state.schema.marks.link);
			oView.dispatch(oTransaction);
			return true;
			*/
		}
		

		// Set link is call on _mCloseDialog(). 
		// DO NOT CALL THIS DIRECTLY
		mSetLink(oView)
		{
			// Do we have something to mark
			if (this.selection==null || this.selection.from == this.selection.to) { return false;}

			// set selection
			let oPos =  this.selection; //{ from: oState.selection.from, to: oState.selection.to };
			// get whole mark positions if selection is not empty
			// if (!oView.state.selection.empty) {
			// 	this._mIsLink(oView) && ( oPos = this._mGetMarkPos(oView.state, 'link') );
			// }

			let vUrl = this.linkDialog.i.value;
			if (String.prototype.trim) {
		      vUrl = vUrl.trim();
		    } else {
		      // Since IE doesn't include non-breaking-space (0xa0) in their \s
		      // character class (as required by section 7.2 of the ECMAScript spec),
		      // we explicitly include it in the regexp to enforce consistent
		      // cross-browser behavior.
		      // NOTE: We don't use String#replace because it might have side effects
		      // causing this function to not compile to 0 bytes.
		      vUrl =  /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(vUrl)[1];
		    };
			let oAttr = { href: vUrl };
			//this.linkDialog.isTarget.checked && (oAttr.target = "_blank");
			oAttr.target = "_blank";

			let oMarkType = oView.state.schema.marks.link;
			
			let oTransaction = null;
			if (oAttr.href.length!=0) {
				// link type
				// let emlReg = new RegExp('^[+a-zA-Z0-9_.!#$%&\'*\\/=?^`{|}~-]+@([a-zA-Z0-9-]+\\.)+[a-zA-Z0-9]{2,63}$');
				// if (emlReg.test(oAttr.href)) {
				// 	oAttr.href = "mailto:"+oAttr.href;
				// }

				// remove and add link
				oTransaction = oView.state.tr
					.removeMark(oPos.from, oPos.to, oMarkType)
					.addMark(oPos.from, oPos.to, oMarkType.create(oAttr))
				// dispatch
				oView.dispatch(oTransaction);
				// set cursor at the end of the link
				this._mSelect(oView,{ from: oPos.to, to: oPos.to},true);	

			} else {
				// remove link
				oTransaction = oView.state.tr
					.removeMark(oPos.from, oPos.to, oMarkType)
				// dispatch
				oView.dispatch(oTransaction);
				// select removed
				// console.error("select removed link text", oPos);
				this._mSelect(oView,oPos, true);
			}
			
			//ORIG: IE has issue with this focus (causing jumps to top of the document?)
				// oView.focus();
			// NEW
				// No need to focus (anyway it was done in mSelect)
			
			return true;
		}

	// ============================================
	// tooltip stuff
	// ============================================
	

		mShowTooltip(oView,oTarget) {
			// Based on tooltip https://prosemirror.net/examples/tooltip/
			
			// Do not show if menu bar is open
				if (this.menuBar.isOpen) {
					return false;
				}

			// Get selection from the event
			
				let oSel = this._mGetMarkPosFromDomEvent(oView, oTarget);

			// Is there anything at all (like oView.state.selection.empty)
			
				if (oSel.to <= oSel.from) {
					return false;
				}

			// Append fresh tooltip element to dom
				
				// this.aDomEdit.parentNode.appendChild(this.linkTooltip);
				document.body.appendChild(this.linkTooltip);

			// Update new target referrence for the tool tip
								
				
				this.linkTooltipOpen = oTarget;
				// Clear any pending close timer
				if (this.linkTooltipTimer != null) {
					clearTimeout(this.linkTooltipTimer)
		      		this.linkTooltipTimer = null
		      	}

		    // Update tooltip events
		    
				// Remove existing event handlers
				this.linkTooltip.removeEventListener('click', this.fnLinkTooltipEventClick);
				this.linkTooltip.removeEventListener('mouseover', this.fnLinkTooltipEventOver);
				this.linkTooltip.removeEventListener('mouseout', this.fnLinkTooltipEventOut);
				oTarget.removeEventListener('mouseout', this.fnLinkTooltipOpenEventOut);

				// Define new event handlers
				this.fnLinkTooltipEventClick = this._mEventTooltipClick.bind(this, oView, oTarget);
				this.fnLinkTooltipEventOver = this._mEventTooltipOpen.bind(this, oTarget)
				this.fnLinkTooltipEventOut = this._mEventTooltipOpen.bind(this, null);
				this.fnLinkTooltipOpenEventOut = this._mEventTooltipOpen.bind(this,null);

				// Assign new event Handlers
				this.linkTooltip.addEventListener('click', this.fnLinkTooltipEventClick);
				this.linkTooltip.addEventListener('mouseover', this.fnLinkTooltipEventOver);
				this.linkTooltip.addEventListener('mouseout', this.fnLinkTooltipEventOut);
				oTarget.addEventListener('mouseout', this.fnLinkTooltipOpenEventOut);

			// Show tooltip element
		
				this.linkTooltip.style.display = ""
			
			// Set dom textcontent
			
				this.linkTooltip.textContent = oTarget.getAttribute("href");

			// Postion 	
		
				this._mPos(this.linkTooltip, oView, oSel);
			
		}


		
		_mPos(oElm, oView, oSel, opt_DefaultToTop_, opt_menu_) {

			// console.log("fix:",oElm.offsetParent);
			// Get Selection Rect

					// tests with selection
					//oSel = oView.state.selection;				

					// Get coords from selection (contract selection to workaround start/end of the line mismatch)
					let cntr = 1; // contract selection to workaround line breaks (i.e. get coords at from+1 and to-1)
					let fromSel = oView.coordsAtPos(oSel.from+cntr); 
					let toSel = oView.coordsAtPos(oSel.to-cntr);

					// Correct Zero-Width start/end points (line breaks, node boundaries)

					// let fromSelZero = oView.coordsAtPos(oSel.from+1); 
					// let toSelZero = oView.coordsAtPos(oSel.to-1);

					// //if (oSel.to-oSel.from>1) {
					// 	if (fromSel.bottom==fromSelZero.top && toSel.top==toSelZero.bottom) {
					// 		console.error("left/right edge");
					// 		if (fromSel.left<toSel.left) {
					// 			console.error("-> is right edge ?");
					// 		} else {
					// 			console.error("-> is left edge ?");
					// 		}
					// 	} else {
					// 		if (fromSel.bottom==fromSelZero.top) {
					// 			console.error("left edge");
					// 		}
					// 		if (toSel.top==toSelZero.bottom) {
					// 			console.error("right edge");
					// 		}
					// 	}

					// //}

					// console.log("----------------------------");
					// console.log("selection", oSel, oSel.from, oSel.to);
					// console.log("position", fromSel, toSel);
					// console.log("position", fromSelZero, toSelZero);
					// console.log("js text ["+ window.getSelection().toString()+"]");
					// console.log("----------------------------");

					// return;

					// set top and bottom
					let oTargetRec = { top: fromSel.top, bottom: toSel.bottom, left: fromSel.left, right: toSel.right }
				
				// THIS MIGHT NOT BE NEED if we find workaround for invisible start of the selection at break points
				//	
					if (oTargetRec.top != toSel.top) {
						// correct left end right
						//console.error("fix left right");
						// We need loop to find new line (Tests with the range.getBoundingClientRect() were ok but it was not possible to get always correct document.range)
						let breakSel = null
						breakloop:
						for (var i = oSel.from+1; i < oSel.to; i++) {
							breakSel = oView.coordsAtPos(i);
							// console.warn("\t-> ", i, oTargetRec.top, breakSel.top);
							if (oTargetRec.top != breakSel.top) {
								// new row is first left
								//console.info("\t-> ", i, oTargetRec.top, breakSel.top);
								oTargetRec.left = breakSel.left;
								break breakloop;
							}
							// previose is last right
							oTargetRec.right = breakSel.right;
						};
					} 
				//
			
			 
			// Position variables
			
				let oPos = {
					// bParent: oElm.offsetParent.getBoundingClientRect(), // dialog parent - we shouldn't need this
					bDialog: oElm.getBoundingClientRect(),
					bTarget: oTargetRec,
					wScreen: window.innerWidth,
					hScreen: window.innerHeight,
					hScroll: (window.pageYOffset || document.documentElement.scrollTop)  - (document.documentElement.clientTop || 0) // Adjust top position according to window scroll position (container is not absolute)
				}     
				
				//console.log("oPos", oPos);

		
			// Position at DOM Center top or bottom based on screen available
			
				// Vertical
				
					// console.warn("this ios", this.isIOS());

					if (opt_DefaultToTop_) {					
						// Postion to Top
						if ((oPos.bTarget.top - 5 - oPos.bDialog.height) < 0) {
							//console.warn("move to bottom", (oPos.bTarget.top - 5 - oPos.bDialog.height), oPos.hScroll);
							oPos.top = oPos.hScroll + oPos.bTarget.bottom + 5;
							if (opt_menu_) {
								oElm.classList.remove("menubar-top");
								oElm.classList.add("menubar-bottom");
							} else {
								// oElm.className = this.linkClassBottom;
								oElm.classList.remove(this.linkClassTop);
								oElm.classList.add(this.linkClassBottom);								
							}
						} else {
							// console.warn("move to top", (oPos.from.bottom + 5 + oPos.bDialog.height), oPos.hScreen, oPos.top);
							// oPos.top = oPos.hScroll + oPos.from.top - oPos.bDialog.height - 5 +"px";	
							oPos.top = oPos.hScroll + oPos.bTarget.top - oPos.bDialog.height - 5;
							if (opt_menu_) {
								oElm.classList.remove("menubar-bottom");
								oElm.classList.add("menubar-top");
							} else {
								// oElm.className = this.linkClassTop;
								oElm.classList.remove(this.linkClassBottom);
								oElm.classList.add(this.linkClassTop);
							}
						}
					} else {					
						// Postion to Bottom
						if ((oPos.bTarget.bottom + 5 + oPos.bDialog.height) > oPos.hScreen) {
							// console.warn("move to top", (oPos.from.bottom + 5 + oPos.bDialog.height), oPos.hScreen, oPos.top);
							// oPos.top = oPos.hScroll + oPos.from.top - oPos.bDialog.height - 5 +"px";	
							oPos.top = oPos.hScroll + oPos.bTarget.top - oPos.bDialog.height - 5;
							//oElm.className = this.linkClassTop;
							oElm.classList.remove(this.linkClassBottom);
							oElm.classList.add(this.linkClassTop);
						} else {
							// console.warn("move to bottom", (oPos.from.bottom + 5 + oPos.bDialog.height), oPos.hScreen, oPos.top);
							oPos.top = oPos.hScroll + oPos.bTarget.bottom + 5;
							//oElm.className = this.linkClassBottom;
							oElm.classList.remove(this.linkClassTop);
							oElm.classList.add(this.linkClassBottom);
						}
					}
	        
	        	// Horizontal        
	        	
		        	// IF LINK SPREADS OVER LINES - DEPRECATED as misleading... 
			        	// if (oPos.to.top > oPos.bTarget.top && oPos.from.left>oPos.to.right) {
			        	
			        	// 	// Add tooltip to leading or trailing part
			        	// 	if (this.linkTooltip.className == this.linkTooltip_classTop) {
			        	// 		//console.warn("anchor is broken center and leading part");
				        // 		oPos.left = oPos.from.left+((oPos.bTarget.right-oPos.from.left)/2);
				        // 		oPos.left = (oPos.left - oPos.bParent.left);
			        	// 	} else {
				        // 		//console.warn("anchor is broken center and trailing part");
				        // 		oPos.left = oPos.bTarget.left+((oPos.to.right-oPos.bTarget.left)/2);
				        // 		oPos.left = (oPos.left - oPos.bParent.left);
			        	// 	}
			        	// } else {
			        		// Center tool tip
			        			//console.log("?",((oPos.bTarget.left + oPos.bTarget.right) / 2), oPos.bTarget.left + 3);			        		
								// DEPRECATED: (why select max?) oPos.left = Math.max(((oPos.bTarget.left + oPos.bTarget.right) / 2), oPos.bTarget.left + 3);
			        			oPos.left = ((oPos.bTarget.left + oPos.bTarget.right) / 2);
			        		// dialog parent - we shouldn't need this
			        			// DEPRECATED: oPos.left = (oPos.left - oPos.bParent.left);
			        	//}
		        	// initial arrow left position
		        		oPos.arrow = 50; //%
		        	// offscreen horizontal
			        	if ( oPos.left - (oPos.bDialog.width/2) - 5 < 0 ) {
			        		// move to left start and shift arrow
			        		let left_shift = (oPos.left - (oPos.bDialog.width/2) - 5);
			        		//console.log("left_shift:", left_shift, oPos.bDialog.width);
			        		if (Math.abs(left_shift*2)+10 >= oPos.bDialog.width) {
			        			// if arrow is out of the box move back by arrow width (min left)
			        			left_shift += 10; // should be: left_shift = -((oPos.bDialog.width/2)-10)
			        		} 
			        		oPos.arrow = ((0.5 + (left_shift / oPos.bDialog.width))*100);
			        		//ORIG: oPos.arrow = ((0.5 + ((oPos.left - (oPos.bDialog.width/2) - 5) / oPos.bDialog.width))*100);
			        		//console.log("move arrow to left: ", oPos.arrow);
			        		oPos.left -= (oPos.left - (oPos.bDialog.width/2) - 5);	
			        	} else if ( oPos.left + (oPos.bDialog.width/2) + 5 > oPos.wScreen ) {
			        		let right_shift = (oPos.wScreen-(oPos.left + (oPos.bDialog.width/2) + 5));
			        		// console.log("right_shift:", right_shift, oPos.bDialog.width);
			        		if (Math.abs(right_shift*2)+10 >= oPos.bDialog.width) {
			        			// if arrow is out of the box move back by arrow width (max right)
			        			right_shift += 10;  // should be: right_shift = -((oPos.bDialog.width/2)-10)
			        		} 			        		
			        		oPos.arrow = ((0.5 - (right_shift / oPos.bDialog.width))*100);
			        		//console.log("move arrow to right: ", oPos.arrow);
			        		oPos.left += (oPos.wScreen-(oPos.left + (oPos.bDialog.width/2) + 5));
			        	}

			// Set position for the arrow
				// oPos.arrow = Math.min(Math.max(oPos.arrow, 2.5), 97.5);
				oElm.setAttribute("style", "--tooltip-left: "+oPos.arrow+"%");
		    
		    // Set dom position
				
				oElm.style.top = oPos.top +"px";	
				oElm.style.left = oPos.left+ "px";

		}

		_mCloseTooltip(dom_, opt_force_) {
			//return false;

			if (opt_force_) {
				// FORCE CLOSE

				// Cancel close timer
				if (this.linkTooltipTimer != null) {
					clearTimeout(this.linkTooltipTimer)
		      		this.linkTooltipTimer = null
		      	}
		      	// remove event handler
				this.linkTooltip.removeEventListener('click', this.fnLinkTooltipEventClick);
				this.linkTooltip.removeEventListener('mouseover', this.fnLinkTooltipEventOver);
				this.linkTooltip.removeEventListener('mouseout', this.fnLinkTooltipEventOut);
				this.linkTooltipOpen.removeEventListener('mouseout', this.fnLinkTooltipOpenEventOut);
				// remove element
				//this.linkTooltip.remove()
				this.linkTooltip.parentNode.removeChild(this.linkTooltip);
				// reset
				this.linkTooltipOpen = null;

			} else {
				// EVENT BASED CLOSE
				
				// Set timed close
				this.linkTooltipTimer = setTimeout(() => {
					if (this.linkTooltipOpen != dom_) {
						// remove event handler
						this.linkTooltip.removeEventListener('click', this.fnLinkTooltipEventClick);
						this.linkTooltip.removeEventListener('mouseover', this.fnLinkTooltipEventOver);
						this.linkTooltip.removeEventListener('mouseout', this.fnLinkTooltipEventOut);
						this.linkTooltipOpen.removeEventListener('mouseout', this.fnLinkTooltipOpenEventOut);
						// remove element
						// this.linkTooltip.remove()
						this.linkTooltip.parentNode.removeChild(this.linkTooltip);
						// reset
						this.linkTooltipOpen = null;
					}

				}, 200)

			}
		}

		_mEventTooltipOpen(dom_) {
			
			// Cancel close timer
			if (this.linkTooltipTimer != null) {
				clearTimeout(this.linkTooltipTimer)
	      		this.linkTooltipTimer = null
	      	}
	      	// Close or Keep open
			if (dom_ == null) {
				// console.log("close...")
				this._mCloseTooltip(null);
			} else {
				// console.log("keep open...");
		      	this.linkTooltipOpen = dom_;
	      	}
		}

		_mEventTooltipClick(oView,oTarget) {


			// console.error("BLOCK Tooltip from now on...")
			// console.log("event", oView,e.target);
			
			// Close tooltop
				this._mCloseTooltip(null,true);
			// Open dialog from dom event
				let oPos = this._mGetMarkPosFromDomEvent(oView, oTarget);
				this._mShowDialogFromDomEvent(oView,oPos); 
		}


	// ============================================
	// Link stuff
	// ============================================

		// ============================================
		// DOM event based
		// ============================================
		
		_mIsLinkFromDomEvent(oView, e)
		{
		
			// False if dialog is open
				if (this.linkDialog.isOpen)	{
					return false;
				}
						

			// Open hove tooltip if:
				if (e.target.nodeName=="A") { 
					return e.target; 
				}

			// Parent can be link
				
				// Target lookup
					let inLnk = false;
				
				// FROM DOM
					if (e.path) {
						// From Event Path
						aloop:
						for (var i = 0; i < e.path.length; i++) {
							if (e.path[i].nodeName == "A") {
								inLnk = e.path[i];
								break aloop;
							}
						};
					} else {
						// From target parent
						let current = e.target;
						ploop:
						while (current.parentNode && current != e.currentTarget){
							 // do stuff with node
							 if (current.nodeName == "A") {
							 	inLnk = current;
							 	break ploop;
							 }
							 // update
							 current = current.parentNode
						}
					}

				// FROM SEL?
					//let oSel = this._mGetMarkPosFromDomEvent(oView,e.target);
					//this._mIsLink(oView,oSel) 
					// ... we would need to compare target from-to with link from-to
				

			// Do not open
			return inLnk;
		}

		_mGetMarkPosFromDomEvent(oView, oTarget) {

			// DOM Element
			let link_ = oTarget;
			// get start position of the target
			let pos_ = oView.posAtDOM(link_);			
			// Get postion from Cursor at the beging of link
			let _oCursor = oView.state.doc.resolve(pos_);
			let _oMarkType = oView.state.schema.marks['link'];
			let oPos = this._mMarkExtend(_oCursor, _oMarkType);
			// correct extended position
			if (oPos.from == oPos.to) {
				// link is at the beging of the parent node. replace from by don start position
				oPos.from = pos_;
			}

			return oPos;
		}
		

		// ============================================
		// State based
		// ============================================
		
		_mIsLink(oView, optPseudoSelection, optAny)
		{
		// todo -> special case: selection between two links!
			let oSelection = optPseudoSelection || oView.state.selection;
			// to speed up things check first cursor only movement
			if ( oSelection.empty ) { return this._mRangeHasLink(oView) }

			// now check selection
			let {from, to} = oSelection;
			// set a range of one char
			let o = {
				start: { from: from, to: from + 1 },
				end: { from: to - 1, to: to }
			}
			return (optAny)? (this._mRangeHasLink(oView, o.start) || this._mRangeHasLink(oView, o.end)) : (this._mRangeHasLink(oView, o.start) && this._mRangeHasLink(oView, o.end));
		}
		_mRangeHasLink(oView, o)
		{
			let isLink = false;
			let oState = oView.state;
			let oMarkType = oState.schema.marks.link;
			let oDoc = oState.doc;
			if ( o ) { isLink = oDoc.rangeHasMark(o.from, o.to, oMarkType); }
			else { isLink = oMarkType.isInSet(oState.storedMarks || oState.selection.$cursor.marks()) }
			return isLink;
		}
		_mGetMark(oState, vMarkName, optPseudoSelection)
		{
			let o = false;
			let oSelection = (optPseudoSelection)? optPseudoSelection : oState.selection;
			oState.doc.nodesBetween(oSelection.from, oSelection.to, function(oNode, oPos)
			{
				let aMark = oNode.marks;
				aMark.every( function(oMark)
				{
					if ( oMark.type.name === vMarkName ) { o = oMark; return false; }
					return true;
				})
				return true;
			});
			return o;
		}
		_mGetMarkPos(oState, vMarkName)
		{
			let oCursor = oState.doc.resolve(oState.selection.from);
			let oMarkType = oState.schema.marks[vMarkName];
			return this._mMarkExtend(oCursor, oMarkType);
		}
		_mMarkExtend (oCursor, oMarkType)
		{
			let oParent = oCursor.parent;
			let oPos = {
				oIndex: { vStart: oCursor.index(), vEnd: oCursor.indexAfter() },
				oMark: { vStart: oCursor.start(), vEnd: oCursor.start() }
			}
			let oI = oPos.oIndex;
			let oM = oPos.oMark;

			const hasMark = i => 
			oMarkType.isInSet(oParent.child(i).marks)

			// Clicked outside edge of tag.				
				// ORIG:
					// if (oI.vStart === oParent.childCount) { oI.vStart--; }
					// while (oI.vStart > 0 && hasMark(oI.vStart)) { oI.vStart--; }
					// while ( oI.vEnd < oParent.childCount && hasMark(oI.vEnd)) { oI.vEnd++ }
				// NEW (fix adjecent links)

					// console.warn('\t->start:'+oI.vStart+', '+oI.vEnd);

					if (oI.vStart === oParent.childCount) { oI.vStart--; }

					// ORIG - fix start at parent or adjecent nodes
						// if (oI.vStart == 0) {
						// 	console.warn('\t->start:', oI.vStart, oI.vEnd, hasMark(oI.vEnd))
						// 	oI.vEnd = 0;
						// }
					// NEW - fix keep the same node
						oI.vEnd = oI.vStart;


					let _nodeStart = null;
					while (oI.vStart > 0 && hasMark(oI.vStart) && (_nodeStart==null || _nodeStart==oParent.child(oI.vStart))) { 
						//console.error("fix start:",_nodeStart,oParent.child(oI.vStart));
						_nodeStart = oParent.child(oI.vStart);
						oI.vStart--; 
					}
					let _nodeEnd = null;
					while ( oI.vEnd < oParent.childCount && hasMark(oI.vEnd) && (_nodeEnd==null || _nodeEnd==oParent.child(oI.vEnd))) { 
						//console.error("fix end:",_nodeEnd,oParent.child(oI.vEnd));
						_nodeEnd = oParent.child(oI.vEnd);
						oI.vEnd++ 
					}
				
				
			//let vSize = (hasMark(0)) ? oParent.child(0).nodeSize : 0;
			for (let i = 0; i < oI.vEnd; i++)	
			{
				let vSize = oParent.child(i).nodeSize;				
				if (i <= oI.vStart) oM.vStart += vSize;
				oM.vEnd += vSize;
				//console.log(i + ': ', vSize + ' (size), ' + oM.vStart +' (start), ' + oM.vEnd + ' (end)');
			}

			// if (oM.vStart==oM.vEnd && vSize) {
			// 	oM.vEnd +=vSize
			// }
			// console.error("pos: ",oM.vStart,oM.vEnd);

			return { from: oM.vStart, to: oM.vEnd };
		}

		// SELECT 
		_mSelect(oView, oPos, opt_scroll_) {

			// DEPRECATED: Get link postion from Target
				//let oPos = this._mGetMarkPosFromDomEvent(oView, e);
			// Create Text Selection
				let $s = oView.state.doc.resolve(oPos.from)
				let $e = oView.state.doc.resolve(oPos.to)
				//let txt = $e.parent.textBetween(0, $e.end() - $s.start(), ' '); // link text
				let sel = new TextSelection.between($s, $e)			
			// Focus editor
				oView.focus({
				  preventScroll: true // this might be not yet supported by all browsers. also IE is using setActive to preventSrcoll (see prosemirror-view/index.js -> focus())
				});
			// Dispatch transaction (select link)
				if (opt_scroll_) {
					oView.dispatch(oView.state.tr.setSelection(sel).scrollIntoView());
				} else {
					oView.dispatch(oView.state.tr.setSelection(sel))
				}

			// Return success
			return true;

		}

	// ============================================
	// dialog stuff
	// ============================================
	
		// change these - create dialog from here...
		
		_setCaretPosition(ctrl, pos) {		    
		    if(ctrl != null) {
		        // Modern browsers
				if (ctrl.setSelectionRange) {
				ctrl.focus();
				ctrl.setSelectionRange(pos, pos);

				// IE8 and below
				} else if (ctrl.createTextRange) {
				var range = ctrl.createTextRange();
				range.collapse(true);
				range.moveEnd('character', pos);
				range.moveStart('character', pos);
				range.select();
				}

				ctrl.blur();
				ctrl.focus();
		    }
		}
	

		initLinkDialog()
		{

			// NEW
		    this.linkDialog = {
					    		isOpen: false,
								p: document.createElement("div"),
								i: document.createElement("input"),
								c: document.createElement("button"),
								// u: document.createElement("button"),
							}
			this.linkDialog.p.className = this.linkClassTop;
			this.linkDialog.i.setAttribute("placeholder", "Link\u2026"); //URL, mailto:E-mail, phone:Tel. čislo, etc...
			this.linkDialog.p.appendChild(this.linkDialog.i);
				// DODO: [link-2-file] implement uplaod for links
				// this.linkDialog.u.appendChild(getIcon(icons.upload,"simpleeditor-menu-tooltip-icon"));
				// this.linkDialog.p.appendChild(this.linkDialog.u);
			this.linkDialog.c.appendChild(getIcon(icons.cancel,"simpleeditor-menu-tooltip-icon"));			
			this.linkDialog.p.appendChild(this.linkDialog.c);


			// console.log(this.linkDialog);

			
		}
	

		mShowDialog(oView, fn, oV)
		{
			// command puts oState, fnDispatch, oView
			if ( oV && oV.dispatch ) { oView = oV; }

			let o = this.linkDialog;
			// already opened
			//console.error("check if is open but the same instance")
			if ( o.isOpen ) { return; }

			// add to dom
			// this.aDomEdit.parentNode.appendChild(o.p);
			document.body.appendChild(o.p);

			// state changes with every update don't assign it in constructor
			let oState = oView.state;

			// extend selection
			let oPos = oState.selection;
			//if (!oState.selection.empty) { // we can now view link with cursor inside via keymap link cmd
				this._mIsLink(oView, oPos) && ( oPos = this._mGetMarkPos(oState, 'link') );
				if (oPos.from == oPos.to) {
					// link is at the begingng
					// console.log("fix get parent postion",oState.selection.$from, oPos.from)
					let sFrom = oState.selection.$from;
					oPos.from = sFrom.pos-sFrom.parentOffset;
					//console.log("fix get parent postion",oState.selection.$from, oPos.from)
				}
			//}
			
			this._mFillDialog(o, oState, oPos)
			this._mPos(o.p, oView, oPos, true)
			this._mOpenDialog(2, oPos);

			// remove event handler
			o.c.removeEventListener('click', this.fnLinkDialogEvent);
			o.i.removeEventListener('keyup', this.fnLinkDialogEvent);
			// set event handler
			this.fnLinkDialogEvent = this._mEventDialog.bind(this, oView);
			o.c.addEventListener('click', this.fnLinkDialogEvent);
			o.i.addEventListener('keyup', this.fnLinkDialogEvent);
		}

		_mShowDialogFromDomEvent(oView, PseudoSelection)
		{

			let o = this.linkDialog;
			// already opened
			// console.error("check if is open but the same instance")
			if ( o.isOpen ) { return; }

			// add to dom
			// this.aDomEdit.parentNode.appendChild(o.p);
			document.body.appendChild(o.p);

			// state changes with every update don't assign it in constructor
			let oState = oView.state;

			this._mFillDialog(o, oState, PseudoSelection)
			this._mPos(o.p, oView, PseudoSelection, true)
			this._mOpenDialog(1,PseudoSelection);

			// remove event handler
			o.c.removeEventListener('click', this.fnLinkDialogEvent);
			o.i.removeEventListener('keyup', this.fnLinkDialogEvent);
			// set event handler
			this.fnLinkDialogEvent = this._mEventDialog.bind(this, oView);
			o.c.addEventListener('click', this.fnLinkDialogEvent);
			o.i.addEventListener('keyup', this.fnLinkDialogEvent);
		}

		_mEventDialog(oView, e)
		{		
			//console.log("close per event type: ",e.type);

			// prevent default click behaviour
			e.preventDefault();

			// select action
			if (e.type == "click") {			
				let oPos =  this.selection; //{ from: oState.selection.from, to: oState.selection.to };
				// get whole mark positions if selection is not empty
				// if (!oView.state.selection.empty) {
				// 	this._mIsLink(oView) && ( oPos = this._mGetMarkPos(oView.state, 'link') );
				// }
				//console.log("\t-> dont close dialog", oPos);
				this._mSelect(oView,oPos);
				// close dialog
				this._mCloseDialog(true);			
			} else if (e.type == "keyup") {
				if (e.keyCode === 13) { //ENTER
		    		//console.log("set link");
		    		this._mCloseDialog(false, oView);
		    	} else if (e.keyCode === 27) { //Esc
		    		// close dialog and focus editor
						// this._mCloseDialog(true);
						// oView.focus();
					// same as close
						let oPos =  this.selection; //{ from: oState.selection.from, to: oState.selection.to };
						//console.log("\t-> create selection", oPos);
						this._mSelect(oView,oPos);
						// close dialog
						this._mCloseDialog(true);
		    	}
	    	}

		}
		_mFillDialog(o, oState, optPseudoSelection)
		{
			// default setting
			let oAttr = {
				href: '',
				target: '_blank'
			}
			// get attribute
			let oMark = this._mGetMark(oState, 'link', optPseudoSelection)
			oMark && ( oAttr = oMark.attrs );

			// fill dialog
				// o.address &&  (o.address.innerHTML = oAttr.href);
				// o.open.title = "open " + oAttr.href;
				// o.open.href = oAttr.href;
				// o.url.value = oAttr.href;
				// o.isTarget.checked = oAttr.target === '_blank';
			
			// NEW
				// add class before pos
				o.p.classList.remove('dialog');
				o.p.classList.add('dialog');

				o.i.value = oAttr.href;			
				
		}
		_mOpenDialog(n,oSelection)
		{
			// n=1 from tooltip, 2= from command
			
			// close edit menu
			this.closeMenu();

			this.selection = oSelection;
			let o = this.linkDialog;
			// if ( o.isOpen ) { return; }
			o.isOpen = true;
				// ORIG
				// o = o.p.classList;
				// o.remove('dialog');
				// o.add('dialog');
			this._setCaretPosition(this.linkDialog.i,0);
		}
		_mCloseDialog(optDestroy_, oView)
		{		
		
			let o = this.linkDialog;
			if ( ! o.isOpen ) { return; }
			
			//console.log("remove dialog");
			
			o.isOpen = false;
			o = o.p.classList;
			o.remove('dialog');

			// remove event handler
			this.linkDialog.c.removeEventListener('click', this.fnLinkDialogEvent);
			this.linkDialog.i.removeEventListener('keyup', this.fnLinkDialogEvent);
			
			if (optDestroy_) {
				// destroy not set value and don't alter selection
				// Null oSel
				this.selection = null;
				// remove dialog
				//this.linkDialog.p.remove();
				this.linkDialog.p.parentNode.removeChild(this.linkDialog.p);

				//console.log("close and don't set value");
			} else {
				// set value
				//console.log("set link", this.selection); 
				//set link
				this.mSetLink(oView);
				// Null oSel
				this.selection = null;
				// remove dialog
				//this.linkDialog.p.remove();
				this.linkDialog.p.parentNode.removeChild(this.linkDialog.p);
				// Focus view - set with mSetLink
				// oView.focus();
				//console.log("close and set value");
			}		
		}
}