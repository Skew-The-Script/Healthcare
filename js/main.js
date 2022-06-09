

let myMean = 3;
let myStdev = 1;
let myDistType = 'normal';
let mySampleSize = 2;
let myNumSamples;
let myGenDataMeanVal;
let myGenDataStDev;
let myCompareNormalVal = 3;
let myCompareType = "greater than";
let numBarsPerUnit = 4;

let data1;
let generatedDataSampleSize = 100000;

let myBarGraphs;
let normalOn = false;
let normalCounted = false;
let skewMap = {
    'normal' : 0,
    'left skew' : -6,
    'right skew' : 6
};

let _testCount = 0;

//////////////////////////////////////////////////////////////////
// access html elements

// numerical inputs
// let distMeanInput = document.getElementById("nDays");
let distStdevInput = document.getElementById("stdevDays");
let distStdevLabel = document.getElementById("flexStdevLabel");
let compareInput = document.getElementById("compareTo");

compareInput.step = 1/(numBarsPerUnit*thirdGraphMult);

// text elements (change the text depending on the simulation run)
let normalParams2 = document.getElementById("normalParams2");
let normalParams3 = document.getElementById("normalParams3");
let normalParamsDiv1 = document.getElementById("normalParamsDiv1");
let normalParamsDiv2 = document.getElementById("normalParamsDiv2");
let normalParamsDiv3 = document.getElementById("normalParamsDiv3");
let normalCount = document.getElementById("normalCount");
let pValue = document.getElementById("pValue");
let fixedStdev = document.getElementById("fixedStdev");

// dropdown input
let distTypeDropdownSelect = document.getElementById('distDropdown');
let sampleSizeDropdownSelect = document.getElementById('sampleSizeDropdown');
let compareDropdownSelect = document.getElementById('compareDropdown');

// div elements to turn on and off
let compareControls = document.getElementById("compareControls");
let compareResults = document.getElementById("compareResults");

let blankImg = document.getElementById("blankImg");

let normalButton = document.getElementById("normalButtons");

//////////////////////////////////////////////////////////////////
// initialize source distribution data

function genData(){
    console.log("!!!! gen data !!!!");
    _testCount = 0;
    let res = [];
    let temp = [];
    let val = 0;
    let total = 0;

    // generate 10000 random samples
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = randomSkewNormal(Math.random, myMean, myStdev, skewMap[myDistType]);
        // val = randomSkewNormal(Math.random, myMean, myStdev, skewMap[myDistType]);
        // val = getRand();
        total += val;
        temp.push(val);
    }

    // myGenDataMeanVal = Math.round(total/generatedDataSampleSize);
    myGenDataMeanVal = total/generatedDataSampleSize;
    console.log("mean: " + myGenDataMeanVal);

    let _totalDistFromMean = 0;
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = temp[i];
        _totalDistFromMean += Math.pow(val - myGenDataMeanVal, 2);
    }

    myGenDataStDev = Math.sqrt(_totalDistFromMean/generatedDataSampleSize);
    console.log("stdev: " + myGenDataStDev);

    let newTotal = 0;
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = temp[i];
        let newval = processRand(val);
        newTotal += newval;
        res.push(newval);
    }

    let postProcessedMean = newTotal/generatedDataSampleSize;

    let _newTotalDistFromMean = 0;
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = res[i];
        _newTotalDistFromMean += Math.pow(val - postProcessedMean, 2);
    }

    let postProcessedStdev = Math.sqrt(_newTotalDistFromMean/generatedDataSampleSize);

    console.log("Post processed:")
    console.log("mean: " + postProcessedMean);
    console.log("stdev: " + postProcessedStdev);

    return res;
}

data1 = genData();
myBarGraphs = new BarVis('barGraphs', data1, myMean, myStdev, myDistType);


////////////////////////////////////////////////////////////////
// start button
$('.start-button').on('click',function(){start();});
// $('.back-button').on('click',function(){back();});

