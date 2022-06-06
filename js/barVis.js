let xbar = "x\u0305";
let thirdGraphMult = 4;

class BarVis {

    constructor(parentElement, data1, mean, stdev, distType) {
        this.parentElement = parentElement;
        this.data1 = data1;
        this.displayData1 = null;
        this.displayData2 = null;
        this.displayData3 = null;
        this.mean = mean;
        this.stdev = stdev;
        this.distType = distType;
        this.nSamplesSoFar = 0;
        this.nSampleMeansSoFar = 0;
        this.newVis = true;
        this.addedSampleGroup = false;
        this.samples = [];
        this.sampleMeans = [];
        this.showNormalCurve = false;
        this.recentSampleMean = null;
        this.dataCounts = [];
        this.meanCounts = [];
        this.initVis();
    }

    initVis() {
        let vis = this;

        //setup SVG
        vis.margin = {top: 30, right: 50, bottom: 45, left: 50};

        //jquery
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement)
            .append("div")
            .attr("class", "barchart")
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr(
                'viewBox',
                '0 0 ' +
                (vis.width + vis.margin.left + vis.margin.right) +
                ' ' +
                (vis.height + vis.margin.top + vis.margin.bottom)
            )
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.svg.append("text")
            .style("font-size", "15px")
            .attr("y", -5)
            .attr("x", 0)
            .attr("dy", "1.1em")
            .text("Parent population");

        vis.padding = 30;
        vis.height1 = vis.height/3 + 25;
        vis.height2 = 2*vis.height/3 - 25;


        vis.numBars = 6*numBarsPerUnit;


        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;



        // first chart: population data
        vis.displayData1 = [];

        for (let i = 0; i < vis.numBars; i++){
            vis.displayData1.push(0);
        }

        for (let j = 0; j < vis.data1.length; j++){
            let _val = vis.data1[j];
            if (_val >= 0 && _val < vis.numBars){
                vis.displayData1[Math.round(_val)] += 1;
            }
        }

        // second chart: most recent sample data

        vis.displayData2 = [];
        vis.displayData2Freq = [];

        for (let i = 0; i < vis.numBars; i++){
            vis.displayData2Freq.push(0);
        }

        for (let j = 0; j < vis.samples.length; j++){
            let _val = vis.samples[j];
            if (_val >= 0 && _val < vis.numBars){
                vis.displayData2.push(_val);
                vis.displayData2Freq[Math.round(_val)]++;
            }
        }

        // third chart: sample means

        vis.displayData3 = [];
        vis.displayData3Freq = [];

        for (let i = 0; i < vis.numBars*thirdGraphMult; i++){
            vis.displayData3Freq.push(0);
        }

