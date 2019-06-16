var myNS = myNS || {
    flags : {}
}; //namespace
const defaultpts = 6800;
const defaultmsg = "00'00\"00";
document.getElementById("showArea").innerHTML = defaultmsg;

//keydown code
document.onkeydown = keydown;
//when onkeydown event occur, function "keydown" is executed.
function keydown(){
    if(event.keyCode == 13){//enter
        if(myNS.flags.runflag !== void 0){
            stop();
        }else{
            start();
            myNS.flags.sumflag = 0;
            myNS.params.runhour = 0;
            myNS.params.misscount = [0,0,0];
            myNS.info.meanlap = 0;
            myNS.recordinhour = [];
        }
    }else if(event.keyCode == 32 && myNS.flags.runflag == 1){//space
        Promise.resolve(lap())
        .then(displayLap)
        .then(checkLap);
    }else if(event.keyCode == 77){//m
        switchMessage();
    }
}
//keydown end

//convert time to string code
function convertTime(lapinmillisec){
    var sec100 = Math.floor((lapinmillisec % 1000 )/ 10);
    var sec = parseInt((lapinmillisec / 1000) % 60, 10);
    var min = parseInt((lapinmillisec / (1000 * 60)) % 60, 10);
    var msg = addzero(min) + "'" + addzero(sec) + "\"" + addzero(sec100);
    return msg;
}
//convert time to string end

//addzero code
function addzero(num){
    if(num < 10){
        ret = "0" + num;
    }else{
        ret = num;
    }
    return ret;
}
//addzero end

//count misses code
function countMiss(button){
    myNS.params.misscount[button]++;
    document.activeElement.blur();
}
//count misses end


//timer start code
function start(){
    document.getElementById("messageArea").innerHTML = "";
    myNS.params = {};
    myNS.params.launchTime = new Date().getTime();
    myNS.timers = {
        laptimer : setInterval('showSec(myNS.params.launchTime)',10),
        clocktimer : setInterval('showTimeNow()', 1000)
    }
    myNS.flags.runflag = 1;
    myNS.info = {
        lapnum : 0,
        bestlap : 999.99,
        worstlap : 0.00,
    }
    myNS.record = [];
}
//timer start end

//show laptime code
function showSec(time){
    var diff = new Date().getTime() - time;
    var msg = convertTime(diff);
    document.getElementById("showArea").innerHTML = msg;
}
//show laptime end

//show nowTime start
function showTimeNow(){
    var nowTime = new Date();
    document.getElementById("dateArea").innerHTML = nowTime.toLocaleString();
    /*
    if(nowTime.getMinutes() === 59 && sumflag === 0){
        myNS.flags.sumflag = 1;
        myNS.params.runhour++;
        Promise.resolve(hourSummeryPrePare(myNS.params.runhour))
        .then(function(hoursum){
            myNS.recordinhour.push(hoursum);
            return hoursum;
        })
        .then(hourSummeryDisplay)
        .then(displayMessage);
    }else if(nowTime.getMinutes() === 0 && sumflag === 1){
        myNS.flags.sumflag = 0;
        myNS.params.misscount = [0,0,0];
    }
    */
    //for debug
    
    if(nowTime.getSeconds() === 1 && myNS.flags.sumflag === 0){
        myNS.flags.sumflag = 1;
        myNS.params.runhour++;
        Promise.resolve(hourSummeryPrePare(myNS.params.runhour))
        .then(function(hoursum){
            myNS.recordinhour.push(hoursum);
            return hoursum;
        })
        .then(hourSummeryDisplay)
        .then(displayMessage);
    }else if(nowTime.getSeconds() === 2 && myNS.flags.sumflag === 1){
        myNS.flags.sumflag = 0;
        myNS.params.misscount = [0,0,0];
    }
    
}
//show nowTime end

//summerize 60min code
function hourSummeryPrePare(thishour){
    console.log('thishour:'+thishour);
    var hourrec = myNS.record.filter(array => array[1] === (thishour-1));
    var hourmeanlap = function(arr) {
        var sum = 0;
        arr.forEach(function(elm) {
            sum += elm[0];
        });
        return Math.round(sum/arr.length*1000)/1000;
    }; 
    var hoursum = [hourrec.length, hourrec.length*defaultpts, hourmeanlap(hourrec)].concat(myNS.params.misscount);
    return hoursum;
}
//summerize 60min end

//display summery code
function hourSummeryDisplay(sum){
    if(sum[0] > 0){
        var diff = sum[2];
        var lapmsg = convertTime(diff*1000);
        var nowTime = new Date();
        var msg = nowTime.getHours()+ "時までの1時間まとめ<br>  平均Lap : " + lapmsg + "<br>";
        msg += "  時速 : "+ sum[1] + "pts/H<br>"
        msg += "  誤答 : " +sum[3]+ "回<br>立ち回りミス : " +sum[4]+ "回<br>リタイア : " +sum[5]+ "回";
    }else{
        msg = "No running in previous hour!"
    }
    console.log(msg);
    myNS.flags.msgflag = 0;
    return msg
}
//display summery end

// stop timer code
function stop(){
    if(window.confirm('Are you sure to stop the timer?')){
        Promise.resolve(console.log('[DEBUG]'+myNS))
        .then(hourSummeryPrePare)
        .then(function(hoursum){
            myNS.recordinhour.push(hoursum);
        })
        .then(saveornot)
        .then(reset);
	}
}
//stop timer end

