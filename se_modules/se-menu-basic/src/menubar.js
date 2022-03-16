import crel from "crelt"
import {Plugin} from "prosemirror-state"

import {renderGrouped} from "./menu"

const prefix = "simpleeditor-menubar"

function isIOS() {
  if (typeof navigator == "undefined") return false
  let agent = navigator.userAgent
  return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent)
}

// :: (Object) → Plugin
// A plugin that will place a menu bar above the editor. Note that
// this involves wrapping the editor in an additional `<div>`.
//
//   options::-
//   Supports the following options:
//
//     content:: [[MenuElement]]
//     Provides the content of the menu, as a nested array to be
//     passed to `renderGrouped`.
//
//     floating:: ?bool
//     Determines whether the menu floats, i.e. whether it sticks to
//     the top of the viewport when the editor is partially scrolled
//     out of view.
export function menuBar(options) {
  let oCore = new mCore();
  return new Plugin({
    view(editorView) { return new MenuBarView(editorView, options,oCore) },
    getMenu() {
      return oCore;
    }
  })
}

// ***********************************************
// ****************** Core Class *****************
// ***********************************************
class mCore
{
  constructor()
  {
    this.something = false;
    this.menu = null;
  }
}

class MenuBarView {
  constructor(editorView, options,oCore) {
    this.editorView = editorView
    this.options = options

    // ORIG:
      // this.wrapper = crel("div", {class: prefix + "-wrapper"})
      // this.menu = this.wrapper.appendChild(crel("div", {class: prefix, style: "display: none;"}))
      // this.menu.className = prefix
      // this.spacer = null
    // NEW:
      this.menu = crel("div", {class: prefix, style: "display: none;"})    
      this.menu.className = prefix
      this.something = false;

    // ORIG
      // editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom)
      // this.wrapper.appendChild(editorView.dom)
    // NEW;    
      // editorView.dom.parentNode.appendChild(this.menu)
      document.body.appendChild(this.menu);
    // NEW 2 (must keep wrapper because of destroy)
      // this.wrapper = crel("div", {class: "simpleeditor-wrapper"})
      // editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom)
      // this.wrapper.appendChild(editorView.dom)
      // editorView.dom.parentNode.appendChild(this.menu)
      

    this.maxHeight = 0
    this.widthForMaxHeight = 0
    this.floating = false

    let {dom, update} = renderGrouped(this.editorView, this.options.content)
    this.contentUpdate = update
    this.menu.appendChild(dom)

    // NEW
      this.oCore = oCore;
    


    this.update()

    // ORIG
      // if (options.floating && !isIOS()) {
      //   this.updateFloat()
      //   let potentialScrollers = getAllWrapping(this.wrapper)
      //   this.scrollFunc = (e) => {
      //     let root = this.editorView.root
      //     if (!(root.body || root).contains(this.wrapper)) {
      //         potentialScrollers.forEach(el => el.removeEventListener("scroll", this.scrollFunc))
      //     } else {
      //         this.updateFloat(e.target.getBoundingClientRect && e.target)
      //     }
      //   }
      //   potentialScrollers.forEach(el => el.addEventListener('scroll', this.scrollFunc))
      // }
    // NEW 
      // if (isIOS()) {
      //   this.updateFloat()
      //   let potentialScrollers = getAllWrapping(this.menu.parentNode)
      //   this.scrollFunc = (e) => {
      //     let root = this.editorView.root
      //     if (!(root.body || root).contains(this.menu.parentNode)) {
      //         potentialScrollers.forEach(el => el.removeEventListener("scroll", this.scrollFunc))
      //     } else {
      //         this.updateFloat(e.target.getBoundingClientRect && e.target)
      //     }
      //   }
      //   potentialScrollers.forEach(el => el.addEventListener('scroll', this.scrollFunc))
      // }
    
  }

