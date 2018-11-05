import * as fs                                from 'fs-extra';
import { PageInterface }                      from "./step2";
import * as natural                           from 'natural';
import * as lda                               from 'lda';
import { DataInterface, PackedPageInterface } from "./step50";

const compromise = require('compromise');

const tokenizer = new natural.WordTokenizer();
(natural.PorterStemmer as any).attach();
const wordnet = new natural.WordNet();
const TfIdf = natural.TfIdf;

async function processPage(page: PackedPageInterface) {
    const tfidf = new TfIdf();
    page.documents.map((x, i) => tfidf.addDocument(x.text as any));

    // page.tfidf = JSON.stringify(tfidf);

    tfidf.tfidfs(page.description, (i, measure) => {
        page.documents[i].measure = measure;
    });
}

export async function step51() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    // await processPage(data.items[0]);
    await Promise.all(data.items.map(x => processPage(x)));
    await fs.writeJson('./data/data.json', data);
}