function start(){
    fullpage_api.moveSectionDown();
}

// function back(){
//     fullpage_api.moveSectionUp();
// }


////////////////////////////////////////////////////////////////
// update source distribution
$('.nDays').on('change',function(){updateMean();});
$('.stdevDays').on('change',function(){updateStdev();});
$('.distDropdown').on('change',function(){updateDistType();});
$('.sampleSizeDropdown').on('change',function(){updateSampleSize();});

function reset(){
    data1 = genData();
    myBarGraphs.updateParams(data1, myMean, myStdev, myDistType);
    myBarGraphs.resetSampleGraph();
    myBarGraphs.resetSampleMeanGraph();
    if (normalOn){fitToNormal();}
    if (mySampleSize < 30 && myDistType != "normal"){
        normalButton.style.display = "none";
    }
    else{
        normalButton.style.display = "block";
    }
    normalCount.innerText = "";
    pValue.innerText = "";
}

// function updateMean(){
//     let _mean = +distMeanInput.value;
//     if (_mean >0 && _mean < 6){
//         myMean = _mean;
//         reset();
//     }
//     else {
//         console.log('bad mean');
//     }
// }

function updateStdev(){
    let _stdev = +distStdevInput.value;
    if (_stdev >0 && _stdev <= 1.5){
        myStdev = _stdev;
        reset();
    }
    else {
        console.log('bad stdev');
    }
}

function updateDistType(){
    let _distType = distTypeDropdownSelect.options[distTypeDropdownSelect.selectedIndex].value;
    if (_distType != ""){
        myDistType = _distType;
        if (_distType == "normal"){
            distStdevInput.style.display = "block";
            distStdevLabel.style.display = "block";
            fixedStdev.style.display = "none";
            distStdevInput.max = 1.5;

        }
        else{
            distStdevInput.style.display = "none";
            distStdevLabel.style.display = "none";
            fixedStdev.style.display = "block";
            distStdevInput.value = 1;
            updateStdev();
        }
        compareInput.step = 1/(numBarsPerUnit*thirdGraphMult);
        reset();
    }
    else {
        console.log('bad type');
    }
}

function updateSampleSize(){
    let _sampleSize = +sampleSizeDropdownSelect.options[sampleSizeDropdownSelect.selectedIndex].text;
    if (_sampleSize != ""){
        mySampleSize = _sampleSize;
        myBarGraphs.resetSampleGraph();
        myBarGraphs.resetSampleMeanGraph();
        if (normalOn){fitToNormal();}

        if (_sampleSize < 30 && myDistType != "normal"){
            normalButton.style.display = "none";
        }
        else{
            normalButton.style.display = "block";
        }
        normalCount.innerText = "";
        pValue.innerText = "";
    }
    else {
        console.log('bad sample size');
    }
}


////////////////////////////////////////////////////////////////
// respond to simulation buttons

$('.add-samples-1').on('click',function(){beginAddingSamples(1);});
$('.add-samples-10').on('click',function(){beginAddingSamples(10);});
$('.add-samples-100').on('click',function(){beginAddingSamples(100);});

function beginAddingSamples(n){
    myNumSamples = n;

    // set proper gif using current state and # samples being added
    let totalTime = 0;
    if (n == 1){
        totalTime = 300*mySampleSize;
    }
    let animTime = totalTime/(n*mySampleSize);
    finishAddingSamples(n, animTime);
}

function finishAddingSamples(n, animTime) {
    myBarGraphs.resetSampleGraph();
    let initialDelay = 100;
    delay(initialDelay).then(() =>{
        if (n==1){
            updateGraphWithSingleSample(animTime, initialDelay);
        }
        else{
            updateGraphWithManySamples(n);
        }
        if (normalCounted){
            updateCompareResults();
        }
    });
}

function updateGraphWithSingleSample(animTime, initialDelay){
    let samples = updateSampleGraphOneAtATime(animTime, 0, initialDelay);
    updateSampleMeanGraphAfterIndividualSamples(animTime, samples, 0, initialDelay);
}

