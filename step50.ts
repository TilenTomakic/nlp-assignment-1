import * as fs           from 'fs-extra';
import { PageInterface } from "./step2";

export interface PackedPageInterface {
    id: string;
    url: string;
    title: string;
    description: string;
    tags: string[];
    documents: DocumentInterface[];
}

export interface DocumentInterface {
    source: 'wiki' | 'official' | 'review' | 'comment';
    text: string;
}

export interface DataInterface {
    items: PackedPageInterface[]
}

async function processPage(rawPage: PageInterface) {
    const page: PackedPageInterface = {
        id         : rawPage.item.id,
        url        : rawPage.item.url,
        title      : rawPage.title,
        description: rawPage.description || rawPage.item.description || '',
        tags       : [
            ...rawPage.tags,
            ...rawPage.categories.map(x => x.text),
            ...rawPage.features.map(x => x.text),
        ].map(x => x.toLowerCase()),
        documents  : [
            ...(rawPage.wiki.content || '')
                .split(/=== .+ ===/)
                .map(text => ({ source: 'wiki' as 'wiki', text })),
            ...(rawPage.reviews || [])
                .map(text => ({ source: 'review' as 'review', text })),
            ...(rawPage.comments || [])
                .map(text => ({ source: 'comment' as 'comment', text })),
            ...(rawPage.officalPage.text || '')
                .split('\n')
                .map(text => ({ source: 'official' as 'official', text })),
        ].filter(x => !!x)
    };
    return page;
}

export async function step50() {
    const pages               = fs.readdirSync('./data/pages');
    const data: DataInterface = {
        items: []
    };
    for (const pageName of pages) {
        const page: PageInterface = await fs.readJson(`./data/pages/${ pageName }`);
        if (page.skip || !page.officalHtml || !page.item.description || !page.wiki || !page.wiki.content || !page.officalPage.text) {
            continue;
        }
        process.stdout.write(", " + page.item.id);
        data.items.push(await processPage(page));
    }
    await fs.writeJson('./data/data.json', data);
}
