var myNS = myNS || {
    flags : {}
}; //namespace
const defaultpts = 6800;
const defaultmsg = "00'00\"00";
document.getElementById("showArea").innerHTML = defaultmsg;


var lapinhour = [];
var laptofile = [];
var suminhour = new Array(6);//周回数 時速 平均ラップ 誤答 立ち回りミス リタ
var sumtofile = [];
var sumflag = 0;// 0 -> not summerized yet, 1 -> already summerized
var msgflag = -1; //0 -> encourge, 1 -> best, 2 -> worst, 3 -> summery of hours
var recflag; //0 -> not record, 1 -> best lap, -1 -> worst lap
var meanlap;

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
            myNS.recordinhour = [];
        }
    }else if(event.keyCode == 32 && myNS.flags.runflag == 1){//space
        Promise.resolve(lap())
        .then(displayLap)
        .then(checkLap);
    }else if(event.keyCode == 77){//m
        displayMassage();
    }
}
//keydown end

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
    document.getElementById("massageArea").innerHTML = "";
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
    var sec100 = Math.floor((diff % 1000 )/ 10);
    var sec = parseInt((diff / 1000) % 60, 10);
    var min = parseInt((diff / (1000 * 60)) % 60, 10);

    var msg = addzero(min) + "'" + addzero(sec) + "\"" + addzero(sec100);
    document.getElementById("showArea").innerHTML = msg;
}
//show laptime end

//show nowTime start
function showTimeNow(){
    var nowTime = new Date();
    var datemsg = nowTime.toLocaleString();
    document.getElementById("dateArea").innerHTML = datemsg;
    /*
    if(nowTime.getMinutes() === 59 && sumflag === 0){
        myNS.flags.sumflag = 1;
        myNS.params.runhour++;
        hourSummeryPrePare();
        //さまり機能呼び出し
    }else if(nowTime.getMinutes() === 0 && sumflag === 1){
        myNS.flags.sumflag = 0;
        myNS.params.misscount = [0,0,0];
    }
    */
    //for debug
    
    if(nowTime.getSeconds() === 1 && myNS.flags.sumflag === 0){
        myNS.flags.sumflag = 1;
        myNS.params.runhour++;
        hourSummeryPrePare();
    }else if(nowTime.getSeconds() === 2 && myNS.flags.sumflag === 1){
        console.log('hoge')
        myNS.flags.sumflag = 0;
        myNS.params.misscount = [0,0,0];
    }
    
}
//show nowTime end

//summerize 60min code
function hourSummeryPrePare(){
    console.log(myNS.record);
    var hourrec = myNS.record.filter(array => array[1] === (myNS.params.runhour-1));
    console.log(hourrec);
    var meanlap = function(arr) {
        var sum = 0;
        arr.forEach(function(elm) {
            sum += elm[0];
        });
        return sum/arr.length;
    }; 
    var hoursum = [hourrec.length, hourrec.length*defaultpts, meanlap(hourrec)].concat(myNS.params.misscount);
    myNS.recordinhour.push(hoursum);
}
//summerize 60min end

// stop timer code
function stop(){
    if(window.confirm('Are you sure to stop the timer?')){
        Promise.resolve(console.log(myNS))//デバッグ用に名前空間
//        .then(hourSummeryPrePare)
        .then(saveornot)
        .then(reset);
	}
}
//stop timer end

//save records code
function saveornot(){
    if(window.confirm('Do you want to save these records?')){
//        download(laptofile);
        //参考 https://www.indetail.co.jp/blog/12150/
        var csv = [];
        myNS.record.forEach(function (time, index) {
            //csv.push(index + ',' + time);
            csv.push((index+1) + ',' + time.join(','));// for the case myNS.record include array(for hour flag etc)
        });
        console.log(csv);
        var element = document.createElement('a');
        element.href = 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv.join('\n'));
        element.setAttribute('download', 'lapdata.csv');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
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
    document.getElementById("massageArea").innerHTML = "";
    myNS = {
        flags : {}
    };
    msgflag = -1;
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
    return diff;
}
//calculate laptime end

//display laptime code
function displayLap(diff){
    var sec100 = Math.floor((diff % 1000 )/ 10);
    var sec = parseInt((diff / 1000) % 60, 10);
    var min = parseInt((diff / (1000 * 60)) % 60, 10);
    var lapmsg = addzero(min) + "'" + addzero(sec) + "\""+ addzero(sec100);

    var lapArea = document.getElementById("showLapArea");
    var makeli = document.createElement("li");
    makeli.innerHTML = "LAP "+ myNS.info.lapnum + " : " +lapmsg;
    lapArea.append(makeli);
    lapArea.scrollTo(0, makeli.offsetTop);
    return diff/1000.0;
}
//display laptime end

