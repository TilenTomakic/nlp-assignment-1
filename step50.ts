import * as fs from 'fs-extra';
import {PageInterface} from "./step2";

const compromise = require('compromise');


export interface PackedPageInterface {
    id: string;
    url: string;
    title: string;
    description: string;
    descriptionNorm?: string;
    descriptionTokens?: string[];
    tags: string[];
    alternatives: string[];
    documents: DocumentInterface[];
    sentences: DocumentInterface[];
}

export interface DocumentInterface {
    rejected?: string;
    measure?: number;
    source: 'wiki' | 'official' | 'review' | 'comment';
    text: string;
    textNorm?: string;
    tokens?: string[];
    compromiseInstance?: any;
}

export interface DataInterface {
    items: PackedPageInterface[];
    testItems: PackedPageInterface[];
}

export const normalizeOptions = {
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
    acronyms: true,

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

async function processPage(rawPage: PageInterface) {
    const page: PackedPageInterface = {
        sentences: [],
        id: rawPage.item.id,
        url: rawPage.item.url,
        title: rawPage.title,
        alternatives: rawPage.alternatives,
        description: (rawPage.description || rawPage.item.description || '').split('\n').join(' '),
        tags: [
            ...rawPage.tags,
            ...rawPage.categories.map(x => x.text),
            ...rawPage.features.map(x => x.text),
        ].map(x => x.toLowerCase()),
        documents: [
            ...(rawPage.wiki && rawPage.wiki.content || '')
                .split(/={2,3} .+ ={2,3}/)
                .map(x => x.split('\n').join(' '))
                .map(text => ({source: 'wiki' as 'wiki', text})),
            ...(rawPage.reviews || [])
                .map(text => ({source: 'review' as 'review', text})),
            ...(rawPage.comments || [])
                .map(text => ({source: 'comment' as 'comment', text})),
            ...(rawPage.officalPage && rawPage.officalPage.text || '')
                .split('\n')
                .map(text => ({source: 'official' as 'official', text})),
        ]
            .map(x => ({...x, text: (x.text || '').trim()}))
            .map(x => {
                const compromiseInstance = compromise(x.text).normalize(normalizeOptions);
                return {...x, compromiseInstance, textNorm: compromiseInstance.out('text')};
            })
            .filter(x => x.textNorm.length > 3)
    };
    page.descriptionNorm = compromise(page.description).normalize(normalizeOptions).out('text');

    page.documents.forEach(doc => {
        const compromiseInstance = doc.compromiseInstance;

        compromiseInstance.sentences().data().forEach(x => {
            const sen: DocumentInterface = { source: doc.source, text: x.text, textNorm: x.normal };
            page.sentences.push(sen);
        });
        doc.compromiseInstance = undefined;
    });
    page.sentences = page.sentences
        .filter(x => x.textNorm.length > 3);

    return page;
}

export async function step50() {
    const pages = fs.readdirSync('./data/pages');
    const items = await Promise.all(pages.map(pageName => fs.readJson(`./data/pages/${ pageName }`)));
    const data: DataInterface = {
        items: await Promise.all(
            items
                .filter(page => !(page.skip || !page.officalHtml || !page.item.description || !page.wiki || !page.wiki.content || !page.officalPage.text))
                .map(page => processPage(page))),
        testItems: await Promise.all(
            items
                .filter(page => !!(page.skip || !page.officalHtml || !page.item.description || !page.wiki || !page.wiki.content || !page.officalPage.text))
                .slice(0, 10)
                .map(page => processPage(page)))
    };

    await fs.writeJson('./data/data.json', data);
}
