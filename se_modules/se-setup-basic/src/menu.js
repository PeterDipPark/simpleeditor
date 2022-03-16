import {blockTypeItem, joinUpItem, liftItem, undoItem, redoItem, icons, MenuItem} from "se-menu-basic" //+wrapItem , Dropdown, DropdownSubmenu, selectParentNodeItem ?
import {NodeSelection} from "prosemirror-state"
import {toggleMark} from "prosemirror-commands" 
import {wrapInList} from "prosemirror-schema-list"
import {TextField, openPrompt} from "./prompt"

// Helpers to create specific types of items

function canInsert(state, nodeType) {
  // console.warn(nodeType);
  let $from = state.selection.$from
  for (let d = $from.depth; d >= 0; d--) {
    let index = $from.index(d)
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true
  }
  return false
}

function markApplies(doc, ranges, type) {
  for (let i = 0; i < ranges.length; i++) {
    let {$from, $to} = ranges[i]
    let can = $from.depth == 0 ? doc.type.allowsMarkType(type) : false
    doc.nodesBetween($from.pos, $to.pos, node => {
      if (can) return false
      can = node.inlineContent && node.type.allowsMarkType(type)
    })
    if (can) return true
  }
  return false
}

function canInsertMark(state, markType) {
  
  // Check excludes
    let $marks = state.selection.$from.marks();
    // loop selection marks and check if this mark.excludes markType except self because we want to keep toggle for some marks (b/u/i)
    for (var i = 0; i < $marks.length; i++) {
      //console.log("\->",$marks[i].type.name, markType.name, $marks[i].type.excludes(markType));
      if ($marks[i].type.name!=markType.name && $marks[i].type.excludes(markType)) {
        return false;
      }
    }    
  // Check if can apply
    let {empty, $cursor, ranges} = state.selection    
    if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType)) return false

  // NEW plus 
    if (!empty) {      
      let $aMarks = state.selection.$from.marksAcross(state.selection.$from);
      //console.log("state.selection", $aMarks)
      if ($aMarks!=null) {
        for (var i = 0; i < $aMarks.length; i++) {
          //console.log("\->",$marks[i].type.name, markType.name, $marks[i].type.excludes(markType));
          if ($aMarks[i].type.name!=markType.name && $aMarks[i].type.excludes(markType)) {
            return false;
          }
        } 
      }
    }

  // Can
    return true
}

// CUSTOM
export function canInsertBlock(state, nodeType) {
  //console.warn(nodeType);
  let $from = state.selection.$from
  for (let d = $from.depth; d >= 0; d--) {
    let index = $from.index(d)    
    if (typeof $from.node(d).type.spec.marks != "undefined") { 
      //console.info("\t->",$from.node(d).type.spec,nodeType.name);
      if ($from.node(d).type.spec.marks.indexOf(nodeType.name)==-1) {
        return false;
      } else {
        return true;
      }
    } else if ($from.node(d).type.name != "doc") {
      //console.log("\t->",$from.node(d).type.name)
      return true
    }
  }
  return false
}

function insertImageItem(nodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    enable(state) { 
      return canInsert(state, nodeType) 
    },
    run(state, _, view) {
      let {from, to} = state.selection, attrs = null
      if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
        attrs = state.selection.node.attrs
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({label: "Location", required: true, value: attrs && attrs.src}),
          title: new TextField({label: "Title", value: attrs && attrs.title}),
          alt: new TextField({label: "Description",
                              value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")})
        },
        //NEW:
        callback(file) {          
             // A fresh object to act as the ID for this upload
              let id = {};

            // Replace the selection with a placeholder
              //console.log("add placeholder here: ")          
              let linkKey = view.state.config.pluginsByKey["extension$"];


              let tr = view.state.tr;
              let pos_ = tr.selection.from;
              tr.setMeta(linkKey, {add: {id, pos: pos_}})
              
              view.dispatch(tr)
              view.focus()

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

              uploadFile(file).then(function (url) {
                var pos = linkKey.spec.imagePlaceholder(view.state, id, linkKey);
                // If the content around the placeholder has been deleted, drop
                // the image
                if (pos == null) { return }
                // Otherwise, insert it at the placeholder's position, and remove
                // the placeholder
                view.dispatch(view.state.tr
                              .replaceWith(pos, pos, nodeType.create({src: url}))
                              .setMeta(linkKey, {remove: {id: id}}));
              }, function () {
                // On failure, just clean up the placeholder
                view.dispatch(view.state.tr.setMeta(linkKey, {remove: {id: id}}));
              });          
            
        }
        //ORIG:
        // callback(attrs) {
        //   view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)))
        //   view.focus()
        // }

      })
    }
  })
}