//check laptime (best/worst) code
function checkLap(thislap){
    if(myNS.info.lapnum === 1){
        myNS.info.bestlap = thislap;
        myNS.info.worstlap = thislap;
        recflag = 0;
    }else{
        if(myNS.info.bestlap > thislap){
            myNS.info.bestlap = thislap;
            recflag = 1;
        }else if(myNS.info.worstlap < thislap){
            myNS.info.worstlap = thislap;
            recflag = -1;
        }
    }                   
}
//check laptime end



//残りメッセージ類だけ
//とりあえず上と分離
function lapmessage(){
    if(recflag === 1){
        msgflag = 1;
        createMassage(msgflag);
        var congmsg = document.createElement("p");
        congmsg.className = "onetime";
        $(".onetime").remove();
        congmsg.innerHTML = "おめでとう！best lap更新だよ！"
        $("#massageArea").append(congmsg);
        document.getElementsByClassName("topyachiyo")[0].src = "yachiyo/201503_yachiyo_happy.png";
    }else if(recflag === -1){
        msgflag = 2;
        createMassage(msgflag);
        document.getElementsByClassName("topyachiyo")[0].src = "yachiyo/201503_yachiyo_sad.png";
        var consmsg = document.createElement("p");
        consmsg.className = "onetime";
        $(".onetime").remove();
        consmsg.innerHTML = "残念...worst lapだよ...引きずらないで次頑張れ！"
        $("#massageArea").append(consmsg);
    }else{
        $(".onetime").remove();
        document.getElementsByClassName("topyachiyo")[0].src = "yachiyo/201503_yachiyo_surprise.png";        
    }
}



//set message from yachiyo start
function displayMassage(){
    msgflag++;
    if(msgflag === 4){msgflag = 0;}
    createMassage(msgflag);
}
document.getElementById("imgArea").addEventListener("click", displayMassage);

function createMassage(int){
    document.getElementsByClassName("topyachiyo")[0].src = "yachiyo/201503_yachiyo_surprise.png";
    var message = document.createElement("p");
    $("#massageArea").empty();
    if(int === 0){
        message.innerHTML = "あなたの力には、期待しているから。";
        message.style.textAlign = "right";
        $("#massageArea").append(message);
    }else if(int === 1){
        message.innerHTML = "Best lap : " + displayBestLap();
        $("#massageArea").append(message);
    }else if(int === 2){
        message.innerHTML = "Worst lap : " + displayWorstLap();
        $("#massageArea").append(message);
    }else if(int === 3){
        message.innerHTML = hourSummeryDisplay();
        $("#massageArea").append(message);
    }
}
//set message from yachiyo end

//prepare to display best/worst lap start
function displayBestLap(){
    if(document.getElementsByClassName("bestLap")[0]){
        return document.getElementsByClassName("bestLap")[0].innerText.split(": ")[1];
    }else{
        return "";
    }
}
function displayWorstLap(){
    if(document.getElementsByClassName("worstLap")[0]){
        return document.getElementsByClassName("worstLap")[0].innerText.split(": ")[1];
    }else{
        return "";
    }
}
//prepare to display best/worst lap end

//prepare and display an hour summery start周回数、時速、平均、３ボタン
function hourSummeryDisplay(){
    var i = sumtofile.length - 1;
    if(sumtofile[i][2]){
        var sec100 = parseInt((String(sumtofile[i][2]).split(".")[1]).slice(0,2));
        var sec = parseInt(sumtofile[i][2])%60;
        var min = (parseInt(sumtofile[i][2]) - sec)/60;
        var msg = i + "時-" + (i+1) + "時まとめ<br>平均Lap : " + min + "'" + addzero(sec) + "\"" + addzero(sec100) + "<br>";
        msg += "誤答 : " + "回 立ち回りミス : " + "回 リタイア : " + "回<br>";
        msg += "時速 : "+ sumtofile[i][1] + "pts/hour"     
    }else{
        msg = "No running in previous hour!"
    }
    return msg
}
//prepare and display an hour summery end

//saveornot の中の処理でできるため以下不要
/*
//get laptimelist start
function download(data){
    var blob = new Blob(data, {type: "text/plain"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = 'test.dat';
    a.click();
}
//get laptimelist end
*/