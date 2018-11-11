import { DataInterface, normalizeOptions } from "./step50";
import * as fs                             from "fs-extra";
import * as natural                        from "natural";
import * as sw                             from 'stopword';
import * as clustering                     from 'density-clustering';
import { VecDocumnets }                    from "./step51";


(natural.PorterStemmer as any).attach();
const compromise = require('compromise');


function classify(classifier: any, txt: string) {
    const norm = sw.removeStopwords(compromise(txt).normalize(normalizeOptions).out('text').split(' ')).join(' ');
    return classifier.classify(norm.tokenizeAndStem().join(' '));
}

export async function step60() {
    const data: DataInterface = await fs.readJson('./data/data.json');
    const vectorDocs: VecDocumnets[] = await fs.readJson('./data/vectors.json');
    const vectors: number[][] = vectorDocs.map(x => x.vectors);
    const tagVectors: number[][] = data.items.map(x => x.tagsVectors);

    const testVectorDocs: VecDocumnets[] = await fs.readJson('./data/testVectors.json');
    const testVectors: number[][] = vectorDocs.map(x => x.vectors);
    const allVectors = [...vectors, /*testVectors*/]; //.slice(0, 20);

    const kmeans = new clustering.KMEANS();
    const kmeansClusters = kmeans.run(allVectors, 2);
    await fs.writeJson('./data/cluster_kmean2.json', { kmeansClusters });
    const res = kmeansClusters.map(x => x.map(i =>  data.items[i].id));
    console.log('KMEANS done');

    const neighborhoodRadius = 100;
    const pointsInNeighborhood = 3;

    const dbscan = new clustering.DBSCAN();
    // parameters: 5 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
    const dbscanClusters = dbscan.run(allVectors, neighborhoodRadius, pointsInNeighborhood);
    const dbscanNoise = dbscan.noise;
    await fs.writeJson('./data/cluster_dbscan2.json', { dbscanClusters, dbscanNoise });
    console.log('DBSCAN done');

    const optics = new clustering.OPTICS();
    // parameters: 2 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
    const opticsClusters = optics.run(allVectors, neighborhoodRadius, pointsInNeighborhood);
    const opticsPlot = optics.getReachabilityPlot();
    await fs.writeJson('./data/cluster_optics2.json', { opticsClusters, opticsPlot });
    console.log('OPTICS done');
}
