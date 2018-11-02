const WikiJS = require('wikijs').default;

WikiJS().page('gitlab')
    .then(page => {
        return page.info()
        //return page.fullInfo()
        // return page.content()
    })
    .then(x => {
        console.log(x)
    }); // Bruce Wayne



const wikipedia = require("node-wikipedia");

wikipedia.page.data("Gitlab", { content: true }, function(response) {
    console.log()
    // structured information on the page for Clifford Brown (wikilinks, references, categories, etc.)
});
