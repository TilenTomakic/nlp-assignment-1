import * as rp from 'request-promise-native';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import {chunk} from 'lodash';
import {ItemInterface, IndexPageInterface} from "./step1";
import * as Crawler from "crawler";
import {PageInterface} from "./step2";
import * as unfluff from 'unfluff';
import {DataInterface} from "./step50";

const WikiJS = require('wikijs').default;
const striptags = require('striptags');
const compromise = require('compromise');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

export async function step101() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    const items = data.items.map(page => `<section style="margin-bottom: 0.5em">
        <h4>${ striptags(page.title) } (<a style="font-size: 80%" href="${ page.url }">${ page.url }</a>)</h4>
        <p>${ page.description }</p></div>
       <pre class="column" style="padding: 1em; font-size: 12px; max-height: 200px; overflow-y: auto;">${
        page.documents.map(x => `${ x.measure }\t\t\t${ x.source }\t\t${ x.text }`).join('\n')
        }</pre>
</section>
        `);


    await fs.writeFile('./data/out101.html', `<html><heah>
<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
<link rel="stylesheet" href="//cdn.rawgit.com/necolas/normalize.css/master/normalize.css">
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
</heah><body>
<div style="margin: 1em"><h1>FRI ONJ - assignment 1 - ${ items.length }</h1><hr>${ items.join('\n') }</div>
</body></html>`);
}