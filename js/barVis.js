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
            .attr("y", -25)
            .attr("x", vis.width / 3)
            .attr("dy", "1.1em")
            .text("Parent population");

        vis.padding = 30;

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        vis.numBars = 24;

        // first chart: population data
        vis.displayData1 = [];

        for (let i = 0; i < vis.numBars; i++){
            vis.displayData1.push(0);
        }

        for (let j = 0; j < vis.data1.length; j++){
            let _val = vis.data1[j];
            if (_val >= 0 && _val < vis.numBars){
                vis.displayData1[_val] += 1;
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
                vis.displayData2Freq[_val]++;
            }
        }

        // third chart: sample means

        vis.displayData3 = [];
        vis.displayData3Freq = [];

        for (let i = 0; i < vis.numBars*2; i++){
            vis.displayData3Freq.push(0);
        }

        for (let j = 0; j < vis.sampleMeans.length; j++){
            let _val = vis.sampleMeans[j];
            if (_val >= 0 && _val < vis.numBars*2){
                vis.displayData3.push(_val);
                vis.displayData3Freq[_val]++;
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

    updateThirdChartTitle(){
        let vis = this;
        vis.svg.select("#sampleMeanLabel").remove();
        vis.svg.append("text")
            .style("font-size", "15px")
            .attr("id", "sampleMeanLabel")
            .attr("y", -5)
            .attr("x", vis.width / 4)
            .attr("dy", "1.1em")
            .attr("transform", "translate(0,"+2*vis.height/3+")")
            .text(() => {
                if (vis.addedSampleGroup){
                    return "Distribution of " + vis.nSampleMeansSoFar + " sample means";
                }
                else{
                    return "Distribution of sample means (run some simulations!)";
                }
            });
    }

    updateSecondChartTitle(){
        let vis = this;
        vis.svg.select("#sampleDataLabel").remove();
        vis.svg.append("text")
            .style("font-size", "15px")
            .attr("id", "sampleDataLabel")
            .attr("y", -5)
            .attr("x", vis.width / 3)
            .attr("dy", "1.1em")
            .attr("transform", "translate(0,"+vis.height/3+")")
            .text(() => {
                if (vis.newVis){
                    return "";
                }
                else if (vis.recentSample){
                    return "Most Recent Sample (x̄ = " + vis.recentSampleMean/4 + ")";
                }
                else if (!vis.running){
                    return "Sample Data (x̄ = " + vis.recentSampleMean/4 + ")";
                }
                else{
                    return "Sample Data";
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
            .domain([0, 24])
            .range([30, vis.width - 30]);

        vis.xDouble = d3.scaleLinear()
            .domain([0, 48])
            .range([30, vis.width - 30]);

        vis.y1 = d3.scaleLinear()
            .domain([0, d3.max(vis.displayData1)])
            .range([vis.height/3 - vis.padding, 0]);

        vis.y2 = d3.scaleLinear()
            .domain([0, d3.max([10, d3.max(vis.displayData2Freq)])])
            .range([2*vis.height/3 - vis.padding, vis.height/3 + vis.padding]);

        vis.y3 = d3.scaleLinear()
            .domain([0, d3.max([10, d3.max(vis.displayData3Freq)])])
            .range([vis.height - vis.padding, 2*vis.height/3 + vis.padding]);

        vis.x_axis = d3.axisBottom()
            .scale(vis.x)
            .ticks(6)
            .tickValues([0, 4, 8, 12, 16, 20, 24])
            .tickFormat(function(d, i) {return d/4;});

        vis.x_axisDouble = d3.axisBottom()
            .scale(vis.xDouble)
            .ticks(6)
            .tickValues([0, 8, 16, 24, 32, 40, 48])
            .tickFormat(function(d, i) {return d/8;});

        vis.y_axis3 = d3.axisLeft()
            .scale(vis.y3)
            .ticks(d3.min([10, d3.max(vis.displayData3Freq)]))
            .tickFormat(d3.format("d"));

        vis.svg.append("g")
            .attr("id", "barGraphXAxis1")
            .attr("transform", "translate(0," + (vis.height/3 - vis.padding)+")")
            .call(vis.x_axis);

        vis.svg.append("g")
            .attr("id", "barGraphXAxis2")
            .attr("transform", "translate(0," + (2*vis.height/3 - vis.padding)+")")
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
                return vis.height/3 - vis.y1(d) - vis.padding;
            });

        bars1.exit().remove();
    }

    updateSampleGraph(){
        let vis = this;
        var xsData = vis.svg.selectAll(".sampleData")
            .data(vis.displayData2);

        let dataCounts = {};
        for (let k = 0; k < 24; k++){
            dataCounts[k] = 0;
        }
        xsData.enter().append("text")
            .attr("class", "sampleData")
            .merge(xsData)
            .attr("x", function(d, i){
                let _x = vis.x(d) - 3.85;
                return _x;
            })
            .transition()
            .attr("y", function(d, i){
                dataCounts[d]++;
                return vis.y2(dataCounts[d]-1);
            })
            .text("x")
        ;
        xsData.exit().remove();

    }

    updateSampleMeanGraph(){
        let vis = this;
        var xsMeans = vis.svg.selectAll(".sampleMean")
            .data(vis.displayData3);

        let meanCounts = {};
        for (let k = 0; k < 48; k++){
            meanCounts[k] = 0;
        }
        xsMeans.enter().append("text")
            .attr("class", "sampleMean")
            .merge(xsMeans)
            .attr("x", function(d, i){
                let _x = vis.xDouble(d) - 3.85/Math.sqrt(Math.sqrt(d3.max(vis.displayData3Freq)));
                return _x;
            })
            .transition()
            .attr("y", function(d, i){
                meanCounts[d]++;
                return vis.y3(meanCounts[d]-1);
            })
            .text("x̄")
            .style("font-size", Math.round(16/Math.sqrt(Math.sqrt(d3.max(vis.displayData3Freq))))+"px")
        ;
        xsMeans.exit().remove();
    }

    addBarText(){
        let vis = this;

        var barValues1 = vis.svg.selectAll(".bar-value1")
            .data(vis.displayData1);

        barValues1.enter().append("text")
            .attr("class", "bar-value1")
            .merge(barValues1)
            .transition()
            .attr("x", function(d, i){return vis.x(i) + Math.sqrt(vis.width/vis.numBars1) + 3;})
            .attr("y", function(d, i){return vis.y1(d) + 10;})
            .attr("fill", "#006fff")
            .text(function(d, i){
                if (d > 0){ return d;}
                else{ return "";}
            });

        barValues1.exit().remove();

        var barValues2 = vis.svg.selectAll(".bar-value2")
            .data(vis.displayData2);

        barValues2.enter().append("text")
            .attr("class", "bar-value2")
            .merge(barValues2)
            .transition()
            .attr("x", function(d, i){return vis.x(i) + Math.sqrt(vis.width/vis.numBars2) + 3;})
            .attr("y", function(d, i){return vis.y2(d) + 10;})
            .attr("fill", "#006fff")
            .text(function(d, i){
                if (d > 0){ return d;}
                else{ return "";}
            });

        barValues2.exit().remove();

        var barValues3 = vis.svg.selectAll(".bar-value3")
            .data(vis.displayData3);

        barValues3.enter().append("text")
            .attr("class", "bar-value3")
            .merge(barValues3)
            .transition()
            .attr("x", function(d, i){return vis.x(i) + Math.sqrt(vis.width/vis.numBars3) + 3;})
            .attr("y", function(d, i){return vis.y3(d) + 10;})
            .attr("fill", "#006fff")
            .text(function(d, i){
                if (d > 0){ return d;}
                else{ return "";}
            });

        barValues3.exit().remove();
    }

    resetSampleGraph(){
        let vis = this;
        vis.newVis = true;
        vis.recentSample = false;
        vis.nSamplesSoFar = 0;
        vis.samples = [];
        vis.wrangleData();
    }

    resetSampleMeanGraph(){
        let vis = this;
        vis.addedSampleGroup = false;
        vis.nSampleMeansSoFar = 0;
        vis.sampleMeans = [];
        vis.showNormalCurve = false;
        vis.wrangleData();
    }

    addSample(sampleNum){
        let vis = this;
        vis.running = true;
        vis.newVis = false;
        vis.samples.push(sampleNum);
        vis.nSamplesSoFar++;
        vis.wrangleData();
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
        let _mean = Math.round(2*total / samples.length)/2;
        vis.recentSampleMean = _mean;
        vis.sampleMeans.push(2*_mean);
        vis.nSampleMeansSoFar++;
        vis.wrangleData();
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
        // vis.wrangleData();
    }

    updateMeanLine(){
        let vis = this;
        vis.svg.select("#meanLine").remove();
        vis.svg.select("#meanLineText").remove();
        let xval = vis.x(4*vis.mean);

        ////////////////////////////
        // place vertical line showing actual mean
        vis.svg.append("line")
            .attr("id", "meanLine")
            .attr("x1", xval)
            .attr("y1", -5)
            .attr("x2", xval)
            .attr("y2", vis.height)
            // .style("stroke-width", 1.5)
            // .style("stroke", "#25fc5a")
        vis.svg.append("text")
            .attr("id", "meanLineText")
            .attr("transform", "rotate(-90)")
            .attr("x", -120)
            .attr("y", xval-6)
            .text("True mean μ")
            // .style("font-size", 12)
            // .style("stroke-width", 0.5)
            // .style("stroke", "#25fc5a")
        ////////////////////////////
    }

    updateCompareLine(){
        let vis = this;
        vis.svg.select("#compareLine").remove();
        vis.svg.select("#compareLineText").remove();
        let xval = vis.x(4*myCompareNormalVal);

        ////////////////////////////
        // place vertical line showing compared value
        if (normalOn){
            vis.svg.append("line")
                .attr("id", "compareLine")
                .attr("x1", xval)
                .attr("y1", 2*vis.height/3 + vis.padding)
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

    toggleNormalCurveVisible(){
        let vis = this;
        vis.showNormalCurve = !vis.showNormalCurve;
        vis.wrangleData();
    }

    normalLikelihoodPeak(){
        let _stdev = myStdev/Math.sqrt(mySampleSize);
        let res = (1/(Math.sqrt(2*Math.PI)*_stdev));
        return res;
    }

    normalLikelihoodFunction(x){
        let vis = this;
        let _stdev = myStdev/Math.sqrt(mySampleSize);
        let res = (1/(Math.sqrt(2*Math.PI)*_stdev))*Math.exp(-0.5*Math.pow((x - myMean*4)/_stdev, 2));
        return d3.max(vis.displayData3Freq) *res / vis.normalLikelihoodPeak();
    }

    normalCDF(x, compareType){
        // source: https://stackoverflow.com/questions/5259421/cumulative-distribution-function-in-javascript
        let _stdev = myStdev/Math.sqrt(mySampleSize);
        var z = (x*4-myMean*4)/Math.sqrt(2*_stdev*_stdev);
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
            for (let i = 0; i < 2400; i++){
                let _val = vis.normalLikelihoodFunction(i/100);
                if (myCompareType == "greater than" || myCompareType == "greater equal than"){
                    if (i/100 < myCompareNormalVal*4){
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
                    if (i/100 < myCompareNormalVal*4){
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
                if (vis.sampleMeans[i] > compareVal*8){
                    res++;
                }
            }
            else if (compareType=="greater equal than"){
                if (vis.sampleMeans[i] >= compareVal*8){
                    res++;
                }
            }
            else if (compareType=="less than"){
                if (vis.sampleMeans[i] < compareVal*8){
                    res++;
                }
            }
            else if (compareType=="less equal than"){
                if (vis.sampleMeans[i] <= compareVal*8){
                    res++;
                }
            }
        }
        return res;
    }

}

