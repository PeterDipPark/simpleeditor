import crel from "crelt"
import {lift, joinUp, selectParentNode, wrapIn, setBlockType} from "prosemirror-commands"
import {undo, redo} from "prosemirror-history"

import {getIcon} from "./icons"

const prefix = "simpleeditor-menu"

// ::- An icon or label that, when clicked, executes a command.
export class MenuItem {
  // :: (MenuItemSpec)
  constructor(spec) {
    // :: MenuItemSpec
    // The spec used to create the menu item.
    this.spec = spec
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the icon according to its [display
  // spec](#menu.MenuItemSpec.display), and adds an event handler which
  // executes the command when the representation is clicked.
  render(view) {
    let spec = this.spec    
    let dom = spec.render ? spec.render(view)
        : spec.icon ? getIcon(spec.icon)
        : spec.label ? crel("div", null, translate(view, spec.label))
        : null
    if (!dom) throw new RangeError("MenuItem without icon or label property. Remove from schema or add icon.")
    if (spec.title) {
      const title = (typeof spec.title === "function" ? spec.title(view.state) : spec.title)
      dom.setAttribute("title", translate(view, title))
    }
    if (spec.class) dom.classList.add(spec.class)
    if (spec.css) dom.style.cssText += spec.css

    dom.addEventListener("mousedown", e => {
      e.preventDefault()
      if (!dom.classList.contains(prefix + "-disabled"))
        spec.run(view.state, view.dispatch, view, e)
    })

    function update(state) {
      if (spec.select) {
        let selected = spec.select(state)
        //console.warn("spec", spec, selected)
        dom.style.display = selected ? "" : "none"
        if (!selected) return false
      }
      let enabled = true
      if (spec.enable) {
        // console.log("disable:",state);
        enabled = spec.enable(state) || false
        setClass(dom, prefix + "-disabled", !enabled)
      }
      if (spec.active) {
        // ORIG
        let active = enabled && spec.active(state) || false
        setClass(dom, prefix + "-active", active)
        // NEW: 
        // let active = spec.active(state) || false
        // setClass(dom, prefix + "-active", active)
      }
      return true
    }

    return {dom, update}
  }
}

function translate(view, text) {
  return view._props.translate ? view._props.translate(text) : text
}

// MenuItemSpec:: interface
// The configuration object passed to the `MenuItem` constructor.
//
//   run:: (EditorState, (Transaction), EditorView, dom.Event)
//   The function to execute when the menu item is activated.
//
//   select:: ?(EditorState) → bool
//   Optional function that is used to determine whether the item is
//   appropriate at the moment. Deselected items will be hidden.
//
//   enable:: ?(EditorState) → bool
//   Function that is used to determine if the item is enabled. If
//   given and returning false, the item will be given a disabled
//   styling.
//
//   active:: ?(EditorState) → bool
//   A predicate function to determine whether the item is 'active' (for
//   example, the item for toggling the strong mark might be active then
//   the cursor is in strong text).
//
//   render:: ?(EditorView) → dom.Node
//   A function that renders the item. You must provide either this,
//   [`icon`](#menu.MenuItemSpec.icon), or [`label`](#MenuItemSpec.label).
//
//   icon:: ?Object
//   Describes an icon to show for this item. The object may specify
//   an SVG icon, in which case its `path` property should be an [SVG
//   path
//   spec](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d),
//   and `width` and `height` should provide the viewbox in which that
//   path exists. Alternatively, it may have a `text` property
//   specifying a string of text that makes up the icon, with an
//   optional `css` property giving additional CSS styling for the
//   text. _Or_ it may contain `dom` property containing a DOM node.
//
//   label:: ?string
//   Makes the item show up as a text label. Mostly useful for items
//   wrapped in a [drop-down](#menu.Dropdown) or similar menu. The object
//   should have a `label` property providing the text to display.
//
//   title:: ?union<string, (EditorState) → string>
//   Defines DOM title (mouseover) text for the item.
//
//   class:: ?string
//   Optionally adds a CSS class to the item's DOM representation.
//
//   css:: ?string
//   Optionally adds a string of inline CSS to the item's DOM
//   representation.
//
//   execEvent:: ?string
//   Defines which event on the command's DOM representation should
//   trigger the execution of the command. Defaults to mousedown.

let lastMenuEvent = {time: 0, node: null}
function markMenuEvent(e) {
  lastMenuEvent.time = Date.now()
  lastMenuEvent.node = e.target
}
function isMenuEvent(wrapper) {
  return Date.now() - 100 < lastMenuEvent.time &&
    lastMenuEvent.node && wrapper.contains(lastMenuEvent.node)
}

// ::- A drop-down menu, displayed as a label with a downwards-pointing
// triangle to the right of it.
export class Dropdown {
  // :: ([MenuElement], ?Object)
  // Create a dropdown wrapping the elements. Options may include
  // the following properties:
  //
  // **`label`**`: string`
  //   : The label to show on the drop-down control.
  //
  // **`title`**`: string`
  //   : Sets the
  //     [`title`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/title)
  //     attribute given to the menu control.
  //
  // **`class`**`: string`
  //   : When given, adds an extra CSS class to the menu control.
  //
  // **`css`**`: string`
  //   : When given, adds an extra set of CSS styles to the menu control.
  constructor(content, options) {
    this.options = options || {}
    this.content = Array.isArray(content) ? content : [content]
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState)}
  // Render the dropdown menu and sub-items.
  render(view) {
    let content = renderDropdownItems(this.content, view)

    let label = crel("div", {class: prefix + "-dropdown " + (this.options.class || ""),
                             style: this.options.css},
                     translate(view, this.options.label))
    if (this.options.title) label.setAttribute("title", translate(view, this.options.title))
    let wrap = crel("div", {class: prefix + "-dropdown-wrap"}, label)
    let open = null, listeningOnClose = null
    let close = () => {
      if (open && open.close()) {
        open = null
        window.removeEventListener("mousedown", listeningOnClose)
      }
    }
    label.addEventListener("mousedown", e => {
      e.preventDefault()
      markMenuEvent(e)
      if (open) {
        close()
      } else {
        open = this.expand(wrap, content.dom)
        window.addEventListener("mousedown", listeningOnClose = () => {
          if (!isMenuEvent(wrap)) close()
        })
      }
    })

    function update(state) {
      let inner = content.update(state)
      wrap.style.display = inner ? "" : "none"
      return inner
    }

    return {dom: wrap, update}
  }

  expand(dom, items) {
    let menuDOM = crel("div", {class: prefix + "-dropdown-menu " + (this.options.class || "")}, items)

    let done = false
    function close() {
      if (done) return
      done = true
      dom.removeChild(menuDOM)
      return true
    }
    dom.appendChild(menuDOM)
    return {close, node: menuDOM}
  }
}

function renderDropdownItems(items, view) {
  let rendered = [], updates = []
  for (let i = 0; i < items.length; i++) {
    let {dom, update} = items[i].render(view)
    rendered.push(crel("div", {class: prefix + "-dropdown-item"}, dom))
    updates.push(update)
  }
  return {dom: rendered, update: combineUpdates(updates, rendered)}
}

function combineUpdates(updates, nodes) {
  return state => {
    let something = false
    for (let i = 0; i < updates.length; i++) {
      let up = updates[i](state)
      nodes[i].style.display = up ? "" : "none"
      if (up) something = true
    }
    return something
  }
}

// ::- Represents a submenu wrapping a group of elements that start
// hidden and expand to the right when hovered over or tapped.
export class DropdownSubmenu {
  // :: ([MenuElement], ?Object)
  // Creates a submenu for the given group of menu elements. The
  // following options are recognized:
  //
  // **`label`**`: string`
  //   : The label to show on the submenu.
  constructor(content, options) {
    this.options = options || {}
    this.content = Array.isArray(content) ? content : [content]
  }