  update() {
    this.something = this.contentUpdate(this.editorView.state)
    

    // NEW
      this.oCore.something = this.something;
      this.oCore.menu = this.menu;
      // this.oCore.editor = this.editorView.dom;

      // see extensions plugin
      
      // if (this.something) {
      //   console.log("position show menu", this.menu)
      //   this.menu.style.display = "";
      // } else {
      //   this.menu.style.display = "none";
      // }
    
      return;
    
    // ORIG:
      // if (this.floating) {
      //   this.updateScrollCursor()
      // } else {
      //   if (this.menu.offsetWidth != this.widthForMaxHeight) {
      //     this.widthForMaxHeight = this.menu.offsetWidth
      //     this.maxHeight = 0
      //   }
      //   if (this.menu.offsetHeight > this.maxHeight) {
      //     this.maxHeight = this.menu.offsetHeight
      //     this.menu.style.minHeight = this.maxHeight + "px"        
      //   }
      // }
  }

  // updateScrollCursor() {
  //   let selection = this.editorView.root.getSelection()
  //   if (!selection.focusNode) return
  //   let rects = selection.getRangeAt(0).getClientRects()
  //   let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1]
  //   if (!selRect) return
  //   let menuRect = this.menu.getBoundingClientRect()
  //   if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
  //     let scrollable = findWrappingScrollable(this.menu.parentNode)
  //     if (scrollable) scrollable.scrollTop -= (menuRect.bottom - selRect.top)
  //   }
  // }

  updateFloat(scrollAncestor) {

    // NEW
      return;
      // if (isIOS()) {
      //   let parent = this.menu.parentNode, editorRect = parent.getBoundingClientRect(),
      //     top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0
      //   if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
      //     this.floating = false
      //     this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = ""
      //     this.menu.style.display = ""
      //     // this.spacer.parentNode.removeChild(this.spacer)
      //     // this.spacer = null
      //   } else {
      //     let border = (parent.offsetWidth - parent.clientWidth) / 2
      //     this.menu.style.left = (editorRect.left + border) + "px"
      //     this.menu.style.display = (editorRect.top > window.innerHeight ? "none" : "")
      //     if (scrollAncestor) this.menu.style.top = top + "px"
      //   }
      // }
    // ORIG:
      // let parent = this.wrapper, editorRect = parent.getBoundingClientRect(),
      //     top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0

      // if (this.floating) {
      //   if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
      //     this.floating = false
      //     this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = ""
      //     this.menu.style.display = ""
      //     this.spacer.parentNode.removeChild(this.spacer)
      //     this.spacer = null
      //   } else {
      //     let border = (parent.offsetWidth - parent.clientWidth) / 2
      //     this.menu.style.left = (editorRect.left + border) + "px"
      //     this.menu.style.display = (editorRect.top > window.innerHeight ? "none" : "")
      //     if (scrollAncestor) this.menu.style.top = top + "px"
      //   }
      // } else {
      //   if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
      //     this.floating = true
      //     let menuRect = this.menu.getBoundingClientRect()
      //     this.menu.style.left = menuRect.left + "px"
      //     this.menu.style.width = menuRect.width + "px"
      //     if (scrollAncestor) this.menu.style.top = top + "px"
      //     this.menu.style.position = "fixed"
      //     this.spacer = crel("div", {class: prefix + "-spacer", style: `height: ${menuRect.height}px`})
      //     parent.insertBefore(this.spacer, this.menu)
      //   } 
      // }
  }

  destroy() {
    // remove icon collection
      let collection = document.getElementById("simpleeditor-icon-collection")
      if (collection) {
        collection.parentNode.removeChild(collection);
      }
    // NEW (wo/wrapper)
      this.menu.parentNode.removeChild(this.menu);
    // OLD (with wrapper)
      // if (this.menu.parentNode.parentNode) {
      //   this.menu.parentNode.parentNode.replaceChild(this.editorView.dom, this.menu.parentNode)
      // }
  }
}

// Not precise, but close enough
function selectionIsInverted(selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset
  return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING
}

function findWrappingScrollable(node) {
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    if (cur.scrollHeight > cur.clientHeight) return cur
}

function getAllWrapping(node) {
    let res = [window]
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
        res.push(cur)
    return res
}
