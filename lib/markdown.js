var Remarkable = require('remarkable');
var fs = require('fs')
var os = require('os')
var path = require('path')
var uuid = require('uuid')
var highlightjs = require('highlight.js')

// Logging
const debug = require('debug')
const logger = debug('electronpdf:')

/**
 * parse the markdown content and write it to system tmp directory
 * @param  {String} input Path of the markdown file
 * @param  {Object} options Markdown parser options
 * @return {Function}         The callback function with HTML path
 */
module.exports = function (input, options, cb) {
  if (options instanceof Function) {
    cb = options
    options = {}
  }
  
  var md = new Remarkable({
    html:         true,        // Enable HTML tags in source
    xhtmlOut:     true,        // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      true,        // Autoconvert URL-like text to links

    // Enable some language-neutral replacement + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Set doubles to '«»' for Russian, '„“' for German.
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed
    highlight: function (/*str, lang*/) { return highlightjs.highlightAuto(code, [ lang ]).value; }
  });

  fs.readFile(input, function (err, markdownContent) {
    if (err) {
      cb(err)
    }

    var htmlBody = md.render(markdownContent.toString())
    var githubMarkdownCssPath = 'node_modules/github-markdown-css/github-markdown.css'
    var highlightjsDefaultCssPath = 'node_modules/highlight.js/styles/default.css'
    var highlightjsGithubCssPath = 'node_modules/highlight.js/styles/github.css'

    var htmlHeader = '<meta charset="utf-8" />';
    
    // inject custom css if exist
    // todo: validate css
    if (options.customCss) {
      htmlHeader += '<link rel="stylesheet" href="' + path.resolve(options.customCss) + '" />'
    }
    else {
      htmlHeader += '<link rel="stylesheet" href="' + path.resolve(githubMarkdownCssPath) + '" />'
    }

    htmlHeader += '<link rel="stylesheet" href="' + path.resolve(highlightjsDefaultCssPath) + '" />' +
      '<link rel="stylesheet" href="' + path.resolve(highlightjsGithubCssPath) + '" />'

    htmlHeader += '<style> .markdown-body { min-width: 200px; max-width: 790px; margin: 0 auto; padding: 30px; } </style>' +
      '<body><article class="markdown-body">\n'

    var htmlFooter = '\n </article></body>'

    var htmlContent = htmlHeader + htmlBody + htmlFooter

    var tmpHTMLPath = path.join(os.tmpdir(), path.parse(input).name + '-' + uuid() + '.html')

    fs.writeFile(tmpHTMLPath, htmlContent, function (err) {
      if (err) {
        cb(err)
      }
      logger('Converted markdown to html:', input, '->', tmpHTMLPath)
      cb(null, tmpHTMLPath)
    })
  })
}