  // :: (EditorView) → {dom: dom.Node, update: (EditorState) → bool}
  // Renders the submenu.
  render(view) {
    let items = renderDropdownItems(this.content, view)

    let label = crel("div", {class: prefix + "-submenu-label"}, translate(view, this.options.label))
    let wrap = crel("div", {class: prefix + "-submenu-wrap"}, label,
                   crel("div", {class: prefix + "-submenu"}, items.dom))
    let listeningOnClose = null
    label.addEventListener("mousedown", e => {
      e.preventDefault()
      markMenuEvent(e)
      setClass(wrap, prefix + "-submenu-wrap-active")
      if (!listeningOnClose)
        window.addEventListener("mousedown", listeningOnClose = () => {
          if (!isMenuEvent(wrap)) {
            wrap.classList.remove(prefix + "-submenu-wrap-active")
            window.removeEventListener("mousedown", listeningOnClose)
            listeningOnClose = null
          }
        })
    })

    function update(state) {
      let inner = items.update(state)
      wrap.style.display = inner ? "" : "none"
      return inner
    }
    return {dom: wrap, update}
  }
}

// :: (EditorView, [union<MenuElement, [MenuElement]>]) → {dom: ?dom.DocumentFragment, update: (EditorState) → bool}
// Render the given, possibly nested, array of menu elements into a
// document fragment, placing separators between them (and ensuring no
// superfluous separators appear when some of the groups turn out to
// be empty).
export function renderGrouped(view, content) {
  let result = document.createDocumentFragment()
  let updates = [], separators = []
  for (let i = 0; i < content.length; i++) {
    let items = content[i], localUpdates = [], localNodes = []
    for (let j = 0; j < items.length; j++) {
      let {dom, update} = items[j].render(view)
      let span = crel("span", {class: prefix + "item"}, dom)
      result.appendChild(span)
      localNodes.push(span)
      localUpdates.push(update)
    }
    if (localUpdates.length) {
      updates.push(combineUpdates(localUpdates, localNodes))
      if (i < content.length - 1)
        separators.push(result.appendChild(separator()))
    }
  }

  function update(state) {
    let something = false, needSep = false
    for (let i = 0; i < updates.length; i++) {
      let hasContent = updates[i](state)
      //console.log("\t->",hasContent);
      if (i) separators[i - 1].style.display = ( (needSep && hasContent) || (!needSep && something && hasContent)) ? "" : "none"
      needSep = hasContent
      if (hasContent) something = true
    }
    return something
  }


  return {dom: result, update}
}

function separator() {
  return crel("span", {class: prefix + "separator"})
}

// :: Object
// A set of basic editor-related icons. Contains the properties
// `join`, `lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`,
// `code`, `link`, `bulletList`, `orderedList`, and `blockquote`, each
// holding an object that can be used as the `icon` option to
// `MenuItem`.
export const icons = {
  join: {
    width: 800, height: 900,
    path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
  },
  lift: {
    width: 1024, height: 1024,
    path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
  },
  selectParentNode: {text: "\u2b1a", css: "font-weight: bold"},
  undo: {
    width: 1024, height: 1024,
    path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
  },
  redo: {
    width: 1024, height: 1024,
    path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
  },
  strong: {
    //width: 805, height: 1024,
    //path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
    text: "B", css: "font-weight: bold;font-family: 'Meta Serif Pro', Georgia, sans-serif;font-size: 18px; float: left;display: inline-block;"
  },
  em: {
    // width: 585, height: 1024,
    // path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
    text: "I", css: "font-weight: bold; font-style: italic; font-family: 'Meta Serif Pro', Georgia, sans-serif;font-size: 18px; float: left;display: inline-block;"
  },
  underline: {
    // width: 777, height: 842,
    // path: "M24.27,110.97c41.153,1.001,65.933,7.593,74.355,19.707c5.728,8.436,8.603,44.335,8.603,107.73v168.454 c0,52.957,2.693,92.91,8.085,119.891c7.434,40.13,21.43,73.003,41.996,98.637c20.223,25.284,50.418,45.86,90.542,61.707 c39.449,15.531,87.348,23.278,143.659,23.278c49.234,0,92.218-5.547,129.002-16.688c36.056-10.787,66.768-25.804,92.04-45.014 c24.973-19.561,43.857-40.318,56.668-62.224c8.748-15.527,15.675-36.1,20.735-61.723c7.077-36.74,9.631-88.025,7.593-153.766 c-4.71-127.144-8.425-193.913-11.137-200.324c0-3.709-0.252-8.94-0.729-15.67c-0.518-6.753-0.788-11.299-0.788-13.657 c0-8.783,2.551-15.699,7.591-20.747c2.04-2.014,15.367-4.895,39.968-8.61c13.152-0.337,27.329-2.522,42.497-6.568 c1.367-8.085,2.03-13.318,2.03-15.677c0-4.393-1.02-13-3.026-25.794l-9.104-1.017c-40.495,4.392-73.523,6.066-99.17,5.048 l-103.666-5.048h-42.491l-1.044,43.513l7.111,1.514l50.562-1.017c14.492-0.339,27.475,5.394,38.954,17.198 c6.402,7.089,10.447,21.919,12.131,44.521l2.012,29.844c2.051,29.011,4.32,55.884,6.842,80.681 c2.561,24.782,4.398,45.431,5.589,61.958c1.157,16.522,1.762,38.104,1.762,64.759c0,52.602-3.559,91.205-10.624,115.807 c-5.739,19.569-14.685,38.789-26.796,57.676c-5.758,9.462-16.699,20.245-32.918,32.394c-14.487,11.129-31.171,19.718-50.069,25.787 c-29.321,9.433-61.546,14.176-96.6,14.176c-30.043,0-59.863-7.94-89.539-23.804c-20.567-11.1-36.757-26.626-48.56-46.517 c-15.172-26.311-23.763-60.389-25.799-102.206l-7.07-141.61l-0.527-115.837c0-2.012-0.082-6.309-0.245-12.89 c-0.176-6.573-0.261-12.037-0.261-16.434c0-39.795,2.196-62.038,6.568-66.771c6.419-8.431,19.734-12.643,39.962-12.643 c21.591,0,42.492-1.516,62.738-4.55v-4.553l-1.013-32.367l0.494-7.09c-10.1,0.678-24.605,1.019-43.487,1.019 c-10.12,0.338-34.744,1.178-73.861,2.517c-27.664,1.02-55.978,1.513-84.986,1.513c-11.467,0-39.458-1.17-83.969-3.532 c-17.53-1.354-36.422-2.012-56.649-2.012c-9.108,0-15.857,0.156-20.231,0.497l1.517,44.512 C4.218,109.615,11.805,110.295,24.27,110.97z M760.764,775.128H16.183c-4.712,0-8.593,1.517-11.627,4.554 c-3.043,3.041-4.547,6.908-4.547,11.655v32.354c0,4.713,1.517,8.623,4.547,11.652c3.034,3.041,6.91,4.551,11.627,4.551h744.581 c4.753,0,8.634-1.515,11.664-4.551c3.031-3.029,4.542-6.939,4.542-11.652v-32.354c0-4.747-1.511-8.618-4.542-11.655 C769.398,776.646,765.517,775.128,760.764,775.128z"
    text: "U", css: "font-weight: bold; text-decoration: underline; font-family: 'Meta Serif Pro', Georgia, sans-serif;font-size: 18px; float: left;display: inline-block;"
  },
  heading1: {
    text: "T", css: "font-weight: bold;font-family: 'Meta Serif Pro', Georgia, sans-serif;font-size: 18px; float: left;display: inline-block;"
  },
  heading2: {
    text: "T", css: "font-weight: bold;font-variant:small-caps;text-transform:lowercase;font-family: 'Meta Serif Pro', Georgia, sans-serif;font-size: 18px; float: left;display: inline-block;"
  },
  code: {
    width: 896, height: 1024,
    path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
  },
  link: {
    width: 951, height: 1024,
    path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
  },
  bulletList: {
    width: 768, height: 896,
    path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
  },
  orderedList: {
    width: 768, height: 896,
    path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
  },
  blockquote: {
    width: 640, height: 896,
    path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
  },
  image: {
    width: 25, height: 25,
    path: "M4.042 17.05V8.857c0-1.088.842-1.85 1.935-1.85H8.43C8.867 6.262 9.243 5 9.6 5.01L15.405 5c.303 0 .755 1.322 1.177 2 0 .077 2.493 0 2.493 0 1.094 0 1.967.763 1.967 1.85v8.194c-.002 1.09-.873 1.943-1.967 1.943H5.977c-1.093.007-1.935-.85-1.935-1.937zm2.173-9.046c-.626 0-1.173.547-1.173 1.173v7.686c0 .625.547 1.146 1.173 1.146h12.683c.625 0 1.144-.53 1.144-1.15V9.173c0-.626-.52-1.173-1.144-1.173h-3.025c-.24-.63-.73-1.92-.873-2 0 0-5.052.006-5 0-.212.106-.87 2-.87 2l-2.915.003z M12.484 15.977a3.474 3.474 0 0 1-3.488-3.49A3.473 3.473 0 0 1 12.484 9a3.474 3.474 0 0 1 3.488 3.488c0 1.94-1.55 3.49-3.488 3.49zm0-6.08c-1.407 0-2.59 1.183-2.59 2.59 0 1.408 1.183 2.593 2.59 2.593 1.407 0 2.59-1.185 2.59-2.592 0-1.406-1.183-2.592-2.59-2.592z"
  },
  video: {
    width: 25, height: 25,
    path: "M18.8 11.536L9.23 5.204C8.662 4.78 8 5.237 8 5.944v13.16c0 .708.662 1.165 1.23.74l9.57-6.33c.514-.394.606-1.516 0-1.978zm-.993 1.45l-8.294 5.267c-.297.213-.513.098-.513-.264V7.05c0-.36.218-.477.513-.264l8.294 5.267c.257.21.257.736 0 .933z"
  },
  hr: {
    width: 25, height: 25,
    path: "M8.45 12H5.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.247 0 .45-.226.45-.5 0-.276-.203-.5-.45-.5H8.45z M17.45 12H14.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.248 0 .45-.226.45-.5 0-.276-.202-.5-.45-.5h-2.25z"
  },
  cancel: {
    width: 25, height: 25,
    path: "M13.561,12.5l6.47-6.47c0.293-0.293,0.293-0.768,0-1.061s-0.768-0.293-1.061,0l-6.47,6.47L6.03,4.97 c-0.293-0.293-0.768-0.293-1.061,0s-0.293,0.768,0,1.061l6.47,6.47L4.97,18.97c-0.293,0.293-0.293,0.768,0,1.061 c0.146,0.146,0.338,0.22,0.53,0.22s0.384-0.073,0.53-0.22l6.469-6.47l6.47,6.47c0.146,0.146,0.338,0.22,0.53,0.22 s0.384-0.073,0.53-0.22c0.293-0.293,0.293-0.768,0-1.061L13.561,12.5z"
  },
  upload: {
    width: 25, height: 25,
    path: "M16.808,18.347c0-0.167-0.061-0.312-0.183-0.434c-0.122-0.121-0.266-0.183-0.433-0.183 s-0.312,0.062-0.433,0.183c-0.122,0.122-0.183,0.267-0.183,0.434c0,0.166,0.061,0.311,0.183,0.432 c0.121,0.122,0.266,0.184,0.433,0.184s0.311-0.062,0.433-0.184C16.747,18.657,16.808,18.513,16.808,18.347z M19.27,18.347 c0-0.167-0.062-0.312-0.183-0.434c-0.122-0.121-0.267-0.183-0.434-0.183c-0.166,0-0.311,0.062-0.432,0.183 c-0.122,0.122-0.184,0.267-0.184,0.434c0,0.166,0.062,0.311,0.184,0.432c0.121,0.122,0.266,0.184,0.432,0.184 c0.167,0,0.312-0.062,0.434-0.184C19.208,18.657,19.27,18.513,19.27,18.347z M20.5,16.192v3.077c0,0.256-0.09,0.475-0.27,0.653 c-0.18,0.18-0.397,0.27-0.653,0.27H5.423c-0.257,0-0.475-0.09-0.654-0.27C4.59,19.744,4.5,19.525,4.5,19.27v-3.077 c0-0.257,0.09-0.475,0.269-0.654c0.18-0.179,0.397-0.269,0.654-0.269h4.105c0.135,0.358,0.36,0.653,0.678,0.884 c0.317,0.231,0.671,0.347,1.062,0.347h2.461c0.392,0,0.745-0.115,1.062-0.347c0.317-0.23,0.544-0.525,0.679-0.884h4.105 c0.256,0,0.474,0.09,0.653,0.269C20.41,15.718,20.5,15.936,20.5,16.192z M17.375,9.961c-0.109,0.256-0.298,0.385-0.567,0.385h-2.461 v4.307c0,0.167-0.062,0.312-0.184,0.434c-0.121,0.121-0.266,0.183-0.433,0.183h-2.461c-0.167,0-0.311-0.062-0.433-0.183 c-0.122-0.122-0.183-0.267-0.183-0.434v-4.307H8.192c-0.269,0-0.458-0.129-0.567-0.385C7.516,9.711,7.561,9.49,7.76,9.298 l4.308-4.308c0.115-0.122,0.259-0.183,0.433-0.183s0.317,0.061,0.433,0.183l4.308,4.308C17.439,9.49,17.484,9.711,17.375,9.961z"
  }
}

// :: MenuItem
// Menu item for the `joinUp` command.
export const joinUpItem = new MenuItem({
  title: "Alt+↑ Alt+↓",
  run: joinUp,
  select: state => joinUp(state),
  icon: icons.join
})

// :: MenuItem
// Menu item for the `lift` command.
export const liftItem = new MenuItem({
  title: "Cmd+[",
  run: lift,
  select: state => lift(state),
  icon: icons.lift
})

// :: MenuItem
// Menu item for the `selectParentNode` command.
export const selectParentNodeItem = new MenuItem({
  title: "Select parent node",
  run: selectParentNode,
  select: state => selectParentNode(state),
  icon: icons.selectParentNode
})

// :: MenuItem
// Menu item for the `undo` command.
export let undoItem = new MenuItem({
  //title: "Undo last change",
  run: undo,
  enable: state => undo(state),
  icon: icons.undo
})

// :: MenuItem
// Menu item for the `redo` command.
export let redoItem = new MenuItem({
  //title: "Redo last undone change",
  run: redo,
  enable: state => redo(state),
  icon: icons.redo
})

// :: (NodeType, Object) → MenuItem
// Build a menu item for wrapping the selection in a given node type.
// Adds `run` and `select` properties to the ones present in
// `options`. `options.attrs` may be an object or a function.
export function wrapItem(nodeType, options) {
  let passedOptions = {
    run(state, dispatch) {
      // FIXME if (options.attrs instanceof Function) options.attrs(state, attrs => wrapIn(nodeType, attrs)(state))
      return wrapIn(nodeType, options.attrs)(state, dispatch)
    },
    select(state) {
      return wrapIn(nodeType, options.attrs instanceof Function ? null : options.attrs)(state)
    }
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return new MenuItem(passedOptions)
}

// :: (NodeType, Object) → MenuItem
// Build a menu item for changing the type of the textblock around the
// selection to the given type. Provides `run`, `active`, and `select`
// properties. Others must be given in `options`. `options.attrs` may
// be an object to provide the attributes for the textblock node.
export function blockTypeItem(nodeType, options, resetNodeType) {
  let command = setBlockType(nodeType, options.attrs)
  let passedOptions = {
    run: command,
    enable(state) { 
      //ORIG: 
        //return command(state) 
      //NEW:
        // default command
        this.run = command;
        // see if is supported
        if (!command(state)) {
          // if reset node is passed
          if (resetNodeType) {
            // check if reset is supported
            let command_reset = setBlockType(resetNodeType, options.attrs)
            if (command_reset(state)) {
              // change command //console.log("change command from-to ", nodeType.name, resetNodeType.name, this)
              this.run = command_reset;
              // return enabled
              return true;
            }
            return false
          }
          return false;
        }
        return true;
    },
    select: setBlockType(nodeType,options), //if this is present blocktype will be removed if not applicable
    active(state) {
      let {$from, to, node} = state.selection      
      if (node) return node.hasMarkup(nodeType, options.attrs)
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs)
    }
  }
  for (let prop in options) passedOptions[prop] = options[prop]
  return new MenuItem(passedOptions)
}

// Work around classList.toggle being broken in IE11
function setClass(dom, cls, on) {
  if (on) dom.classList.add(cls)
  else dom.classList.remove(cls)
}
