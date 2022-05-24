
let myMean = 3;
let myStdev = 2;
let myDistType = 'normal';
let mySampleSize = 2;
let myGenDataMeanVal;
let myCompareNormalVal = 3;
let myCompareType = "greater than";


let data1;

let myBarGraphs;
let normalOn = false;
let normalCounted = false;
let skewMap = {
    'normal' : 0,
    'left skew' : -4,
    'right skew' : 4
};

//////////////////////////////////////////////////////////////////
// access html elements

// numerical inputs
let distMeanInput = document.getElementById("nDays");
let distStdevInput = document.getElementById("stdevDays");
let compareInput = document.getElementById("compareTo");

// text elements (change the text depending on the simulation run)
let normalParams2 = null;
let normalParams3 = null;
let normalParamsDiv1 = document.getElementById("normalParamsDiv1");
let normalParamsDiv2 = document.getElementById("normalParamsDiv2");
let normalParamsDiv3 = document.getElementById("normalParamsDiv3");
let normalCount = document.getElementById("normalCount");
let pValue = document.getElementById("pValue");

// dropdown input
let distTypeDropdownSelect = document.getElementById('distDropdown');
let sampleSizeDropdownSelect = document.getElementById('sampleSizeDropdown');
let compareDropdownSelect = document.getElementById('compareDropdown');

// div elements to turn on and off
let compareControls = document.getElementById("compareControls");
let compareResults = document.getElementById("compareResults");

//////////////////////////////////////////////////////////////////
// initialize source distribution data

function genData(){
    let res = [];
    let temp = [];
    let generatedDataSampleSize = 10000;
    let val = 0;
    let total = 0;

    // generate 10000 random samples
    // multiply the mean value by 4 because our
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = randomSkewNormal(Math.random, myMean*4, myStdev, skewMap[myDistType]);
        total += val;
        temp.push(val);
    }
    myGenDataMeanVal = Math.round(total/generatedDataSampleSize);
    for (let i = 0; i < generatedDataSampleSize; i++){
        val = temp[i];
        res.push(val - myGenDataMeanVal + myMean*4);
    }
    return res;
}

data1 = genData();
myBarGraphs = new BarVis('barGraphs', data1, myMean, myStdev, myDistType);


////////////////////////////////////////////////////////////////
// start button
$('.start-button').on('click',function(){start();});
$('.back-button').on('click',function(){back();});

function start(){
    fullpage_api.moveSectionDown();
}

function back(){
    fullpage_api.moveSectionUp();
}


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
}

function updateMean(){
    let _mean = +distMeanInput.value;
    if (_mean >0 && _mean < 6){
        myMean = Math.round(_mean*4)/4;
        reset();
    }
    else {
        console.log('bad mean');
    }
}

function updateStdev(){
    let _stdev = +distStdevInput.value;
    if (_stdev >0 && _stdev < 5){
        myStdev = Math.round(_stdev*4)/4;
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

    // set proper gif using current state and # samples being added
    let animTime = 0;
    let totalTime = 0;
    if (n == 1){
        if (mySampleSize == 2){
            totalTime = 1000;
        }
        else if (mySampleSize == 4){
            totalTime = 1000;
        }
        else if (mySampleSize == 10){
            totalTime = 2000;
        }
        else if (mySampleSize == 30){
            totalTime = 6000;
        }
        else if (mySampleSize == 50){
            totalTime = 10000;
        }
    }
    animTime = totalTime/(n*mySampleSize);
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
            let rand = randomSkewNormal(Math.random, myMean*4, myStdev, skewMap[myDistType]);
            let val = rand - myGenDataMeanVal + myMean*4;
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
        let rand = randomSkewNormal(Math.random, myMean*4, myStdev, skewMap[myDistType]);
        let val = rand - myGenDataMeanVal + myMean*4;
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
        myCompareNormalVal = Math.round(_comp*8)/8;
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
        normalParamsDiv1.style.display = "block";
        normalParamsDiv2.style.display = "block";
        normalParamsDiv3.style.display = "block";
        compareControls.style.display = "block";
    }
    else{
        normalParamsDiv1.style.display = "none";
        normalParamsDiv2.style.display = "none";
        normalParamsDiv3.style.display = "none";
        compareControls.style.display = "none";
        compareResults.style.display = "none";
    }

    if (normalParams2 != null){
        normalParams2.style.display = "none";
    }
    if (normalParams3 != null){
        normalParams3.style.display = "none";
    }
    normalParams2 = document.getElementById("normalParams2_"+myMean+"_"+myStdev+"_"+mySampleSize);
    normalParams2.style.display = "block";
    normalParams3 = document.getElementById("normalParams3_"+myMean+"_"+myStdev+"_"+mySampleSize);
    normalParams3.style.display = "block";
    myBarGraphs.toggleNormalCurveVisible();
}


function countNormal(){
    normalCounted = !normalCounted;
    if (normalCounted){
        compareResults.style.display = "block";
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
    let _val = Math.round(1000*pVal)/1000;
    pValue.innerText = "p-value = " + _val;
}


///////////////////////////////////////////////
// helper functions

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// random number generator algorithm source:
// https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/

function randomNormals(rng){
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) u1 = rng();
    while (u2 === 0) u2 = rng();
    const R = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    return [R * Math.cos(theta), R * Math.sin(theta)];
}

function randomSkewNormal(rng, mean, stdev, α = 0){
    const [u0, v] = randomNormals(rng);
    if (α === 0) {
        return Math.round(mean + stdev * u0);
    }
    const delta = α / Math.sqrt(1 + α * α);
    const u1 = delta * u0 + Math.sqrt(1 - delta * delta) * v;
    const z = u0 >= 0 ? u1 : -u1;
    return Math.round(mean + stdev * z);
}
