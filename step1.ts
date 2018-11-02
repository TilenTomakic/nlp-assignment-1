import * as Crawler from 'crawler';
import * as fs from "fs-extra";
import * as sanitize from "sanitize-filename";

const version = 3;
export const altUrl = process.env.ENTRY_PAGE;

export interface ItemInterface {
    id: string;
    originalId: string;
    url: string;
    title: string;
    alternatives: number;
    description: string;
}

export interface IndexPageInterface {
    items: ItemInterface[]
    html: string
    page: number,
    version: number,
    category: string
    file: string
}

const crawler = new Crawler({
    maxConnections: 10,
    rateLimit: 100,
    // rotateUA: true,
    // userAgent: [],
    callback: function (error, res, done) {
        if (error) {
            console.error(error, res.options.params);
        } else {
            processData(res, res.$, res.options.params)
                .then(() => done())
                .catch((e) => {
                    console.error(e, res.options.params);
                    done();
                });
        }
    }
});

async function processData(res, $: CheerioStatic, {page, category, file}: { page: number, category: string, file: string }) {
    const items: ItemInterface[] = [];
    $('.app-list .app-list-item')
        .each((i, x) => {
            const url = 'https://' + altUrl + $(x).find('h3 a').attr('href');
            const id = $(x).find('.like-box.compact-like-box > a').attr('data-urlname');
            const title = $(x).find('h3 a').text();
            const alternatives = +$(x).find('h3 .alternatives').text().trim().split(' ')[0];
            const description = $(x).find('.itemDesc .text').text();

            items.push({
                id: sanitize(id),
                originalId: id,
                url,
                title,
                alternatives,
                description
            });
            process.stdout.write(", " + sanitize(id));
        });
    const pageData: IndexPageInterface = {
        html: res.body,
        items,
        page,
        category,
        file,
        version
    };
    await fs.writeJson(file, pageData);
}

export async function add(category: string, pages: number) {
    for (let page = 1; page <= pages; page++) {
        const file = `./data/index/${ category }-${ page }.json`;
        const params = {
            page,
            category,
            file
        };
        if (fs.existsSync(file)) {
            const page = await fs.readJson(file);
            if (page.version === version) {
                continue;
            }
            if (!page.html) {
                console.error('no html', page);
            }
            crawler.queue({
                html: page.html,
                params
            });
        } else {
            crawler.queue({
                uri: `https://${ altUrl }/category/developer-tools/all/?p=${ page }&platform=online`,
                params
            });
        }
    }

}

export async function step1() {
    await add('developer-tools', 40);
    await add('business-and-commerce', 40);
    await add('productivity', 40);
    await add('online-services', 40);
    await add('networking-and-admin', 36);
    await add('cryptocurrencies', 16);
    await add('file-sharing', 38);
    await add('video', 40);
    await add('travel-and-location', 27);
    await add('backup-and-sync', 27);
    await add('phots-and-graphics', 40);
    await add('books--news', 40);
    await add('utilities', 40);
    await add('security', 38);
    if (crawler.queueSize > 0) {
        return new Promise(resolve => {
            crawler.on('drain', function () {
                resolve();
            });
        })
    }
}