function updateGraphWithManySamples(n){
    for (let j = 0; j < n; j++){
        let samples = [];
        for (let i = 0; i < mySampleSize; i++){

            let _i = Math.round(Math.random()*generatedDataSampleSize);
            let val = data1[_i]; // get random sample from stored data

            // let rand = -1;
            // while (!((rand > 0) && (rand < 6*numBarsPerUnit))){
            //     rand = randomSkewNormal(Math.random, myMean, myStdev, skewMap[myDistType]);
            // }
            // let val = processRand(rand);
            samples.push(val);
        }
        if (j == n - 1){
            myBarGraphs.addManySamples(samples);
        }
        myBarGraphs.addSampleGroup(samples);
    }
}

function updateSampleGraphOneAtATime(animTime, sampleNum, initialDelay){
    let samples = [];
    for (let i = 0; i < mySampleSize; i++) {

        let _i = Math.round(Math.random()*generatedDataSampleSize);
        let val = data1[_i]; // get random sample from stored data


        // let rand = -1;
        // while (!((rand > 0) && (rand < 6*numBarsPerUnit))){
        //     rand = randomSkewNormal(Math.random, myMean, myStdev, skewMap[myDistType]);
        // }
        // let val = processRand(rand);
        delay((sampleNum*mySampleSize + i) * animTime + initialDelay).then(() => myBarGraphs.addSample(val));
        samples.push(val);
    }
    return samples;
}

function updateSampleMeanGraphAfterIndividualSamples(animTime, samples, sampleNum, initialDelay){
    delay((sampleNum+1)*mySampleSize * animTime + initialDelay).then(() => {
        myBarGraphs.addSampleGroup(samples);
    });
}


///////////////////////////////////////////////
// display normal distribution curve
$('.fit-to-normal').on('click',function(){fitToNormal();});
$('.count-normal').on('click',function(){countNormal();});
$('.compareTo').on('change',function(){updateCompareNormalVal();});
$('.compareDropdown').on('change',function(){updateCompareType();});

function updateCompareNormalVal(){
    let _comp = +compareInput.value;
    if (_comp >0 && _comp < 6){
        myCompareNormalVal = _comp;
        updateCompareResults();
        myBarGraphs.updateCompareLine();
        myBarGraphs.updateNormalCurve();
    }
    else {
        console.log('bad compare normal val');
    }
}

function updateCompareType(){
    let _compareType = compareDropdownSelect.options[compareDropdownSelect.selectedIndex].value;
    if (_compareType != ""){
        myCompareType = _compareType;
        updateCompareResults();
        myBarGraphs.updateNormalCurve();
    }
    else {
        console.log('bad compare type');
    }
}

function fitToNormal(){
    normalOn = !normalOn;
    if (normalOn){
        blankImg.style.display = "none";
        normalParamsDiv1.style.display = "block";
        normalParamsDiv2.style.display = "block";
        normalParamsDiv3.style.display = "block";
        // compareControls.style.display = "block";
    }
    else{
        blankImg.style.display = "block";
        normalParamsDiv1.style.display = "none";
        normalParamsDiv2.style.display = "none";
        normalParamsDiv3.style.display = "none";
        // compareControls.style.display = "none";
        // compareResults.style.display = "none";
    }

    normalParams2.innerText = "\\begin{align} \\bar{x} \\sim Norm ( \\mu_{\\bar{x}} = "+myMean+", \\sigma_{\\bar{x}} = \\frac{"+myStdev+"}{\\sqrt{"+mySampleSize+"}}) \\end{align}";
    normalParams3.innerText = "\\begin{align} \\bar{x} \\sim Norm ( \\mu_{\\bar{x}} = "+myMean+", \\sigma_{\\bar{x}} = "+Math.round(1000*myStdev/Math.sqrt(mySampleSize))/1000+") \\end{align}";

    if (window.MathJax) {
        MathJax.typesetPromise([normalParamsDiv2]).then(() => {
            MathJax.typesetPromise([normalParamsDiv3]).then(() => {});
        });
    }

    myBarGraphs.toggleNormalCurveVisible();
}


