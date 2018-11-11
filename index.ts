import { step1 }   from "./step1";
import { step2 }   from "./step2";
import { step3 }   from "./step3";
import { step4 }   from "./step4";
import { step100 } from "./step100";
import { step50 }  from "./step50";
import { step51 }  from "./step51";
import { step101 } from "./step101";
import { step102 } from "./step102";
import { step60 }  from "./step60";
import { step61 }  from "./step61";
import { step62 } from "./step62";

const steps = [
    // GET TEXT FROM WWW
    step1,
    step2,
    step3,
    step4,

    // PROCESS
    step50,
    step51,

    // CLASSIFY, CLUSTER
    step60,
    step61,
    step62,

    // SHOW RESULTS
    step100,
    step101,
    step102
];

async function run(skipTo: any) {
    for (const step of steps) {
        if (skipTo && skipTo !== step) continue;
        else skipTo = null;
        console.log('\n=== Staring ' + step.name);
        await step();
    }
}

// You can skip steps here:
run(step62).then(() => {
    console.log('Finished');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
