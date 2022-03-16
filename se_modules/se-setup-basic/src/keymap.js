import {TextSelection} from "prosemirror-state"
import {setBlockType, chainCommands, toggleMark, exitCode,
        joinUp, joinDown, lift, selectParentNode} from "prosemirror-commands"
import {wrapInList, splitListItem, liftListItem, sinkListItem} from "prosemirror-schema-list"
import {undo, redo} from "prosemirror-history"
import {undoInputRule} from "prosemirror-inputrules"

// import {findWrapping, liftTarget, canSplit, ReplaceAroundStep} from "prosemirror-transform"
import {Slice, Fragment} from "prosemirror-model"

import {canInsertBlock,markActive} from "./menu"
import {linkRule} from "./inputrules"

const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false

// :: (Schema, ?Object) → Object
// Inspect the given schema looking for marks and nodes from the
// basic schema, and if found, add key bindings related to them.
// This will add:
//
// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
// * **Ctrl-Shift-0** for making the current textblock a paragraph
// * **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
//   textblock a heading of the corresponding level
// * **Ctrl-Shift-Backslash** to make the current textblock a code block
// * **Ctrl-Shift-8** to wrap the selection in an ordered list
// * **Ctrl-Shift-9** to wrap the selection in a bullet list
// * **Ctrl->** to wrap the selection in a block quote
// * **Enter** to split a non-empty textblock in a list item while at
//   the same time splitting the list item
// * **Mod-Enter** to insert a hard break
// * **Mod-_** to insert a horizontal rule
// * **Backspace** to undo an input rule
// * **Alt-ArrowUp** to `joinUp`
// * **Alt-ArrowDown** to `joinDown`
// * **Mod-BracketLeft** to `lift`
// * **Escape** to `selectParentNode`
//
// You can suppress or map these bindings by passing a `mapKeys`
// argument, which maps key names (say `"Mod-B"` to either `false`, to
// remove the binding, or a new key name string.
export function buildKeymap(schema, mapKeys) {
  let keys = {}, type
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key]
      if (mapped === false) return
      if (mapped) key = mapped
    }
    keys[key] = cmd
  }
  


  bind("Mod-z", undo)
  bind("Shift-Mod-z", redo)
  // ORIG:
    //bind("Backspace", undoInputRule)
  // NEW (if list item has child list - lift the list and merge it with parent if the cursor is at the first postion)
    bind("Backspace",(state, dispatch) => {

        // SPECIAL CASES:
          let $from = state.selection.$from
          
          /*          
          // IE BACKSPACE HACK
          let $to = state.selection.$to
          if ($from.sameParent($to) && $from.parent.inlineContent) {
            if ($from.pos == $to.pos) { // Deletion
              // IE11 sometimes weirdly moves the DOM selection around after
              // backspacing out the first element in a textblock
              //if (browser.ie && browser.ie_version <= 11) {    
              //if ($from.parentOffset==1 || ($from.nodeBefore != null && $from.nodeBefore.nodeSize == 1 )) {
              if ($from.textOffset==0 || $from.textOffset==1) { // 0 for delete key (deleteContentForward); 1 for backspace key (deleteContentBackward)
                  console.log("KEYMAP Backspace", $from.parentOffset, $from, $to, view);
              }
            }
          }
          */
         
          for (let d = $from.depth; d >= 0; d--) {
            let index = $from.index(d)
            let node = $from.node(d)

            // Get Node at Cursor            
            if(node.type.name == "list_item") {
                // Catch cursor at start of ListItem that has Child List Group
                let {$from, $to} = state.selection
                let range = $from.blockRange($to, node => node.childCount && node.firstChild.type == schema.nodes.list_item)
                if (range) {   
                  // DEPRECATED - we can face this in any depth
                  // if ($from.node(range.depth - 1).type == schema.nodes.list_item) { 
                  //   // Inside a parent list              
                  //     console.info("inside child list");
                  // } else 
                  if (state.selection.empty && node.childCount > 1 
                              && state.selection.$cursor.parentOffset == 0
                              && range.startIndex == 0
                              && (state.selection.$cursor.nodeAfter==null || state.selection.$cursor.nodeAfter.nodeSize == node.firstChild.content.size)
                              ) {  
                    // Inside Outer list node with child at 1st position
                      // console.info("parent list to esc");
                      // console.log("\t-> from", $from)
                      // console.log("\t-> range", $from)
                      // console.log("\t-> node", node)
                      // console.log("\t-> startIndex", range) // ok
                      // console.log("\t-> parent node", $from.node(d-1))
                      // console.log("\t-> parent node", $from.node(d-1))
                      // console.log("\t-> state", state)
                      // console.log("\t-> cursor", state.selection.$cursor) 
                      //console.log("\t-> copmare nodeAfter vs node size - node size: ", node.firstChild.content.size)
                      //console.log("\t-> copmare nodeAfter vs node size - nodeAfter size: ", state.selection.$cursor.nodeAfter.nodeSize)
                      // call prosemirror-schema-list method to escape the list
                        
                    // CALL CMD
                      if (state.selection.$cursor.nodeAfter!=null) {
                        //console.warn("===> CURSOR AT 1st POS with content after");
                        let cmd_ = liftListItem(node.type)
                        return cmd_(state, dispatch)
                      } else if (index==0) {
                        //console.warn("===> CURSOR AT 1st POS with no content after AND at the 1st paragraph of the LI item (index == 0)", index);
                        let cmd_ = liftListItem(node.type); //node.type); //schema.nodes.list_item)
                        return cmd_(state, dispatch)
                      } else {
                        // console.warn("cursor is at 1st pos but not the 1st paragraph", index)
                      }
                  }

                }
            }
            // else if (node.type.name == "other type") {}            
          }
         
        // BAU - this is only reverting inputrules
          return undoInputRule(state, dispatch)
    })
   
  // if (!mac) bind("Mod-y", redo)
  bind("Mod-y", redo)

  bind("Alt-ArrowUp", joinUp)
  bind("Alt-ArrowDown", joinDown)
  bind("Mod-BracketLeft", lift)
  bind("Escape", selectParentNode)

  if (type = schema.marks.strong)
    bind("Mod-b", toggleMark(type))
  if (type = schema.marks.em)
    bind("Mod-i", toggleMark(type))
  if (type = schema.marks.underline)
    bind("Mod-u", toggleMark(type))
  if (type = schema.marks.code)
    bind("Mod-`", toggleMark(type))

  if (type = schema.nodes.bullet_list)
    bind("Shift-Ctrl-8", wrapInList(type))
  if (type = schema.nodes.ordered_list)
    bind("Shift-Ctrl-9", wrapInList(type))
  if (type = schema.nodes.blockquote) {
    //bind("Ctrl->", wrapIn(type))      // wrap existing element in blockquote
    bind("Ctrl->", setBlockType(type,null, schema.nodes.paragraph))  // change existing element to blockquote
  }
  if (type = schema.nodes.hard_break) {
    let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
      return true
    })
    bind("Mod-Enter", cmd)
    bind("Shift-Enter", cmd)
    if (mac) bind("Ctrl-Enter", cmd)
  }
  
 // if (type = schema.nodes.list_item || type = schema.nodes.figcaption) {
    bind("Enter",(state, dispatch, view) => {
        
        // PROCESS Enter
        // DODO: [key-events] Move Custom events to exten handleDOMevents handler
        
          // current selection       
            let $from = state.selection.$from
          
          // check text matches
            
            let nodeBefore = $from.nodeBefore;
            let opt_tr_ = null;
            
            // VIDEO, 
            // e.g.: https://youtu.be/hHW1oY26kxQ or https://www.youtube.com/watch?v=hHW1oY26kxQ
            // e.g.: https://vimeo.com/325639357 or ...
              

              if (  
                  $from.parent && nodeBefore!=null && nodeBefore.isText && dispatch
                  && $from.parent.type.name == "paragraph"
                  && $from.node(-1).canReplaceWith($from.index(-1), $from.indexAfter(-1), state.schema.nodes.figure)
                ) {
                  
                  //console.warn("can add figure");
                  
                  let node_text = $from.parent.textContent.substring(0,$from.parentOffset); //nodeBefore.text;
                  //console.log("video match: ", node_text, nodeBefore.text);

                  // YOUTUBE find match
                    const youtube_regex = /^(?:\s+)?(?:https:\/\/www\.|https:\/\/|http:\/\/www\.|http:\/\/|www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})(?:\s|\.|,|;)?$/i;
                    let video_matches = (node_text).match(youtube_regex);
                    if (video_matches!=null){
                      video_matches["type"] = "youtube";
                    } else {
                      const vimeo_regex = /^(?:\s+)?(?:https:\/\/www\.|https:\/\/|http:\/\/www\.|http:\/\/|www\.)?(?:vimeo.com)\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)?$/i;
                      video_matches = (node_text).match(vimeo_regex);
                      if (video_matches!=null){
                        video_matches["type"] = "vimeo";
                      }
                    }


                    if (video_matches!=null){
                      //console.log("video match: ", video_matches['type'], video_matches[1]);
                      // Get replacement position
                        let pPos = { from: $from.start(), to: $from.end()}       

                      
                      // WT/ CUT

                        // Get content after
                          let wrap_cut = Fragment.from($from.node(0).cut($from.pos,$from.end())); 
                        // create new content node
                          let wrap_paste = Fragment.empty; //state.schema.nodes.paragraph.createAndFill();
                        // Loop cuttted fragment
                          const addchildren = (node, pos) => {                          
                            if (pos>1) {
                              // console.log("\tnode",node,pos);
                              wrap_paste = wrap_paste.append(Fragment.from(node));
                              return false;
                            }
                          }
                          wrap_cut.descendants(addchildren);
                        // Create fragment from new p node and and cutted content 
                          wrap_paste = Fragment.from(state.schema.nodes.paragraph.create(null,wrap_paste));
                        // Create video fragment and 
                            let wrap_video = null;
                            let attr_style = null;
                            let attr_src = null;
                            switch(video_matches["type"]) {
                              case "youtube":
                                attr_style = "padding-top:56.17021276595745%";
                                attr_src = "//www.youtube.com/embed/"+video_matches[1];
                              break;
                              case "vimeo":
                                attr_style = "padding-top:46.91489361702128%";
                                attr_src = "//player.vimeo.com/video/"+video_matches[1]+"?byline=0&amp;portrait=0";
                              break;
                            }
                            wrap_video = Fragment.from(state.schema.nodes.figure.create(null, Fragment.from(state.schema.nodes.div.create({style:attr_style,src:attr_src}))));
                        // Append cutted content  to fragment with video
                          wrap_video = wrap_video.append(wrap_paste);                        
                        // Dispatch
                          opt_tr_ = state.tr;
                          if ($from.pos==$from.end()) {
                            opt_tr_.replaceRange(pPos.from, pPos.to,new Slice(wrap_video,0,0) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
                          } else {
                            opt_tr_.replaceRange(pPos.from, pPos.to,new Slice(wrap_video,1,1) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
                          }        

                          opt_tr_.setSelection(state.selection.constructor.near(opt_tr_.doc.resolve(pPos.from+1)))

                          dispatch(opt_tr_.scrollIntoView())
                          return true;

                      // WO/ CUT 
                        
                        // let frag_ = Fragment.from(state.schema.nodes.horizontal_rule.create());      
                        // frag_ = frag_.append(Fragment.from(state.schema.nodes.paragraph.create()));  // add empty paragraph
                        // // Dispatch
                        // opt_tr_ = state.tr;
                        // opt_tr_.replaceRange(pPos.from, pPos.to, new Slice(frag_, 0, 0) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
                        // opt_tr_.setSelection(state.selection.constructor.near(opt_tr_.doc.resolve(pPos.from)))
                        // dispatch(opt_tr_.scrollIntoView());
                        // // do not process other cases
                        // return true;
                    }

              }

            // LINK

              if ($from.parent && $from.parent.type.allowsMarkType(state.schema.marks.link) && nodeBefore!=null && nodeBefore.isText && dispatch) { // fromBeforeNode.type.name=="text") {
                  // link rule
                  const link_regex = linkRule(state.schema.marks.link,true).match;
                  let link_matches_fix = 0;
                  let link_matches = (nodeBefore.text).match(link_regex);
                  if (link_matches==null) {
                    link_matches = (nodeBefore.text+".").match(link_regex);              
                  } else {
                    link_matches_fix = 1;
                  }
                  if (link_matches!=null) {
                    // we have mathc and can add link
                      const oLinkString = link_matches[0].toString().substring(0,link_matches[0].length-1);
                      const link_start = $from.pos-oLinkString.length-link_matches_fix; //$from.parentOffset+link_matches.index;
                      const link_end = $from.pos-link_matches_fix; //link_matches[0] - 1;                                
                      const oAttr = (link_matches[2]=='@') ? { href: "mailto:"+oLinkString } : { href: oLinkString, target: "_blank" };
                      const oLink = state.schema.marks.link.create(oAttr);
                      //console.warn("linkrule match: ", link_matches,$from, link_start, link_end);  
                    // Add to transition
                      opt_tr_ = state.tr
                      .removeMark(link_start, link_end, state.schema.marks.link)
                      .addMark(link_start, link_end, oLink)
                  }
                }
          
          // special cases
            for (let d = $from.depth; d >= 0; d--) {
              let index = $from.index(d)    
              let node = $from.node(d)
              if (node.type.name=="list_item" && $from.parent.content.size != 0) {
                  // console.error("split list-item - can delete next paragraph if done in nested list !!!", node, $from, node.firstChild.content.size);
                  let split_ = splitListItem(node.type, opt_tr_);
                  return split_(state, dispatch);
              } else if (node.type.name=="figcaption") {
                  // console.log("escape figcaption");
                  let cmd_ = EscapeOut(node.type, false, opt_tr_); // true = cut the figure content to new p; false = just escape to new p; 
                                                          // KEEP FALSE so we are not confused when trying to joing text back after we attempted to add line break. ALSO they can accidentaly lift out the caption. 
                                                          // If schema figcaption content is inline*, we can hard break the lines
                  return cmd_(state, dispatch)               
              }

            }

            // Image, Embed
              if ($from.parent && $from.parent.type.name == "figure") {
                
                // Move to figcaption or split figure
                  // let cmd_ = EscapeOut($from.parent.type, false, opt_tr_);
                  // return cmd_(state, dispatch)  
                  
                  opt_tr_ = state.tr;
                  let posSel = null;
                  let posNear = null;
                  let nodeAfterParent = null;                

                  // Check last node
                  if (state.selection.empty) {
                    // Gap cursors - BAU (split figure)                  
                    return false;
                  } else if ($from.parent.lastChild!==null && $from.parent.lastChild.type.name == "figcaption") {                    
                    // Move selection to figcaption
                      posSel = ($from.after($from.depth)-$from.parent.lastChild.nodeSize-1); 
                      posNear = state.selection.constructor.near(opt_tr_.doc.resolve(posSel));
                  } else {
                    // Move to next/new paragraph
                    posSel = ($from.after($from.depth)-1);
                    nodeAfterParent = opt_tr_.doc.nodeAt(posSel+1);                    
                    if (nodeAfterParent===null) {
                      // We are at the end of document
                      // Add paragraph
                      let last_node = Fragment.from(state.schema.nodes.paragraph.create());
                      opt_tr_.insert(posSel+1,last_node); //insert(pos: number, content: Fragment | Node | [Node]) → this
                      dispatch(opt_tr_);
                      // Create selection
                      posNear = view.state.selection.constructor.near(view.state.tr.doc.resolve(posSel));
                      view.dispatch(view.state.tr.setSelection(posNear).scrollIntoView());
                      return true;
                    } else {
                      posNear = state.selection.constructor.near(opt_tr_.doc.resolve(posSel));
                    
                    }
                  }                  

                  // Set selection                  
                  opt_tr_.setSelection(posNear);
                  dispatch(opt_tr_.scrollIntoView());
                  return true;

              }

            // Any matches left 
            if (opt_tr_!=null) {
              // dispatch and leave native enter to follow (i.e. not return value)
              //console.log("dispatch.....")
              dispatch(opt_tr_);
            }

    })
 // }
  if (type = schema.nodes.list_item) {
    //bind("Enter", splitListItem(type))
    bind("Mod-[", liftListItem(type))
    bind("Mod-]", sinkListItem(type))
    bind("Tab",(state, dispatch) => {
      
      // Process TAB
      
          // Check in which node  
          let $from = state.selection.$from          
          for (let d = $from.depth; d >= 0; d--) {
            let index = $from.index(d)    
            let node = $from.node(d)

            // LI
            if (node.type.name=="list_item") {              
              let {$from, $to} = state.selection
              let range = $from.blockRange($to, node => node.childCount && node.firstChild.type == schema.nodes.list_item)
              if (range) {
                  // BE AWARE of !state.selection.empty
                  // if (state.selection.empty) {
                  //   console.info("we are in the li so whatever position (singListItem will handle the reuqest): ",state.selection.$cursor.pos, state.selection.$cursor.parentOffset);
                  // }
                  let cmd_ = sinkListItem(node.type)
                  cmd_(state, dispatch) // do not return  (block native tab )
                  return true;
              }
            }

            // OTHER
          
          }
    
      // Block native with true;
        return true;

    })
  }
  if (type = schema.nodes.paragraph)
    bind("Shift-Ctrl-0", setBlockType(type))
  if (type = schema.nodes.code_block)
    bind("Shift-Ctrl-\\", setBlockType(type, null, schema.nodes.paragraph))
  if (type = schema.nodes.heading) {
    // console.info(" schema.nodes.heading ", schema.nodes.heading.spec.parseDOM.length);
    for (let i = 1; i <= schema.nodes.heading.spec.parseDOM.length; i++) {
      bind("Shift-Ctrl-" + i, setBlockType(type, {level: i+1}, schema.nodes.paragraph))  // +1 because only one h1 is allowed
    }
  }
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    bind("Mod-_", (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView())
      return true
    })
  }


  // NEW (LINK) - Mod-l not working in safari
  if (type = schema.marks.link) {
    bind("Shift-Ctrl-l", (state, dispatch, view) => {
        if ((!state.selection.empty && canInsertBlock(state, schema.marks.link))  // selection
          || (canInsertBlock(state, schema.marks.link) && markActive(state, schema.marks.link) ) // active link can be viewed also if there is empty selection and cursor is inside
          ) {
          let linkKey = state.config.pluginsByKey["extension$"];
          // console.log("pluginsByKey",state.config.pluginsByKey)
          linkKey.spec.openDialog(view);
          //console.log("linkKey",linkKey,view);        
        }
        // console.log("is markActive", );
        return true;
    });
  }

  return keys
}