function countNormal(){
    normalCounted = !normalCounted;
    if (normalCounted){
        compareResults.style.display = "block";
        myBarGraphs.wrangleData();
        updateCompareResults();
    }
    else{
        compareResults.style.display = "none";
    }
}

function updateCompareResults(){
    // get normal count from myBarGraphs
    let normCount = myBarGraphs.getNormalCount(myCompareNormalVal, myCompareType);
    // get pValue from myBarGraphs
    let pVal = myBarGraphs.normalCDF(myCompareNormalVal, myCompareType);
    displayNormalCount(normCount);
    displayPValue(pVal);
}

function displayNormalCount(normCount){
    let _n = myBarGraphs.nSampleMeansSoFar;
    let _val = Math.round(1000*normCount/_n)/1000;
    normalCount.innerText = "Count = " + normCount + "/" + _n + "(" + _val + ")";
}

function displayPValue(pVal){
    if (mySampleSize < 30){
        pValue.innerText = ""
    }
    else{
        let _val = Math.round(1000*pVal)/1000;
        pValue.innerText = "p-value = " + _val;
    }

}


///////////////////////////////////////////////
// helper functions

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}



// function randomBeta(){
//     if (myDistType == "left skew"){
//         console.log();
//         return window.jStat.betafn( 4.65, 2.15 );
//     }
//     else if (myDistType == "right skew"){
//         return window.jStat.betafn( 2.15, 4.65 );
//     }
//     else{
//         return -1;
//     }
// }

// random number generator algorithm source:
// https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/

function randomNormals(){
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const R = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    return [R * Math.cos(theta), R * Math.sin(theta)];
}
//
function randomSkewNormal(rng, mean, stdev, α = 0){
    const [u0, v] = randomNormals(rng);
    if (α === 0) {
        return mean*numBarsPerUnit + stdev*numBarsPerUnit * u0;
    }

    const delta = α / Math.sqrt(1 + α * α);
    const u1 = delta * u0 + Math.sqrt(1 - delta * delta) * v;
    const z = u0 >= 0 ? u1 : -u1;
    // return mean*numBarsPerUnit + stdev*numBarsPerUnit*z;
    return mean*numBarsPerUnit + stdev*Math.pow(numBarsPerUnit, 1.3625)*z;
}


function processRand(rand) {

    let res = Math.round(rand - myGenDataMeanVal + myMean * numBarsPerUnit);
    return res;
    //
    // if (myDistType == "normal") {
    //     return res;
    // } else {
    //     if (mySampleSize < 30) {
    //         if (myDistType == "left skew") {
    //             return res - 1;
    //         } else {
    //             return res + 1;
    //         }
    //     }
    //     else {
    //         let u = Math.random();
    //         let comp = 0.6
    //         if (myDistType == "left skew") {
    //             if (u < comp) {
    //                 return res - 1;
    //             } else {
    //                 return res;
    //             }
    //         } else {
    //             if (u < comp) {
    //                 return res + 1;
    //             } else {
    //                 return res;
    //             }
    //         }
    //     }
    // }
}
//
// function processBeta(betaVal){
//     return Math.round(24*betaVal);
// }
//
// function getRand(){
//     if (myDistType == "normal"){
//         const [u0, v] = randomNormals();
//         return  myMean*numBarsPerUnit + myStdev*numBarsPerUnit * u0;
//     }
//     else{
//         return randomBeta();
//     }
// }
//
// function processRand(rand){
//     if (myDistType == "normal"){
//         return Math.round(rand - myGenDataMeanVal + myMean * numBarsPerUnit);
//     }
//     else{
//         return Math.round(24*rand);
//     }
// }
