import {Schema} from "prosemirror-model"


// :: Object
// [Specs](#model.NodeSpec) for the nodes defined in this schema.
// See: https://prosemirror.net/docs/ref/#model.NodeSpec
export const nodes = {
  // :: NodeSpec The top level document node.
  doc: {
    content: "title block*" // content: "title (heading* | block*)" //BAU: "title block*" // OR: "title (heading* | block*)"; and change title group to "title" and  heading nodeSpec parseDom. This approach might still have problems in old pm-view version on paste or break and the end of line (see: http://dc.local/~dogma/_sites/kniznytrh.sk/head/web/). Upgrade to latest pm and test again.
  },

  // :: NodeSpec A plain paragraph textblock. Represented in the DOM
  // as a `<p>` element.
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{tag: "p"}],
    toDOM() { return ["p", 0] }
  },

 // :: NodeSpec A heading textblock, with a `level` attribute that
  // should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  // `<h6>` elements.
  heading: {
    attrs: {level: {default: 2}},
    //ORIG: content: "inline*",
    content: "text*", // so no inline elements will be inserted (like images)
    marks: "", // disallow inline changes (if inline)
    group: "block",

    defining: true, //persist when content placed in
    parseDOM: [
               //{tag: "h1", attrs: {level: 2}}, // This is required if we want to change h1 to h2 without iterator (we need also change doc content and title group). Also Heading node spec must be 3rd after doc and paragraph, also adjust custom-setup menu for heading 
               {tag: "h2", attrs: {level: 2}},
               {tag: "h3", attrs: {level: 3}}
               // {tag: "h4", attrs: {level: 4}},
               // {tag: "h5", attrs: {level: 5}},
               // {tag: "h6", attrs: {level: 6}}
               ],
    toDOM(node) { return ["h" + (node.attrs.level), 0] }
  },

  // :: NodeSpec A blockquote (`<blockquote>`) wrapping one or more blocks.
  blockquote: {
    // content: "block+", // no hard breaks
    content: "inline*", // enable hard breaks
    group: "block",
    marks: "link strong underline",  // all inline tags can be added
    defining: true,
    parseDOM: [{tag: "blockquote"}],
    toDOM() { return ["blockquote", 0] }
  },

  // :: NodeSpec A horizontal rule (`<hr>`).
  horizontal_rule: {
    group: "block", 
    parseDOM: [{tag: "hr"}],
    toDOM() { return ["hr"] }
  },

  title: {
    attrs: {level: {default: 1}},
    //ORIG: content: "inline*",
    content: "text*", // so no inline elements will be inserted (like images)
    marks: "", // disallow inline changes (if inline)
    group: "block", //title", //"title", -> all other h1 will be converted to h2 (change also doc, heading speci), "block" -> we can have h1 elsewhere and convert them to h2 from the plugin state
    defining: true, //persist when content placed in
    parseDOM: [{tag: "h1"}],

    // , getAttrs(dom) {
    //       // let idx_ = Array.prototype.slice.call( dom.parentNode.children );
    //       // console.log("dom",dom, idx_, dom.previousElementSibling);        
    //       if (dom.previousElementSibling==null && dom.hasAttribute("data-pm-slice")) {
    //         console.log(dom, dom.parentNode, dom.parentNode.childNodes[0]);

    //         dom.parentNode.childNodes[0].outerHTML = "<h2>"+dom.parentNode.childNodes[0].innerHTML+"</h2>";

    //         // let olddom = dom.parentNode.childNodes[0];
    //         // let newdom = document.createElement("h2")
    //         // newdom.innerHTML = olddom.innerHTML;
    //         // if (olddom.replaceWith) {
    //         //   olddom.replaceWith(newdom);
    //         // } else {
    //         //   olddom.parentNode.replaceChild(newdom,olddom);
    //         // }
    //         // let newdom = document.createElement("h2")
    //         // newdom.innerHTML = dom.innerHTML;
    //         // if (dom.replaceWith) {
    //         //   dom.replaceWith(newdom);
    //         // } else {
    //         //   dom.parentNode.replaceChild(newdom,dom);
    //         // }
    //       }
    //         return { level: (dom.previousElementSibling==null && !dom.hasAttribute("data-pm-slice") )?1:2 }
          
    //     }}],
    toDOM(node) { 
      // console.log("is first child and doc? ", node.content);
      return ["h1", 0] 
      // // console.log("is first child?", node);
      // if (node.attrs.level == 1 ) {
      //   // is first
      //   return ["h1", 0] 
      // } else {
      //   // is other - change to heading         
      //   node.type = node.type.schema.nodes.heading;
      //   return ["h2", 0]           
      // }
    }
  }, 

  

  // :: NodeSpec The text node.
  text: {
    // group: "inline"
    group: "inline"
  },


  // FIGURE (images, video)
     
        // ORIG: (parseDOM added to div, div is atom so loaded html can be parsed) ==================
                    
                    /*
                  
                    figure: {
                      // OK
                        //content: "image* figcaption", // default content on the node
                        //group: "block",
                      // TEST
                        content: "(embed | image*) figcaption{0,1}", // default content on the node;  empty = exactly one, ? = one or more, + = 1 or more, * = zero or more, {n,m} = from n to m; {n,} = n or more
                      group: "block",

                      // defining: true, //persist when content placed in
                      
                      marks: "",
                      parseDOM: [{tag: "figure"}],
                      toDOM() {                         
                        return ["figure", 0] 
                      }
                    },
                    div: {
                      attrs: {
                        style: {default: "padding-top:56.17021276595745%"}, // youtube: padding-top:56.17021276595745%; vimeo: padding-top:46.91489361702128%
                        //class: {default: "figitem single w-video w-embed"},
                        src: {default: null}
                      },
                      atom: true,
                      defining: false,
                      draggable: false,
                      selectable: true,
                      group: "embed",
                      parseDOM: [{tag: "div", getAttrs(dom) {
                        //console.log("div dom:",dom, dom.firstChild, dom.firstChild.tagName, dom.firstChild.nodeName);
                        if (dom.firstChild.tagName.toLowerCase() == "iframe") {
                            return {
                              src: dom.firstChild.getAttribute("src"),
                              style: dom.getAttribute("style")
                            }
                        } else {
                            return {
                              style: dom.getAttribute("style")
                            }
                        }
                      }}],
                      toDOM(node) { 
                        return ["div", { style: node.attrs.style }, ["iframe",{frameborder:"no",scrolling:"no",allowfullscreen:true, src:node.attrs.src}]] 
                      }
                    },

                    */

        // NEW (avoid accepting divs)

                    figure: {
                      // OK
                        //content: "image* figcaption", // default content on the node
                        //group: "block",
                      // ORIG: content: "(embed | image*) figcaption{0,1}",
                        content: "(embed | image*) figcaption{0,1}", // default content on the node;  empty = exactly one, ? = zero or one, + = 1 or more, * = zero or more, {n,m} = from n to m; {n,} = n or more
                      
                      group: "block",                      
                      // defining: true, //persist when content placed in
                      marks: "",
                      parseDOM: [{tag: "figure"}],
                      toDOM() {                         
                        return ["figure", 0] 
                      }
                    },
                    div: {
                      attrs: {
                        style: {default: "padding-top:56.17021276595745%"}, // youtube: padding-top:56.17021276595745%; vimeo: padding-top:46.91489361702128%
                        //class: {default: "figitem single w-video w-embed"},
                        src: {default: null},
                        valid: {default: true}
                      },
                      atom: true,
                      defining: false,
                      draggable: false,
                      selectable: true,
                      group: "embed",                      


                      parseDOM: [{tag: "iframe", getAttrs(dom) {
                        
                        
                        var valid_src = true;
                        var style_top = "padding-top:56.17021276595745%";
                        var node_text = dom.getAttribute("src") || "";
                        // console.warn("check iframe src", dom, dom.getAttribute("src"), node_text);

                        // See Custom Setup Keymap
                        if (node_text.indexOf("//www.youtube.com/embed/")==0) {
                          style_top = "padding-top:56.17021276595745%";
                        } else if (node_text.indexOf("//player.vimeo.com/video/")==0) {
                          style_top = "padding-top:46.91489361702128%";
                        } else {
                          valid_src = false;
                        }
                        // Return
                        return {
                          src: node_text, // we should validate this youtube or vimo
                          style: style_top, //dom.parentElement.getAttribute("style") // we should be reallly taking paddingTop
                          valid: valid_src
                        }
                      }}],
                      toDOM(node) { 
                        // ORIG
                          //return ["div", { style: node.attrs.style }, ["iframe",{frameborder:"no",scrolling:"no",allowfullscreen:true, src:node.attrs.src}]] 
                        // DODO: [skip node if not valid]
                          if (node.attrs.valid) {
                            return ["div", { style: node.attrs.style }, ["iframe",{frameborder:"no",scrolling:"no",allowfullscreen:true, src:node.attrs.src}]] 
                          } else {
                            // we should not return anything so figure can be dropped. how?
                            // console.log("skip this node???", node);
                            // return ["figcaption"]
                            return ["div", { style: node.attrs.style }, ["iframe",{frameborder:"no",scrolling:"no",allowfullscreen:true, style:"background-color: #EEEEEE;"}]] 
                          }
                      }
                    },


      // ======================


      figcaption: {
        
        //OK
        /*
          // inline: true,
          content: "text*",        
          group: "figure",
        */
       
        // TEST
          //inline: true,
          content: "inline*",   // "inline*" -> can have hard_break;  "text*" -> can't have hard_break;
          group: "figure", //?

        marks: "strong link",  // we can set image on the link but caption can point to desired url
        // parseDOM: [{tag: "figcaption"}],
        // toDOM() { return ["figcaption", 0] }
        parseDOM: [{tag: "figcaption", getAttrs(dom) {
          //console.log("dom:",dom);
          // return {
          //   src: dom.getAttribute("src"),
          //   title: dom.getAttribute("title"),
          //   alt: dom.getAttribute("alt")
          // }
        }}],
        toDOM(node) { 
          //console.log("node",node, node.content.size);
          // if (node.content.size==0) {
          //   console.log("EMPTY----");
          //   // node.content.append(schema.node(schema.text,"text"));
          //   return ["figcaption", ["node", 0]] 
          // }
          
          return ["figcaption", 0] 

        }
      },

      image: {
        
        // be aware that if changing attrs we need to update also custom setup extension catptionImgAlt (becase we are not cloning this object)
        attrs: {
          src: {},
          alt: {default: null}
          // ,title: {default: null}
        },
        
        //OK
        /*
          //inline: true,
          group: "figure",
        */
        
        // TEST
          // inline: true,
          group: "figure",    // will wrap pasted images to figure but there is issue with link > image paste

          // won't wrap pasted images to figure
            // group: "block", 
            // group: "figure block"
          
          

        draggable: true,
        parseDOM: [{tag: "img[src]", getAttrs(dom) {
          //console.log("image:",dom.parentElement);
          return {
            src: dom.getAttribute("src"),
            // title: dom.getAttribute("title"),
            alt: dom.getAttribute("alt")
          }
        }}],
        toDOM(node) { 
          // WORKAROUND for cases where we are receiving link mark on paste 
          node.marks = [];
          // return node
          return ["img", node.attrs] 
        }
        //toDOM(node) { return ["figure",["img", node.attrs]] }
      },
      // upload placeholder       
      svg: {
        group: "image",
        // toDOM(node) { 
        //   return ["svg",{
        //           xmlns: 'http://www.w3.org/2000/svg',
        //           'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        //           viewBox: '0 0 200 25',
        //           class: 'todo__icon',
        //         }]
        // } 
        toDOM(node) { return ["svg"] } 
        // toDOM(node) { return ["span", { style: node.attrs.style, class: node.attrs.class }, ["iframe",{frameborder:"no",scrolling:"no",allowfullscreen:true, src:node.attrs.src}]] }
      },


  // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{tag: "br"}],
    toDOM() { return ["br"] }
  }

  // OTHER block elements:
  
  /*
      // :: NodeSpec A code listing. Disallows marks or non-text inline
      // nodes by default. Represented as a `<pre>` element with a
      // `<code>` element inside of it.
      ,code_block: {
        content: "text*",
        marks: "",
        group: "block",
        code: true, // if this is set break will ad br adnd hardbreak (shitt+enter) will escape block
        defining: true, //persist when content placed in
        parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
        toDOM() { return ["pre", ["code", 0]] }
      }
  */
}

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
  // :: MarkSpec A link. Has `href` and `title` attributes. `title`
  // defaults to the empty string. Rendered and parsed as an `<a>`
  // element.
  link: {
    attrs: {
      href: {},
      title: {default: null},
      target: {default: "_blank"}
    },    

    inclusive: false,
    excludes: "underline", //space separated "bold underline italic", // all "_",
    parseDOM: [{tag: "a[href]", getAttrs(dom) {
      return {href: dom.getAttribute("href"), title: dom.getAttribute("title")}
    }}],
    toDOM(node) { 
      // console.log("node link created", node);
      // create node
      return ["a", node.attrs] 
    }
  },

  // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
  // Has parse rules that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{tag: "i"}, {tag: "em"}, {style: "font-style=italic"}],
    toDOM() { return ["em"] }
  },

  // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
  // also match `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [{tag: "strong"},
               // This works around a Google Docs misbehavior where
               // pasted content will be inexplicably wrapped in `<b>`
               // tags with a font-weight normal.
               {tag: "b", getAttrs: node => node.style.fontWeight != "normal" && null},
               {style: "font-weight", getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null}],
    toDOM() { return ["strong"] }
  },

  underline: {
              parseDOM: [{tag: "u"}, {style: "text-decoration=underline"}],
              toDOM() { return ["u"] }
            }
    
  // OTHER inline marks:
    
  /*      
    // :: MarkSpec Code font mark. Represented as a `<code>` element.
    code: {
      parseDOM: [{tag: "code"}],
      toDOM() { return ["code"] }
    }
  */
}

// :: Schema
// This schema rougly corresponds to the document schema used by
// [CommonMark](http://commonmark.org/), minus the list elements,
// which are defined in the [`prosemirror-schema-list`](#schema-list)
// module.
//
// To reuse elements from this schema, extend or read from its
// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
export const schema = new Schema({nodes, marks})