function EscapeOut(itemType, opt_cut_, opt_tr_) {
  return function(state, dispatch) {
    let {$from, $to} = state.selection
    let range = $from.blockRange($to, node => node.childCount)
    if (!range) {
      return false
    }
    if (!dispatch) return true
    if ($from.node(range.depth - 1).type == itemType) // Inside a parent list
      // return EscapeToOuter(state, dispatch, itemType, range)
      //console.log("inside itemType - not supported")
      return false;
    else // Outer list node
      //console.log("lift out to doc")
      return EscapeOutOf(state, dispatch, range, opt_cut_, opt_tr_)
  }
}

function EscapeOutOf(state, dispatch, range, opt_cut_, opt_tr_) {
    let {$from, $to, node} = state.selection
    if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) return false
    let grandParent = $from.node(-1)    
    let pPos = null;
    if (grandParent.type != state.schema.nodes.doc) {
      // TEST
        // console.log("state.selection", $from.start());
        // let parent_ = state.doc.resolve($from.start());
        // console.warn('get pos of doc', $from, parent_)
        // console.warn('$from.before(-1)', $from.before(-1))
        // console.warn('parent_.before(-1)', parent_.before(-1))
      // POSITION AFTER FIGURE
        pPos = state.doc.resolve($to.after(1));
    } else {
      // not tested
      pPos = $to;
      return false;
    }

    if (dispatch) {

      if (opt_cut_) {
        // CUT to NEW BLOCK
        
          // cut content node
            let wrap_cut = Fragment.from($from.node(0).cut($from.pos,$from.end())); 
          // create new content node
            let wrap_paste = Fragment.empty; //state.schema.nodes.paragraph.createAndFill();
          // Loop cuttted fragment
            const addchildren = (node, pos) => {
              // console.log("\tnode",node,pos);
              if (pos>2) {
                wrap_paste = wrap_paste.append(Fragment.from(node));
                return false;
              }
            }
            wrap_cut.descendants(addchildren);
          // Create fragment from new p node
            wrap_paste = Fragment.from(state.schema.nodes.paragraph.create(null,wrap_paste));
            //console.log("wrap", wrap, wrap_paste);
          
          // Add 
            let tr = opt_tr_ || state.tr;
            if ($from.pos==$from.end()) {
              tr.replace(pPos.pos, pPos.pos,new Slice(wrap_paste,0,0) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
            } else {
              tr.replace(pPos.pos, pPos.pos,new Slice(wrap_paste,1,1) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
            }        
            tr.setSelection(state.selection.constructor.near(tr.doc.resolve(pPos.pos)))
            tr.delete($from.pos, $from.end())
            dispatch(tr.scrollIntoView())

      } else {
        // JUST ESCAPE TO NEW P BLOCK
          
          if ($to.pos==$to.end()) {
            // only at the end of node so it feels more native

            let frag_ = Fragment.from(state.schema.nodes.paragraph.create());        
            let tr = opt_tr_ || state.tr;
            tr.replace(pPos.pos, pPos.pos, new Slice(frag_, 0, 0) );// 1,1 = to next block; 0,0 = to new empty block (has issues at the end of doc)
            tr.setSelection(state.selection.constructor.near(tr.doc.resolve(pPos.pos)))
            dispatch(tr.scrollIntoView())
        }

      }
    }
    return true
}