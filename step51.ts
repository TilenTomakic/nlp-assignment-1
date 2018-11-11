import * as fs                                from 'fs-extra';
import * as natural                           from 'natural';
import { uniq }                               from 'lodash';
import { DataInterface, PackedPageInterface } from "./step50";
import * as sw                                from 'stopword';

export const docsNum = 0;

// (natural.LancasterStemmer as any).attach();
(natural.PorterStemmer as any).attach(); // <- Porter se izkaže kot boljši

const tokenizer = new natural.WordTokenizer();
const wordnet   = new natural.WordNet();
const TfIdf     = natural.TfIdf;

export interface VecDocumnets {
    id: string;
    vectors: number[];
}

async function processPage(page: PackedPageInterface) {
    // TOKENIZE
    page.descriptionTokens = sw.removeStopwords(
        (page.descriptionNorm as any).tokenizeAndStem()
    );

    page.documents = page.documents
        .map(x => ({ ...x, tokens: (x.textNorm as any).tokenizeAndStem() }))
        .map(x => ({ ...x, tokens: sw.removeStopwords(x.tokens) }));

    // TFIDF
    const tfidf = new TfIdf();
    tfidf.addDocument(page.descriptionTokens);
    page.documents.forEach(x => tfidf.addDocument(x.tokens));

    // Figure out how important is doc
    tfidf.tfidfs(page.descriptionTokens, (i, measure) => {
        if (i === 0) { return }
        page.documents[ i - 1 ].measure = measure;
    });
    page.documentsAvgTfidf = page.documents.reduce((a, x) => (a + x.measure) / 2, 0);

    page.documents.map(x => x.rejected = x.measure < page.documentsAvgTfidf && 'tfidfs similarity to low');

    page.tokens = [
        ...page.descriptionTokens,
        ...page.documents
            .filter(doc => !doc.rejected)
            .sort((a, b) => b.measure - a.measure)
            .slice(0, docsNum) // performance reasons
            .map(doc => doc.tokens)
            .reduce((a, c) => [ ...a, ...c ], [])
    ];
}

export async function step51() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    // data.items = data.items.filter(x =>
    //     x.tags.indexOf('developer tool') !== -1 ||
    //     x.tags.indexOf('version-control-system') !== -1 ||
    //     x.tags.indexOf('ide') !== -1
    // );
    // data.testItems = data.testItems.filter(x =>
    //     x.tags.indexOf('developer tool') !== -1 ||
    //     x.tags.indexOf('version-control-system') !== -1 ||
    //     x.tags.indexOf('ide') !== -1
    // );
    await Promise.all(data.items.map(x => processPage(x)));
    await Promise.all(data.testItems.map(x => processPage(x)));

    // ALL TAGS
    let tags = [];
    data.items.forEach(p => p.tags.forEach(t => tags.push(t)));
    tags = uniq(tags);
    data.items.forEach(p => {
        p.tagsVectors = tags.map(tag => p.tags.find(y => y === tag) ? 1 : 0)
    });

    // COMPILE VECTORS
    const tfidf = new TfIdf();
    data.items.forEach(p => {
        tfidf.addDocument(p.tokens)
    });
    data.items.map((x, i) => {
        x.terms = {};
        tfidf.listTerms(i).forEach(function (item) {
            x.terms[ item.term ] = item.tfidf;
        });
    });

    let documents: VecDocumnets[];
    const terms                    = uniq( data.items
            .map(p => Object.keys(p.terms))
            .reduce((a, c) => [ ...a, ...c ], [])
    );
    documents = data.items.map((p, i) => {
        const vectors = terms.map(x => p.terms[x] || 0);
        return { id: p.id, vectors }
    });

    // TEST DATA
    data.testItems.forEach(p => {
        tfidf.addDocument(p.tokens)
    });
    let testDocuments: VecDocumnets[];
    data.testItems.map((x, i) => {
        x.terms = {};
        tfidf.listTerms(data.items.length + i).forEach(function (item) {
            x.terms[ item.term ] = item.tfidf;
        });
    });
    testDocuments = data.testItems.map((p, i) => {
        const vectors = terms.map(x => p.terms[x] || 0);
        return { id: p.id, vectors }
    });

    await fs.writeJson('./data/vectors.json', documents);
    await fs.writeJson('./data/testVectors.json', testDocuments);
    await fs.writeJson('./data/data.json', data);

    // intended for fasttext
    const trainTsv = data.items.reduce((a, x) => {
        x.documents
            .filter(d => !d.rejected)
            .forEach(n => a += `${ x.id }\t${ n.tokens.join(' ') }\n`);
        a += `${ x.id }\t${ x.descriptionTokens.join(' ') }\n`;
        return a;
    }, '');
    const testTsv  = data.items.reduce((a, x) => {
        a += `${ x.alternatives.join(', ') }\t${ x.descriptionTokens.join(' ') }\n`;
        return a;
    }, '');

    await fs.writeFile('./data/train.tsv', trainTsv);
    await fs.writeFile('./data/test.tsv', testTsv);
}
