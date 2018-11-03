import * as fs                                from 'fs-extra';
import { PageInterface }                      from "./step2";
import * as natural                           from 'natural';
import * as lda                               from 'lda';
import { DataInterface, PackedPageInterface } from "./step50";

const compromise = require('compromise');

const tokenizer = new natural.WordTokenizer();
(natural.PorterStemmer as any).attach();
const wordnet = new natural.WordNet();

const normalizeOptions = {
    // remove hyphens, newlines, and force one space between words
    whitespace  : true,
    // keep only first-word, and 'entity' titlecasing
    case        : true,
    // turn 'seven' to '7'
    numbers     : true,
    // remove commas, semicolons - but keep sentence-ending punctuation
    punctuation : true,
    // visually romanize/anglicize 'Björk' into 'Bjork'.
    unicode     : true,
    // turn "isn't" to "is not"
    contractions: true,
    //remove periods from acronyms, like 'F.B.I.'
    acronyms    : true,

    // --- A2

    //remove words inside brackets (like these)
    parentheses: true,
    // turn "Google's tax return" to "Google tax return"
    possessives: true,
    // turn "batmobiles" into "batmobile"
    plurals    : true,
    // turn all verbs into Infinitive form - "I walked" → "I walk"
    verbs      : true,
    //turn 'Vice Admiral John Smith' to 'John Smith'
    honorifics : true,
};

// const BrainJSClassifier = require('natural-brain');
// const classifier        = new BrainJSClassifier();
const classifier = new natural.BayesClassifier();

async function processPage(page: PackedPageInterface) {
    // const cmpDescription    = compromise(page.description || page.item.description || '');
    // const cmpOfficial       = compromise(page.officalPage.text || '');
    // const cmpWiki           = compromise( page.wiki.content || '');
    // const description =   cmpDescription                  .normalize(normalizeOptions).out('text');
    // const official =      cmpOfficial                 .normalize(normalizeOptions).out('text');
    // const wiki =          cmpWiki                 .normalize(normalizeOptions).out('text');
    // const abc = cmpDescription.sentences().data().map(x => x.normal);
    // const combined = `${description }\n${ official }\n${ wiki }`;
    // page.combinedDescription = `${description }\n${ official }\n${ wiki }`;
    // const distanceToOffical = natural.LevenshteinDistance(page.item.description, page.officalPage.text, {search:
    // true}); const distanceToWiki = natural.LevenshteinDistance(page.item.description,  page.wiki.content, {search:
    // true}); page.nlpTokens = tokenizer.tokenize(page.combinedDescription); page.nlpStemTokens =
    // (page.combinedDescription as any).tokenizeAndStem();

    console.log(page);
   await new Promise(resolve => {
       wordnet.lookup('blog', function(results) {
           results.forEach(function(result) {
               console.log('------------------------------------');
               console.log(result.synsetOffset);
               console.log(result.pos);
               console.log(result.lemma);
               console.log(result.synonyms);
               console.log(result.pos);
               console.log(result.gloss);
           });

           resolve();
       });
   })
}

export async function step51() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    await processPage(data.items[0]);
    // await Promise.all(data.items.slice(0, 50).map(x => processPage(x)));

    // data.items.map(page => page.description.toLowerCase().split('.').map(x => classifier.addDocument(x, page.title)));
    // classifier.train();
    // classifier.save('./data/brain_classifier.json', function () {});

    // console.log(classifier.classify('did the tests pass?'));
    console.log(12);
}