        for (let j = 0; j < vis.sampleMeans.length; j++){
            let _val = vis.sampleMeans[j];
            if (_val >= 0 && _val < vis.numBars*thirdGraphMult){
                vis.displayData3.push(_val);
                vis.displayData3Freq[Math.round(_val)]++;
            }
        }

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.updateAxes();
        vis.updateGraphs();
        vis.updateMeanLine();
        vis.updateCompareLine();
        vis.updateNormalCurve();
        vis.updateSecondChartTitle();
        vis.updateThirdChartTitle();
    }

    updateSecondChartTitle(){
        let vis = this;
        vis.svg.select("#sampleDataLabel").remove();
        vis.svg.append("text")
            .style("font-size", "15px")
            .attr("id", "sampleDataLabel")
            .attr("y", 5)
            .attr("x", 0)
            .attr("dy", "1.1em")
            .attr("transform", "translate(0,"+vis.height1+")")
            // .attr("transform", "translate(0,"+vis.height/3+")")
            .text(() => {
                if (vis.newVis){
                    return "";
                }
                else if (vis.recentSample){
                    return "Most Recent Sample ("+xbar+" = " + vis.recentSampleMean/numBarsPerUnit + ")";
                }
                else if (!vis.running){
                    return "Sample Data ("+xbar+" = " + vis.recentSampleMean/numBarsPerUnit + ")";
                }
                else{
                    return "Sample Data";
                }
            });
    }

    updateThirdChartTitle(){
        let vis = this;
        vis.svg.select("#sampleMeanLabel").remove();
        vis.svg.append("text")
            .style("font-size", "15px")
            .attr("id", "sampleMeanLabel")
            .attr("y", 5)
            .attr("x", 0)
            .attr("dy", "1.1em")
            .attr("transform", "translate(0,"+vis.height2+")")
            // .attr("transform", "translate(0,"+2*vis.height/3+")")
            .text(() => {
                if (vis.addedSampleGroup){
                    return "Distribution of " + vis.nSampleMeansSoFar + " sample means";
                }
                else{
                    return "Distribution of sample means (run some simulations!)";
                }
            });
    }

    updateAxes(){
        let vis = this;

        vis.svg.select("#barGraphXAxis1").remove();
        vis.svg.select("#barGraphXAxis2").remove();
        vis.svg.select("#barGraphXAxis3").remove();
        vis.svg.select("#barGraphYAxis3").remove();

        vis.x = d3.scaleLinear()
            .domain([0, vis.numBars])
            .range([30, vis.width - 30]);

        vis.xDouble = d3.scaleLinear()
            .domain([0, thirdGraphMult*vis.numBars])
            .range([30, vis.width - 30]);

        vis.y1 = d3.scaleLinear()
            .domain([0, d3.max(vis.displayData1)])
            .range([vis.height1 - vis.padding, 0]);
            // .range([vis.height/3 - vis.padding, 0]);

        vis.y2 = d3.scaleLinear()
            .domain([0, d3.max([10, d3.max(vis.displayData2Freq)])])
            .range([vis.height2 - vis.padding, vis.height1 + vis.padding]);
            // .range([2*vis.height/3 - vis.padding, vis.height/3 + vis.padding]);

        vis.y3 = d3.scaleLinear()
            .domain([0, d3.max([10, d3.max(vis.displayData3Freq)])])
            .range([vis.height - vis.padding, vis.height2 + vis.padding]);
            // .range([vis.height - vis.padding, 2*vis.height/3 + vis.padding]);

        vis.x_axis = d3.axisBottom()
            .scale(vis.x)
            .ticks(6)
            .tickValues([0, numBarsPerUnit, 2*numBarsPerUnit, 3*numBarsPerUnit, 4*numBarsPerUnit, 5*numBarsPerUnit, 6*numBarsPerUnit])
            .tickFormat(function(d, i) {return d/numBarsPerUnit;});

        vis.x_axisDouble = d3.axisBottom()
            .scale(vis.xDouble)
            .ticks(6)
            .tickValues([0, thirdGraphMult*numBarsPerUnit, 2*thirdGraphMult*numBarsPerUnit, 3*thirdGraphMult*numBarsPerUnit, 4*thirdGraphMult*numBarsPerUnit, 5*thirdGraphMult*numBarsPerUnit, 6*thirdGraphMult*numBarsPerUnit])
            .tickFormat(function(d, i) {return d/(numBarsPerUnit*thirdGraphMult);});

        vis.y_axis3 = d3.axisLeft()
            .scale(vis.y3)
            .ticks(d3.min([10, d3.max(vis.displayData3Freq)]))
            .tickFormat(d3.format("d"));

        vis.svg.append("g")
            .attr("id", "barGraphXAxis1")
            .attr("transform", "translate(0," + (vis.height1 - vis.padding)+")")
            // .attr("transform", "translate(0," + (vis.height/3 - vis.padding)+")")
            .call(vis.x_axis);

        vis.svg.append("g")
            .attr("id", "barGraphXAxis2")
            .attr("transform", "translate(0," + (vis.height2 - vis.padding)+")")
            // .attr("transform", "translate(0," + (2*vis.height/3 - vis.padding)+")")
            .call(vis.x_axis);

        vis.svg.append("g")
            .attr("id", "barGraphXAxis3")
            .attr("transform", "translate(0," + (vis.height - vis.padding)+")")
            .call(vis.x_axisDouble);

        vis.svg.append("g")
            .attr("id", "barGraphYAxis3")
            .call(vis.y_axis3);
    }

    updateGraphs(){
        let vis = this;
        vis.updatePopulationHistogram();
        vis.updateSampleGraph();
        vis.updateSampleMeanGraph();
    }

    updatePopulationHistogram(){
        let vis = this;
        var bars1 = vis.svg.selectAll(".bar1")
            .data(vis.displayData1);

        bars1.enter().append("rect")
            .attr("class", "bar1")
            .merge(bars1)
            .transition()
            .attr("x", function(d, i){
                let _x = vis.x(i) - Math.sqrt(vis.width/vis.numBars);
                return _x;
            })
            .attr("y", function(d, i){return vis.y1(d);})
            .attr("width", 2*Math.sqrt(vis.width/vis.numBars))
            .attr("height", function(d, i){
                return vis.height1 - vis.y1(d) - vis.padding;
                // return vis.height/3 - vis.y1(d) - vis.padding;
            });

        bars1.exit().remove();
    }

    updateSampleGraph(){

        let vis = this;

        vis.dataCounts = [];
        for (let k = 0; k < vis.numBars; k++){
            vis.dataCounts.push(0);
        }

        // console.log("DATA!!!!!!!!");
        // console.log(vis.displayData2);

        var xsData = vis.svg.selectAll(".sampleDataAll")
            .data(vis.displayData2);

        var xsDataOld = vis.svg.selectAll(".sampleDataOld")
            .data(vis.displayData2.slice(0, -1));



        if (myNumSamples == 1 && vis.nSamplesSoFar >= 1){
            // console.log("at least one sample val");

            if (vis.nSamplesSoFar == 1 && vis.readyToPushNewSampleValue){
                // console.log("putting down the first value");
                xsData.enter().append("text")
                    .attr("class", "sampleDataAll")
                    .merge(xsData)
                    .attr("x", function(d, i){
                        let _x = vis.x(d) - 3.85;
                        return _x;
                    })
                    .attr("y", function(d, i){
                        return vis.height1;
                        // return vis.height/3;
                    })
                    .transition()
                    .attr("y", function(d, i){
                        vis.dataCounts[d]++;
                        return vis.y2(vis.dataCounts[d]-1);
                    })
                    .text("x")
                ;
                xsData.exit().remove();
            }
            else{

                // console.log("putting the old data down");
                xsDataOld.enter().append("text")
                    .attr("class", "sampleDataOld")
                    .merge(xsDataOld)
                    .attr("x", function(d, i){
                        let _x = vis.x(d) - 3.85;
                        return _x;
                    })
                    .attr("y", function(d, i){
                        vis.dataCounts[d]++;
                        return vis.y2(vis.dataCounts[d]-1);
                    })
                    .text("x")
                ;
                xsDataOld.exit().remove();


                // console.log("1: " + dataCounts);

                if (vis.readyToPushNewSampleValue){
                    // console.log("new value falling now");
                    var xsDataNew = vis.svg.selectAll(".sampleDataNew")
                        .data([vis.displayData2[vis.displayData2.length - 1]]);

                    xsDataNew.enter().append("text")
                        .attr("class", "sampleDataNew")
                        .merge(xsDataNew)
                        .attr("x", function(d, i){
                            let _x = vis.x(d) - 3.85;
                            return _x;
                        })
                        .attr("y", function(d, i){
                            return vis.height1;
                            // return vis.height/3;
                        })
                        .transition()
                        .attr("y", function(d, i){
                            vis.dataCounts[d]++;
                            return vis.y2(vis.dataCounts[d]-1);
                        })
                        .text("x")
                    ;
                    xsDataNew.exit().remove();

                    // console.log("2: " + dataCounts);
                }
            }
        }
        else if (vis.resettingSampleGraph){
            // console.log("!!!! RESET DATA!!");

            // console.log("reset counts: " + dataCounts);
            // console.log("reset data: " + vis.displayData2);
            vis.svg.selectAll(".sampleDataAll").remove();
            vis.svg.selectAll(".sampleDataOld").remove();
            vis.svg.selectAll(".sampleDataNew").remove();
        }
        else if (vis.nSamplesSoFar >= 1){
            // console.log("at least one sample val, but why did i reach here");
            xsData.enter().append("text")
                .attr("class", "sampleDataAll")
                .merge(xsData)
                .attr("x", function(d, i){
                    let _x = vis.x(d) - 3.85;
                    return _x;
                })
                .attr("y", function(d, i){
                    vis.dataCounts[d]++;
                    return vis.y2(vis.dataCounts[d]-1);
                })
                .text("x")
            ;
            xsData.exit().remove();
        }

    }

    updateSampleMeanGraph(){

        let vis = this;
        // console.log("SAMPLE MEAN!!!!!!!!!!");
        // console.log(vis.displayData3);

        vis.meanCounts = [];
        for (let k = 0; k < vis.numBars*thirdGraphMult; k++){
            vis.meanCounts.push(0);
        }

        var xsMeans = vis.svg.selectAll(".sampleMeanAll")
            .data(vis.displayData3);

        var xsMeansOld = vis.svg.selectAll(".sampleMeanOld")
            .data(vis.displayData3.slice(0, -1));



        if (myNumSamples == 1 && vis.nSampleMeansSoFar >= 1){
            if (vis.nSampleMeansSoFar == 1 && vis.readyToPushNewSampleMean){
                xsMeans.enter().append("text")
                    .attr("class", "sampleMeanAll")
                    .merge(xsMeans)
                    .attr("x", function(d, i){
                        let _x = vis.xDouble(d) - 3.85/Math.pow(d3.max(vis.displayData3Freq), 0.125);
                        return _x;
                    })
                    .attr("y", function(d, i){
                        return vis.height2;
                        // return 2*vis.height/3;
                    })
                    .transition()
                    .attr("y", function(d, i){
                        vis.meanCounts[d]++;
                        return vis.y3(vis.meanCounts[d]-1);
                    })
                    .text(xbar)
                    .style("font-size", Math.round(16/Math.pow(d3.max(vis.displayData3Freq), 0.125))+"px")
                ;
                xsMeans.exit().remove();
            }
            else{
                xsMeansOld.enter().append("text")
                    .attr("class", "sampleMeanOld")
                    .merge(xsMeansOld)
                    .attr("x", function(d, i){
                        let _x = vis.xDouble(d) - 3.85/Math.pow(d3.max(vis.displayData3Freq), 0.125);
                        return _x;
                    })
                    .attr("y", function(d, i){
                        // console.log("OLD: " + d + " : " + i);
                        vis.meanCounts[d]++;
                        return vis.y3(vis.meanCounts[d]-1);
                    })
                    .text(xbar)
                    .style("font-size", Math.round(16/Math.pow(d3.max(vis.displayData3Freq), 0.125))+"px")
                ;
                xsMeansOld.exit().remove();

                // console.log("1: " + meanCounts);

                if (vis.readyToPushNewSampleMean){

                    var xsMeansNew = vis.svg.selectAll(".sampleMeanNew")
                        .data([vis.displayData3[vis.displayData3.length - 1]]);

                    xsMeansNew.enter().append("text")
                        .attr("class", "sampleMeanNew")
                        .merge(xsMeansNew)
                        .attr("x", function(d, i){
                            let _x = vis.xDouble(d) - 3.85/Math.pow(d3.max(vis.displayData3Freq), 0.125);
                            return _x;
                        })
                        .attr("y", function(d, i){
                            return vis.height2;
                            // return 2*vis.height/3;
                        })
                        .transition()
                        .attr("y", function(d, i){
                            // console.log("NEW: " + d + " : " + i);
                            vis.meanCounts[d]++;
                            return vis.y3(vis.meanCounts[d]-1);
                        })
                        .text(xbar)
                        .style("font-size", Math.round(16/Math.pow(d3.max(vis.displayData3Freq), 0.125))+"px")
                    ;
                    xsMeansNew.exit().remove();

                    // console.log("2: " + meanCounts);

                }

            }

        }
        else if (vis.resettingSampleMeanGraph){
            // console.log("!!!!!RESET MEAN!!!!!!!");
            vis.svg.selectAll(".sampleMeanAll").remove();
            vis.svg.selectAll(".sampleMeanOld").remove();
            vis.svg.selectAll(".sampleMeanNew").remove();
        }
        else if (vis.nSampleMeansSoFar >= 1){
            xsMeans.enter().append("text")
                .attr("class", "sampleMeanAll")
                .merge(xsMeans)
                .attr("x", function(d, i){
                    let _x = vis.xDouble(d) - 3.85/Math.pow(d3.max(vis.displayData3Freq), 0.125);
                    return _x;
                })
                .attr("y", function(d, i){
                    vis.meanCounts[d]++;
                    return vis.y3(vis.meanCounts[d]-1);
                })
                .text(xbar)
                .style("font-size", Math.round(16/Math.pow(d3.max(vis.displayData3Freq), 0.125))+"px")
            ;
            xsMeans.exit().remove();
        }


    }

    resetSampleGraph(){
        let vis = this;
        vis.newVis = true;
        vis.recentSample = false;
        vis.nSamplesSoFar = 0;
        vis.samples = [];
        vis.resettingSampleGraph = true;

        vis.wrangleData();
        vis.resettingSampleGraph = false;
    }

    resetSampleMeanGraph(){
        let vis = this;
        vis.addedSampleGroup = false;
        vis.nSampleMeansSoFar = 0;
        vis.sampleMeans = [];
        vis.showNormalCurve = false;
        vis.resettingSampleMeanGraph = true;

        vis.wrangleData();
        vis.resettingSampleMeanGraph = false;
    }

    addSample(sampleNum){
        let vis = this;
        vis.running = true;
        vis.newVis = false;
        vis.samples.push(sampleNum);
        vis.nSamplesSoFar++;
        vis.readyToPushNewSampleValue = true;
        vis.wrangleData();
        vis.readyToPushNewSampleValue = false;
    }

    addManySamples(samples){
        let vis = this;
        vis.newVis = false;
        vis.recentSample = true;
        for (let i = 0; i < samples.length; i++){
            vis.samples.push(samples[i]);
            vis.nSamplesSoFar++;
        }
        vis.wrangleData();
    }

    addSampleGroup(samples){
        let vis = this;
        vis.addedSampleGroup = true;
        vis.running = false;
        let total = 0;
        for (let i = 0; i < samples.length; i++){
            total += samples[i];
        }
        let _mean = Math.round(thirdGraphMult*total / samples.length)/thirdGraphMult;
        vis.recentSampleMean = _mean;
        vis.sampleMeans.push(thirdGraphMult*_mean);
        vis.nSampleMeansSoFar++;
        vis.readyToPushNewSampleMean = true;
        vis.wrangleData();
        vis.readyToPushNewSampleMean = false;
    }

    updateParams(data1, mean, stdev, distType){
        let vis = this;
        vis.newVis = true;
        vis.data1 = data1;
        vis.mean = mean;
        vis.stdev = stdev;
        vis.distType = distType;
        vis.samples = [];
        vis.sampleMeans = [];
        vis.nSamplesSoFar = 0;
        vis.nSampleMeansSoFar = 0;
        vis.addedSampleGroup = false;
    }

    updateMeanLine(){
        let vis = this;
        vis.svg.select("#meanLine").remove();
        vis.svg.select("#meanLineText").remove();
        let xval = vis.x(numBarsPerUnit*vis.mean);

        ////////////////////////////
        // place vertical line showing actual mean
        vis.svg.append("line")
            .attr("id", "meanLine")
            .attr("x1", xval)
            .attr("y1", -5)
            .attr("x2", xval)
            .attr("y2", vis.height)
        vis.svg.append("text")
            .attr("id", "meanLineText")
            .attr("transform", "rotate(-90)")
            .attr("x", -120)
            .attr("y", xval-6)
            .text("True mean μ")
        ////////////////////////////
    }

    updateCompareLine(){
        let vis = this;
        vis.svg.select("#compareLine").remove();
        vis.svg.select("#compareLineText").remove();
        let xval = vis.x(numBarsPerUnit*myCompareNormalVal);

        ////////////////////////////
        // place vertical line showing compared value
        if (normalOn){
            vis.svg.append("line")
                .attr("id", "compareLine")
                .attr("x1", xval)
                .attr("y1", vis.height2 + vis.padding)
                // .attr("y1", 2*vis.height/3 + vis.padding)
                .attr("x2", xval)
                .attr("y2", vis.height)
            vis.svg.append("text")
                .attr("id", "compareLineText")
                .attr("transform", "rotate(-90)")
                .attr("x", -vis.height-40)
                .attr("y", xval)
                .text("x̄ = " + myCompareNormalVal)
        }
        ////////////////////////////
    }


    ////////////////////////////////////////////////////////////////////////////////
    // NORMAL DISTRIBUTION FOR SAMPLE MEANS

    toggleNormalCurveVisible(){
        let vis = this;
        vis.showNormalCurve = !vis.showNormalCurve;
        vis.wrangleData();
    }

    normalLikelihoodPeak(){
        let _stdev = myStdev*numBarsPerUnit/Math.sqrt(mySampleSize);
        let res = (1/(Math.sqrt(2*Math.PI)*_stdev));
        return res;
    }

    normalLikelihoodFunction(x){
        let vis = this;
        let _stdev = myStdev*numBarsPerUnit/Math.sqrt(mySampleSize);
        let res = (1/(Math.sqrt(2*Math.PI)*_stdev))*Math.exp(-0.5*Math.pow((x - myMean*numBarsPerUnit)/_stdev, 2));
        return d3.max(vis.displayData3Freq) *res / vis.normalLikelihoodPeak();
    }

    normalCDF(x, compareType){
        // source: https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
        let _stdev = myStdev*numBarsPerUnit/Math.sqrt(mySampleSize);
        var z = (x*numBarsPerUnit-myMean*numBarsPerUnit)/Math.sqrt(2*_stdev*_stdev);
        var t = 1/(1+0.3275911*Math.abs(z));
        var a1 =  0.254829592;
        var a2 = -0.284496736;
        var a3 =  1.421413741;
        var a4 = -1.453152027;
        var a5 =  1.061405429;
        var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
        var sign = 1;
        if(z < 0)
        {
            sign = -1;
        }
        if (compareType == "greater than" || compareType == "greater equal than"){
            return 1 - (1/2)*(1+sign*erf);
        }
        else if (compareType == "less than" || compareType == "less equal than"){
            return (1/2)*(1+sign*erf);
        }
        else{
            return -1;
        }
    }

    updateNormalCurve(){
        let vis = this;

        vis.svg.selectAll(".area1").remove();
        vis.svg.selectAll(".area2").remove();
        if (normalOn) {

            vis.normalCurveData1 = [];
            vis.normalCurveData2 = [];
            vis.normalCompareCutoff = null;
            for (let i = 0; i < 100*vis.numBars; i++){
                let _val = vis.normalLikelihoodFunction(i/100);
                if (myCompareType == "greater than" || myCompareType == "greater equal than"){
                    if (i/100 < myCompareNormalVal*numBarsPerUnit){
                        vis.normalCurveData1.push(_val);
                    }
                    else{
                        if (vis.normalCompareCutoff == null){
                            vis.normalCompareCutoff = i;
                        }
                        vis.normalCurveData2.push(_val);
                    }
                }
                else if (myCompareType == "less than" || myCompareType == "less equal than"){
                    if (i/100 < myCompareNormalVal*numBarsPerUnit){
                        vis.normalCurveData2.push(_val);
                    }
                    else{
                        if (vis.normalCompareCutoff == null){
                            vis.normalCompareCutoff = i;
                        }
                        vis.normalCurveData1.push(_val);
                    }
                }
            }

            var areaA = d3.area()
                .x(function (d, i) {
                    return vis.x(i/100);
                })
                .y0(vis.height - vis.padding)
                .y1(function (d, i) {
                    return vis.y3(d);
                });

            var areaB = d3.area()
                .x(function (d, i) {
                    return vis.x((i + vis.normalCompareCutoff)/100);
                })
                .y0(vis.height - vis.padding)
                .y1(function (d, i) {
                    return vis.y3(d);
                });

            if (myCompareType == "greater than" || myCompareType == "greater equal than") {
                vis.svg.append("path")
                    .attr("class", "area1")
                    .attr("d", areaA(vis.normalCurveData1));

                vis.svg.append("path")
                    .attr("class", "area2")
                    .attr("d", areaB(vis.normalCurveData2));
            }
            else if (myCompareType == "less than" || myCompareType == "less equal than"){
                vis.svg.append("path")
                    .attr("class", "area2")
                    .attr("d", areaA(vis.normalCurveData2));

                vis.svg.append("path")
                    .attr("class", "area1")
                    .attr("d", areaB(vis.normalCurveData1));
            }
        }
    }

    getNormalCount(compareVal, compareType){
        let vis = this;
        let res = 0;
        for (let i = 0; i < vis.sampleMeans.length; i++){
            if (compareType=="greater than"){
                if (vis.sampleMeans[i] > compareVal*numBarsPerUnit*thirdGraphMult){
                    res++;
                }
            }
            else if (compareType=="greater equal than"){
                if (vis.sampleMeans[i] >= compareVal*numBarsPerUnit*thirdGraphMult){
                    res++;
                }
            }
            else if (compareType=="less than"){
                if (vis.sampleMeans[i] < compareVal*numBarsPerUnit*thirdGraphMult){
                    res++;
                }
            }
            else if (compareType=="less equal than"){
                if (vis.sampleMeans[i] <= compareVal*numBarsPerUnit*thirdGraphMult){
                    res++;
                }
            }
        }
        return res;
    }
    ////////////////////////////////////////////////////////////////////////////////

}


