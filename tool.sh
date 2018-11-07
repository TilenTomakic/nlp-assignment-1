#!/usr/bin/env bash

cd ./node_modules/fasttext.js/tools
./confusion.sh ../../../data/train.tsv ../../../data/model.bin 1

# ./node_modules/fasttext.js/tools/confusion.sh ./data/train.tsv ./data/model.bin 1 default