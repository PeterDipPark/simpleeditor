import {inputRules, wrappingInputRule, textblockTypeInputRule,
        smartQuotes, emDash, ellipsis, InputRule} from "prosemirror-inputrules"

// : (NodeType) → InputRule
// Given a blockquote node type, returns an input rule that turns `"> "`
// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType) {
  //return wrappingInputRule(/^\s*>\s$/, nodeType) // wrap in 
  return textblockTypeInputRule(/^\s*>\s$/, nodeType) // change to
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a number
// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType) {
  return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({order: +match[1]}),
                           (match, node) => node.childCount + node.attrs.order == +match[1])
}

// : (NodeType) → InputRule
// Given a list node type, returns an input rule that turns a bullet
// (dash, plush, or asterisk) at the start of a textblock into a
// bullet list.
export function bulletListRule(nodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType) {
  return textblockTypeInputRule(/^```$/, nodeType)
}

// : (NodeType, number) → InputRule
// Given a node type and a maximum level, creates an input rule that
// turns up to that number of `#` characters followed by a space at
// the start of a textblock into a heading whose level corresponds to
// the number of `#` signs.
export function headingRule(nodeType, maxLevel) {
  return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"),   
                                nodeType, match => ({level: (match[1].length+1) })) // +1 because only one h1 is allowed
}

// keepp traling whitespace
// const keepTrailingSpace = new InputRule(/\S$/, (state, match) => {
//   if (!state.selection.empty && match.length === 1) {
//     const {from, to} = state.selection

//     const matchedWhitespace = state.doc.textBetween(from, to).match(/\s+$/)
//     if (matchedWhitespace && matchedWhitespace.length === 1) {
//       const tr = state.tr
//       return tr.insertText(match[0] + matchedWhitespace[0])
//                .setSelection(new TextSelection(tr.doc.resolve(from + 1), tr.doc.resolve(from + 1)))
//     }
//   }

//   return null
// })

/**
 * Convert textblock to mark
 * @param {string}    RegExp    Regular expresion to test text
 * @param {object}    markType  Schema Mark
 * @param {object}    getAttrs  Optional params to select attributes values
 */
function MarkInputRule(regexp, markType, getAttrs) {
  return new InputRule(regexp, (state, match, start, end) => {
      
    // Resolve marked
    let $start = state.doc.resolve(start)
    let attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs

    // Check if we can apply mark
    if (!$start.parent.type.allowsMarkType(markType)) return null
        
    // Exclude matching for the end of the textblock
    const oCloseFix = (match[5] == undefined)?0:1;    
    const oTextString = match[0].toString().substring(0,match[0].length-1-oCloseFix);
    if (oCloseFix==1 && (end-start-1)!=oTextString.length) {
      // comming from the end
      return null;
    } 
    if (oCloseFix==0 && (end-start)!=oTextString.length) {
      // comming from the end with space only
      return null;
    }

    // Mark specific updates
    let oAttr = {};
    switch (markType.name) {
      case "link":
        oAttr = (attrs.type=="email") ? { href: "mailto:"+oTextString } : { href: oTextString, target: "_blank" };
      break;
    }
    
    // Create Mark
    const oMark = markType.create(oAttr);
    const oTrgString = match[6];
    const oPos = {
      from: start,
      to: end
    }

    // Create transaction
    let tr =  state.tr;
    tr.removeMark(oPos.from, oPos.to-oCloseFix, markType)
    tr.addMark(oPos.from, oPos.to-oCloseFix, oMark)
    tr.insertText(oTrgString,oPos.to)

    // Return transaction
    return tr;
  })
}

// : (NodeType) → InputRule
// Given a code block node type, returns an input rule that turns a
// textblock matching links regex into a link mark.
export function linkRule(markType, opt_enter_) {  
  
  if (opt_enter_) {
    // with space after
    return MarkInputRule(/(?:(?:(https|http|ftp)+):\/\/)?(?:\S+(?::\S*)?(@))?(?:(?:([a-z0-9][a-z0-9\-]*)?[a-z0-9]+)(?:\.(?:[a-z0-9\-])*[a-z0-9]+)*(?:\.(?:[a-z]{2,})(:\d{1,5})?))(?:\/[^\s]*)?(\.|,|;)$/i,   
                                  markType, match => ({type: ((match[2]=='@')?"email":"uri") }))
  } else {
    // with space after = has issues with link at the end of parahraph "www.google.com; d"
    return MarkInputRule(/(?:(?:(https|http|ftp)+):\/\/)?(?:\S+(?::\S*)?(@))?(?:(?:([a-z0-9][a-z0-9\-]*)?[a-z0-9]+)(?:\.(?:[a-z0-9\-])*[a-z0-9]+)*(?:\.(?:[a-z]{2,})(:\d{1,5})?))(?:\/[^\s]*)?(\.|,|;)?(\s)$/i,   
                                  markType, match => ({type: ((match[2]=='@')?"email":"uri") }))
  }

  // with multiple after - we need only space and optionaly enter
    // return MarkInputRule(/(?:(?:(https|http|ftp)+):\/\/)?(?:\S+(?::\S*)?(@))?(?:(?:([a-z0-9][a-z0-9\-]*)?[a-z0-9]+)(?:\.(?:[a-z0-9\-])*[a-z0-9]+)*(?:\.(?:[a-z]{2,})(:\d{1,5})?))(?:\/[^\s]*)?(\s|\?)$/i,   
    //                               markType, match => ({type: ((match[2]=='@')?"email":"uri") })) 

  // TEST CASES
    /*
    https://www.google.com
    http://www.google.com
    www.google.com
    htt://www.google.com
    ://www.google.com http://www.google.com www.google.com doc.google.com
    vec.gooogl.com
    ftp://wewe.sk 
    not
    123-231.dasd a.sk
    some@email.com 
    .asdasdls.sk 
    http://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.randomstring.
    */
   
  // OTHER - optionaly we can attempt to change also pasted links (see: https://github.com/ProseMirror/prosemirror/issues/90#issuecomment-284593797)
}


// : (Schema) → Plugin
// A set of input rules for creating the basic block quotes, lists,
// code blocks, and heading.
export function buildInputRules(schema) {
  // let rules = smartQuotes.concat(ellipsis, emDash, keepTrailingSpace), type
  let rules = smartQuotes.concat(ellipsis, emDash), type
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type))
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type))
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type))
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type))
  if (type = schema.nodes.heading) rules.push(headingRule(type, schema.nodes.heading.spec.parseDOM.length))
  if (type = schema.marks.link) rules.push(linkRule(type))
  return inputRules({rules})
}


