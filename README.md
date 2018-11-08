# FRI ONJ - assignment 1 

## Installation
Install nodeJs (v10) and yarn. Then run `yarn install && yarn run tsc`.

## Usage
In your terminal set env `ENTRY_PAGE` to web page with list of software.
Run `node index.js`. Results and reports will be saved into `./data` folder.

## What data is scraped?
Software or service:
- description
- official page text
- wiki text and company info
- alternatives to this software or service
- comments/reviews (not a lot)

## Goal
-[x] Detect wrong scraps (documents) from wiki and official pages. 
-[ ] Detect alternative product documents and compare results with alternatives database
-[ ] Visualize cluster and comment on findings

## Steps
- Steps 1-49 are for scraping data from web.
- Steps 50-99 are for text processing.
- Steps 100-199 are for creating results report.

### Step 50
- split into sections and sentences
- normalize - transform whitespace, case, punctuation, contractions and values, so that they are more standard and workable. Example: `didn't` into `did not`

### Step 52
- TfIdf
- use porter stemmer
- tokenize
- remove stopwords