// This is just a dummy that loads the file and creates a data URL.
// You could swap it out with a function that does an actual upload
// and returns a regular URL for the uploaded file.
function uploadFile(file) {
  var reader = new FileReader;
  return new Promise(function (accept, fail) {
    reader.onload = function () { return accept(reader.result); };
    reader.onerror = function () { return fail(reader.error); };
    // Some extra delay to make the asynchronicity visible
    setTimeout(function () { 
      // TEST
      var s = Math.round((Math.random() * 1));
      console.log("test success/fail: ", s)
      if (s==0) {
      return fail(reader.error);
      }
      // ORIG
      return reader.readAsDataURL(file); 
    }, 1500);
  })
}

function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)

  return new MenuItem(passedOptions)
}

export function markActive(state, type) {
  let {from, $from, to, empty} = state.selection
  if (empty) return type.isInSet(state.storedMarks || $from.marks())
  else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) { return markActive(state, markType) },
    select: toggleMark(markType) && ( state => canInsertMark(state, markType) ), //if this is present blocktype will be removed if not applicable
    // enable: true
    enable(state) { 
      return canInsertMark(state, markType);
      // return true;
    }
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return cmdItem(toggleMark(markType), passedOptions)
}

function linkItem(markType) {
  return new MenuItem({
    title: "Ctrl+Shift+l",
    icon: icons.link,
    active(state) { return markActive(state, markType) },
    select: toggleMark(markType) && ( state => ((!state.selection.empty && canInsertBlock(state, markType))  // selection
          || (canInsertBlock(state, markType) && markActive(state, markType) )) ), //if this is present blocktype will be removed if not applicable
    enable(state) { 
      // ORIG:
        //return !state.selection.empty 
      // NEW:
        //console.warn("can insert link?", (!state.selection.empty &&canInsertBlock(state, markType)));
        //return (!state.selection.empty &&canInsertBlock(state, markType))
        return ((!state.selection.empty && canInsertBlock(state, markType))  // selection
          || (canInsertBlock(state, markType) && markActive(state, markType) ) // active link can be viewed also if there is empty selection and cursor is inside
          )
    },
    // lib: prosemirror-menu - https://github.com/prosemirror/prosemirror-menu)
    run(state, dispatch, view, domEvent) {      
      // NEW
        // find plugin
        let linkKey = state.config.pluginsByKey["extension$"];
        // check if has link
        // console.log("has link:")
        if (markActive(state, markType)) {
          // console.log("yes")
          // remove link
          linkKey.spec.removeLink(view);
          return true
        }
        // Open edit dialog      
        linkKey.spec.openDialog(view);
      
          
      // ORIG
        /*
        if (markActive(state, markType)) {
          toggleMark(markType)(state, dispatch)
          return true
        }
        openPrompt({
          title: "Create a link",
          fields: {
            href: new TextField({
              label: "Link target",
              required: true
            }),
            title: new TextField({label: "Title"})
          },
          callback(attrs) {
            toggleMark(markType, attrs)(view.state, view.dispatch)
            view.focus()
          }
        })
        */
    }
  })
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options)
}

