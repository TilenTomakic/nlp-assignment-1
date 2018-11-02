import * as fs from 'fs-extra';
import {PageInterface} from "./step2";
import * as natural from 'natural';
import * as lda from 'lda';
const compromise = require('compromise');

const tokenizer = new natural.WordTokenizer();
(natural.PorterStemmer as any).attach();

export interface NlpPageInterface extends PageInterface {
    combinedDescription: string;
    nlpTokens: string[];
    nlpStemTokens: string[];
}

const normalizeOptions =  {
    // remove hyphens, newlines, and force one space between words
    whitespace: true,
    // keep only first-word, and 'entity' titlecasing
    case: true,
    // turn 'seven' to '7'
    numbers: true,
    // remove commas, semicolons - but keep sentence-ending punctuation
    punctuation: true,
    // visually romanize/anglicize 'Björk' into 'Bjork'.
    unicode: true,
    // turn "isn't" to "is not"
    contractions: true,
    //remove periods from acronyms, like 'F.B.I.'
    acronyms:true,

    // --- A2

    //remove words inside brackets (like these)
    parentheses: true,
    // turn "Google's tax return" to "Google tax return"
    possessives: true,
    // turn "batmobiles" into "batmobile"
    plurals: true,
    // turn all verbs into Infinitive form - "I walked" → "I walk"
    verbs: true,
    //turn 'Vice Admiral John Smith' to 'John Smith'
    honorifics: true,
};

// .sentences().data()
async function processPage(page: NlpPageInterface) {
    const cmpDescription    = compromise(page.description || page.item.description || '');
    const cmpOfficial       = compromise(page.officalPage.text || '');
    const cmpWiki           = compromise( page.wiki.content || '');

    const description =   cmpDescription                  .normalize(normalizeOptions).out('text');
    const official =      cmpOfficial                 .normalize(normalizeOptions).out('text');
    const wiki =          cmpWiki                 .normalize(normalizeOptions).out('text');


    const abc = cmpDescription.sentences().data().map(x => x.normal);

    const combined = `${description }\n${ official }\n${ wiki }`;
    page.combinedDescription = `${description }\n${ official }\n${ wiki }`;

    const distanceToOffical = natural.LevenshteinDistance(page.item.description, page.officalPage.text, {search: true});
    const distanceToWiki = natural.LevenshteinDistance(page.item.description,  page.wiki.content, {search: true});

    page.nlpTokens = tokenizer.tokenize(page.combinedDescription);
    page.nlpStemTokens = (page.combinedDescription as any).tokenizeAndStem();
}

export async function step50() {
    return;
    const pages = fs.readdirSync('./data/pages');

    const classifier = new natural.BayesClassifier();

    for (const pageName of pages) {
        const page: NlpPageInterface = await fs.readJson(`./data/pages/${ pageName }`);
        if (page.skip || !page.officalHtml || !page.item.description || !page.wiki || !page.wiki.content || !page.officalPage.text) {
            continue;
        }
        process.stdout.write(", " + page.item.id);
        await processPage(page);

        // classifier.addDocument(page.combinedDescription, page.item.title);
        // await fs.writeJson(page.file, page);
    }

    // classifier.train();
    // console.log(classifier.classify('blog'));
    // console.log(classifier.classify('website'));

    process.exit(0);
}