//save records code
function saveornot(){
    if(window.confirm('Do you want to save these records?')){
        // https://www.indetail.co.jp/blog/12150/
        var csv = [];
        myNS.record.forEach(function (time, index){
            csv.push((index+1) + ',' + time.join(','));// for the case myNS.record include array(for hour flag etc)
        });
        console.log(csv);
        var element = document.createElement('a');
        element.href = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv.join('\n'));
        element.setAttribute('download', 'lapdata.csv');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        var csv2 = [];
        myNS.recordinhour.forEach(function (time, index){
            csv2.push((index) + ',' + time.join(','));// for the case myNS.record include array(for hour flag etc)
        });
        console.log(csv2);
        var element2 = document.createElement('a');
        element2.href = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv2.join('\n'));
        element2.setAttribute('download', 'sumdata.csv');
        document.body.appendChild(element2);
        element2.click();
        document.body.removeChild(element2);
    }
}
//save records end

//reset timer code
function reset(){
    clearInterval(myNS.timers.clocktimer);
    clearInterval(myNS.timers.laptimer);

    document.getElementById("showArea").innerHTML = defaultmsg;
    document.getElementById("showLapArea").innerHTML = "";
    document.getElementById("dateArea").innerHTML = "";
    document.getElementById("messageArea").innerHTML = "";
    myNS = {
        flags : {}
    };
}
//reset timer end

//calculate laptime code
function lap(){
    myNS.info.lapnum++;
    var lapTime = new Date().getTime();
    var diff = lapTime - myNS.params.launchTime;//laptime in millisec
    var difflap = diff/1000.0;//laptime in sec
    myNS.params.launchTime = lapTime;//for next calculation
    myNS.record.push([difflap,myNS.params.runhour]);
    return [diff,myNS.info.lapnum];
}
//calculate laptime end

//display laptime code
function displayLap(param){
    var lapmsg = convertTime(param[0]);
    var lapArea = document.getElementById("showLapArea");
    var makeli = document.createElement("li");
    makeli.innerHTML = "LAP "+ param[1] + " : " +lapmsg;
    lapArea.append(makeli);
    lapArea.scrollTo(0, makeli.offsetTop);
    return param[0]/1000.0;
}
//display laptime end

//check laptime (best/worst) code
function checkLap(thislap){//in second
    var newrecflag = 0;
    if(myNS.info.lapnum === 1){
        myNS.info.bestlap = thislap;
        myNS.info.worstlap = thislap;
    }else{
        if(myNS.info.bestlap > thislap){
            myNS.info.bestlap = thislap;
            newrecflag = 1;
        }else if(myNS.info.worstlap < thislap){
            myNS.info.worstlap = thislap;
            newrecflag = 1;
        }
    }
    if(newrecflag === 1){
        Promise.resolve(displayRecord())
        .then(displayMessage);
    }
}
//check laptime end

//display record code
function displayRecord(){
    var msg = "Best Laptime  : "+convertTime(myNS.info.bestlap*1000)+"<br>";
    msg += "Worst Laptime : " + convertTime(myNS.info.worstlap*1000);
    myNS.flags.msgflag = 1;
    return msg;
}
//display record end

//edit lap code
function editLap(){
    document.activeElement.blur();
    var parsePromptMsg = function(defaultexp,defaultvalue){
        var test = prompt("\"" + defaultexp + "\"",defaultvalue);
        return parseInt(test,10);
    }

    var editlap = parsePromptMsg('where to edit?');
    var howmanylap = parsePromptMsg('how many lost your laps?')+1;

    if(editlap > 0 && editlap < myNS.record.length+1 && howmanylap > 1){
        var newlap = Math.round(myNS.record[editlap-1][0]/howmanylap*1000)/1000;
        for(var i=0;i<howmanylap;i++){
            var newrec = [newlap,myNS.record[editlap-1][1]];
            myNS.record.splice((i+editlap),0,newrec);//add modified lap
        }
        myNS.record.splice((editlap-1),1);//remove editlap origin
        myNS.info.lapnum += (howmanylap-1);

        editDisplay();
        if(myNS.record[editlap-1][1] < myNS.params.runhour){
            editSummery();
        }    
    }
}
//edit lap end

//edit display code
function editDisplay(){
    //initialize
    document.getElementById("showLapArea").innerHTML = "";
    myNS.info.bestlap = 999.99;
    myNS.info.worstlap = 0.00;

    myNS.record.forEach((val,index) => {
        Promise.resolve(displayLap([val[0]*1000,index+1]))
        .then(checkLap);
    });
}
//edit display end

//edit hour summery code
function editSummery(){
    myNS.recordinhour.forEach((val,index) => {
        Promise.resolve(hourSummeryPrePare(index+1))
        .then(function(newsum){
            Array.prototype.splice.apply(val,[0,3].concat(newsum.splice(0,3)));
            //https://qiita.com/seihmd/items/dfeb41e12d693c9d4d7c
            //https://qiita.com/ArcCosine@github/items/12699ecb7ac40b0956c9
        })
    })
}
//edit hour summery end

//display message code
function displayMessage(msg){
    var message = document.createElement("p");
    $("#messageArea").empty();
    message.innerHTML = msg;
    $("#messageArea").append(message);
}
//display message end

//switch message code
function switchMessage(){
    var switchmsg;
    if(myNS.flags.msgflag === 0){
        switchmsg = displayRecord();
    }else{
        switchmsg = hourSummeryDisplay(myNS.recordinhour[myNS.params.runhour-1])
    }
    displayMessage(switchmsg);
}
