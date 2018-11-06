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

export async function step102() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    const items = data.items.map(x => `<h4>${ striptags(x.title) }</h4>
<pre>${ x.documents.filter(y => !!y.rejected).map(z => striptags(z.textNorm)).join('\n') }</pre>`);

    await fs.writeFile('./data/out102.html', `<html><heah>
<link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
<link rel="stylesheet" href="//cdn.rawgit.com/necolas/normalize.css/master/normalize.css">
<link rel="stylesheet" href="//cdn.rawgit.com/milligram/milligram/master/dist/milligram.min.css">
</heah><body>
<div style="margin: 1em"><h1>FRI ONJ - assignment 1 - Rejected text</h1><hr>${ items.join('\n') }</div>
</body></html>`);
}