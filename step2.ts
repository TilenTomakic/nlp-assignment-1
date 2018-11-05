import * as rp                               from 'request-promise-native';
import * as cheerio                          from 'cheerio';
import * as fs                               from 'fs-extra';
import { chunk }                             from 'lodash';
import { ItemInterface, IndexPageInterface } from "./step1";
import * as Crawler                          from "crawler";

const version = 3;

export interface Link {
    text: string;
    href: string;
}

export interface UnfluffInterface {
    title: string;
    softTitle: string;
    date?: any;
    author: any[];
    publisher: string;
    copyright: string;
    description: string;
    lang: string;
    canonicalLink: string;
    tags: any[];
    image: string;
    videos: any[];
    links: Link[];
    text: string;
}


export interface PageInterface {
    item: ItemInterface
    fromCategory: string
    title: string;
    description: string;
    features: { tag: string, text: string }[];
    categories: { tag: string, text: string }[];
    tags: string[];
    comments: string[];
    reviews?: string[];
    skip?: boolean;
    skipReason?: string;
    file: string
    altToHtml: string
    altToPrewHtml?: string
    officalHtml?: string
    officalUrl: string
    officalPage?: UnfluffInterface;
    versionStep2: number;
    versionStep3?: number;
    versionStep4?: number;
    alternatives: string[]
    wiki?: {
        content: string;
        fullInfo: {
            general: {
                name: string;
                logo: string;
                companyType: string;
                foundation: string;
                founder: string;
                location: string;
                areaServed: string;
                owner: string;
                url: string;
                alexa: string;
                websiteType: string;
                language: string;
                registration: string;
                launchDate: string;
                currentStatus: string;
            };
        };
    }
    wikiSkip?: boolean;
}

const crawler = new Crawler({
    maxConnections: 10,
    rateLimit     : 100,
    // rotateUA: true,
    // userAgent: [],
    callback      : function (error, res, done) {
        if (error) {
            console.error(error);
        } else {
            processData(res, res.$, res.options.params, res.options.pageParam)
                .then(() => done())
                .catch((e) => {
                    console.error(e);
                    done();
                });
        }
    }
});

const crawlerRew = new Crawler({
    maxConnections: 10,
    rateLimit     : 100,
    // rotateUA: true,
    // userAgent: [],
    callback      : function (error, res, done) {
        if (error) {
            console.error(error);
        } else {
            processRewData(res, res.$, res.options.params.file)
                .then(() => done())
                .catch((e) => {
                    console.error(e);
                    done();
                });
        }
    }
});

async function processData(res, $: CheerioStatic, { item, category, file }: { item: ItemInterface, category: string, file: string }, pageData: PageInterface = {} as any) {
    process.stdout.write(", " + item.id);

    const newPage: PageInterface = {
        title: $('#appHeader h1').text(),
        officalUrl  : $('.website-link').first().attr('href'),
        alternatives: $('.alternative-list li').toArray().map(x => $(x).attr('data-urlname')).filter(x => !!x),
        description : $('.full-view .item-desc').text(),
        features    : $('.full-view .label.label-feature').toArray().filter(x => !!$(x).attr('href')).map(x => ({
            tag : $(x).attr('href').split('/').filter(x => !!x).pop(),
            text: $(x).text()
        })),
        categories  : $('.full-view .jq_moreInfo > p > a.label.label-default').toArray().filter(x => !!$(x).attr('href')).map(x => ({
            tag : $(x).attr('href').split('/').filter(x => !!x).pop(),
            text: $(x).text()
        })),
        tags        : $('.full-view .jq_moreInfo > p > span.label.label-default').toArray().map(x => $(x).text()),
        comments    : $('.forumText').toArray().map(x => $(x).text()),
        altToHtml   : res.body,
        item,
        fromCategory: category,
        file,
        versionStep2: version
    };
    await fs.writeJson(file, { ...pageData, ...newPage });
}

async function processRewData(res, $: CheerioStatic, file: string) {
    const page: PageInterface = await fs.readJson(file);
    page.reviews              = $('.forumText > p').toArray().map(x => $(x).text());
    await fs.writeJson(file, page);
}

export async function step2() {
    const index     = fs.readdirSync('./data/index');
    const prewQueue = [];
    for (const pageName of index) {
        const data: IndexPageInterface = await fs.readJson(`./data/index/${ pageName }`);
        for (const item of data.items) {
            const file               = `./data/pages/${ item.id }.json`;
            const params             = {
                item,
                category: data.category,
                file
            };
            const crawlerOpt: any    = {
                params
            };
            const crawlerRewOpt: any = {
                params: {
                    file
                }
            };

            if (fs.existsSync(file)) {
                const page = await fs.readJson(file);
                if (page.versionStep2 === version) {
                    continue;
                }
                crawlerOpt.pageParam = page;
                const html           = page.altToHtml || page.html;
                if (html) {
                    crawlerOpt.html = html;
                } else {
                    crawlerOpt.uri = item.url;

                }
                if (page.altToPrewHtml) {
                    crawlerRewOpt.html = page.altToPrewHtml;
                } else {
                    crawlerRewOpt.uri = `${item.url}${ item.url.endsWith('/') ? '' : '/' }reviews/`;
                }
            } else {
                crawlerOpt.uri    = item.url;
                crawlerRewOpt.uri = `${item.url}${ item.url.endsWith('/') ? '' : '/' }reviews/`;
            }
            crawler.queue(crawlerOpt);
            prewQueue.push(crawlerRewOpt);
        }
    }
    if (crawler.queueSize > 0) {
        await new Promise(resolve => {
            crawler.on('drain', function () {
                resolve();
            });
        })
    }

    prewQueue.forEach(x => crawlerRew.queue(x));
    if (crawlerRew.queueSize > 0) {
        await new Promise(resolve2 => {
            crawlerRew.on('drain', function () {
                resolve2();
            });
        })
    }
}