// :: (Schema) → Object
// Given a schema, look for default mark and node types in it and
// return an object with relevant menu items relating to those marks:
//
// **`toggleStrong`**`: MenuItem`
//   : A menu item to toggle the [strong mark](#schema-basic.StrongMark).
//
// **`toggleEm`**`: MenuItem`
//   : A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
//
// **`toggleCode`**`: MenuItem`
//   : A menu item to toggle the [code font mark](#schema-basic.CodeMark).
//
// **`toggleLink`**`: MenuItem`
//   : A menu item to toggle the [link mark](#schema-basic.LinkMark).
//
// **`insertImage`**`: MenuItem`
//   : A menu item to insert an [image](#schema-basic.Image).
//
// **`wrapBulletList`**`: MenuItem`
//   : A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
//
// **`wrapOrderedList`**`: MenuItem`
//   : A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
//
// **`wrapBlockQuote`**`: MenuItem`
//   : A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
//
// **`makeParagraph`**`: MenuItem`
//   : A menu item to set the current textblock to be a normal
//     [paragraph](#schema-basic.Paragraph).
//
// **`makeCodeBlock`**`: MenuItem`
//   : A menu item to set the current textblock to be a
//     [code block](#schema-basic.CodeBlock).
//
// **`makeHead[N]`**`: MenuItem`
//   : Where _N_ is 1 to 6. Menu items to set the current textblock to
//     be a [heading](#schema-basic.Heading) of level _N_.
//
// **`insertHorizontalRule`**`: MenuItem`
//   : A menu item to insert a horizontal rule.
//
// The return value also contains some prefabricated menu elements and
// menus, that you can use instead of composing your own menu from
// scratch:
//
// **`insertMenu`**`: Dropdown`
//   : A dropdown containing the `insertImage` and
//     `insertHorizontalRule` items.
//
// **`typeMenu`**`: Dropdown`
//   : A dropdown containing the items for making the current
//     textblock a paragraph, code block, or heading.
//
// **`fullMenu`**`: [[MenuElement]]`
//   : An array of arrays of menu elements for use as the full menu
//     for, for example the [menu bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
export function buildMenuItems(schema) {
  let r = {}, type
  if (type = schema.marks.strong)
    r.toggleStrong = markItem(type, {title: "Cmd+b", icon: icons.strong})
  if (type = schema.marks.em)
    r.toggleEm = markItem(type, {title: "Cmd+i", icon: icons.em})
  if (type = schema.marks.underline)
    r.toggleUnderline = markItem(type, {title: "Cmd+u", icon: icons.underline})
  if (type = schema.marks.code)
    r.toggleCode = markItem(type, {title: "Cmd+`", icon: icons.code})
  if (type = schema.marks.link)
    r.toggleLink = linkItem(type)

  if (type = schema.nodes.image)
    r.insertImage = insertImageItem(type)
  if (type = schema.nodes.bullet_list)
    r.wrapBulletList = wrapListItem(type, {
      title: "Ctrl+Shift+8",
      icon: icons.bulletList
    })
  if (type = schema.nodes.ordered_list)
    r.wrapOrderedList = wrapListItem(type, {
      title: "Ctrl+Shift+9",
      icon: icons.orderedList
    })
  if (type = schema.nodes.blockquote) {
    // WRAP
    // r.wrapBlockQuote = wrapItem(type, {
    //   title: "Wrap in block quote",
    //   icon: icons.blockquote
    // })
    // CONVERT
    r.makeBlockQuote = blockTypeItem(type, {
      title: "Ctrl+Shift+>",
      icon: icons.blockquote
    }, schema.nodes.paragraph)
  }
  if (type = schema.nodes.paragraph)
    r.makeParagraph = blockTypeItem(type, {
      title: "Ctrl+Shift+0",
      label: "Plain"
    })
  if (type = schema.nodes.code_block)
    r.makeCodeBlock = blockTypeItem(type, {
      title: "Cmd+Shift+\\",
      label: "Code"
    }, schema.nodes.paragraph)
  if (type = schema.nodes.heading)
    /*
    for (let i = 2; i <= schema.nodes.heading.spec.parseDOM.length; i++)    // i==2 if h1 is set to h2 because only 1 title is allowed
      r["makeHead" + (i-1)] = blockTypeItem(type, {                         // -1 so we adress correct heading commant
        title: "Ctrl+Shift+" + (i-1),                                       // -1 so we adress correct heading commant       
        // label: "Level " + (i-1),                                         // -1 so we adress correct heading commant
        icon: icons["heading"+ (i-1)],                                      // -1 so we adress correct heading commant
        attrs: {level: (i)}                                                 //LEGACY (title is now handled only with schema), BEFORE WE HAD TO: +1 if h1 is missing in the heading node spec
      }, schema.nodes.paragraph)
    */
    for (let i = 1; i <= schema.nodes.heading.spec.parseDOM.length; i++)
      r["makeHead" + (i)] = blockTypeItem(type, {                         
        title: "Ctrl+Shift+" + (i),                                       
        // label: "Level " + (i),                                         
        icon: icons["heading"+ (i)],                                      
        attrs: {level: (i+1)}                                               //+1 if h1 is missing in the heading node spec
      }, schema.nodes.paragraph)
  if (type = schema.nodes.horizontal_rule) {
    let hr = type
    r.insertHorizontalRule = new MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      // ORIG:
        //enable(state) { return canInsert(state, hr) },
      // NEW:
      enable(state) { return canInsertBlock(state, hr) },
      run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())) }
    })
  }

  // ORIG:
    // let cut = arr => arr.filter(x => x)
    // r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"})
    // r.typeMenu = new Dropdown(cut([r.makeParagraph, r.makeCodeBlock, r.makeHead1 && new DropdownSubmenu(cut([
    //   r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
    // ]), {label: "Heading"})]), {label: "Type..."})

    // r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleUnderline, r.toggleCode, r.toggleLink])]
    // r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.makeBlockQuote, joinUpItem,
    //                     liftItem, selectParentNodeItem])]
 
    // r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu)
  
  // NEW:
    let cut = arr => arr.filter(x => x)

    r.typeMenu = [cut([r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6])]
    r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleUnderline, r.toggleCode, r.toggleLink])]
    
    r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.makeBlockQuote, joinUpItem,
                        liftItem])]
  
    
    // TEST (img)
    //r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), {label: "Insert"})
    //r.fullMenu = r.inlineMenu.concat([[r.insertMenu]], r.typeMenu, r.blockMenu)

    // VALID:
    if (isIOS()) {
      r.fullMenu = r.inlineMenu.concat(r.typeMenu, [[undoItem, redoItem]], r.blockMenu)
    } else {
      r.fullMenu = r.inlineMenu.concat(r.typeMenu, r.blockMenu)
    }

  return r
}

function isIOS() {
      if (typeof navigator == "undefined") return false
      let agent = navigator.userAgent
      return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent)
}
