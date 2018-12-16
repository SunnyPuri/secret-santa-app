const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const nodemailer = require('nodemailer');
const shuffle = require('shuffle-array');
const app = express();
const path = require('path');
const cors = require('cors');
const port = process.env.PORT || 3000;

const fs = require('fs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(cors());


let names = "";
let santa;

let phoneList = {};

app.get('/', function (req, res) {
    res.json({
        "info": "Contact Administrator"
    });
});




app.post('/uploadNames', (req, res)=>{
    names = req.body;
    
    for(let x of names){
        let {name, phone} = x;
        phoneList[phone] = name;
    }
    
    let banta = names.map(name => name.phone);
    shuffle(banta);

    santa = {};
    banta.forEach((n,i,x) => i<x.length-1 ? 
        santa[x[i]] = x[i+1] : santa[x[i]] = x[0]
    );
    
    names.forEach(name => {
        name.santa = phoneList[santa[name.phone]];
    });

    fs.writeFileSync('secrets.json', JSON.stringify(names));  

    return res.json({
        data: "Uploaded Successfully"
    });
});


app.post('/sendSantaList', (req, res)=>{

    readFile("secrets.json").then((data)=>{
        
        data.forEach(x => {
            sendSMS(x.phone, x.santa, true).then((data) => {
                console.log(data);
            });
        });
        
        res.json(data);
    });

});


app.post('/generateOTP', (req, res) => {

    let phone = req.body.phone;
    let otp = generateOTP(phone);

    sendSMS(phone, otp).then((data) => {
        res.json({
            status: "Send Successfully!"
        });
    });

    

});

app.post('/matchOTP', (req, res) =>{
    let phone = req.body.phone;
    let generatedOTP = generateOTP(phone);
    let otp = req.body.otp;

    if(otp == generatedOTP){
        readFile("secrets.json").then((data)=>{
            let santa = data.filter((x => x.phone == phone))[0].santa;
            
            res.json({
                santa
            })
        });
    }
});


app.get('/readSantaFile', (req, res) => {

    readFile("secrets.json").then((data)=>{
        res.json(data);
    });

})



app.post('/sms',(req,res,next)=>{
    
    console.log(req.body);
    var toNumber = req.body.toNumber;
    var msg = req.body.msg;
    
    var username = 'sunsunny.com@gmail.com';
    var hash = 'bd2488522903b14102151f76b1072789a6d1370db6b5f221b40a64ecd1a02185'; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
    var sender = 'txtlcl';
    var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg.split(' ').join('%20');
    var options = {
      host: 'api.textlocal.in', path: '/send?' + data
    };
    callback = function (response) {
      var str = '';//another chunk of data has been recieved, so append it to `str`
      response.on('data', function (chunk) {
        str += chunk;
      });//the whole response has been recieved, so we just print it out here
      response.on('end', function () {
        res.json(str);
      });
    }//console.log('hello js'))
    http.request(options, callback).end();//url encode instalation need to use $ npm install urlencode*/
    
});

let readFile = (file) => {
    
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => {  
            if (err) throw err;
            let result = JSON.parse(data);
    
            resolve(result);
        });
    });
    
}

let sendSMS = (toNumber, santa, flag = false) => {
    if(flag){
        var msg = `You are Santa of ${santa}`;
    }else{
        var msg = `Your OTP is ${santa}`;
    }
    
    var username = 'sunsunny.com@gmail.com';
    var hash = 'bd2488522903b14102151f76b1072789a6d1370db6b5f221b40a64ecd1a02185'; // The hash key could be found under Help->All Documentation->Your hash key. Alternatively you can use your Textlocal password in plain text.
    var sender = 'txtlcl';
    var data = 'username=' + username + '&hash=' + hash + '&sender=' + sender + '&numbers=' + toNumber + '&message=' + msg.split(' ').join('%20');
    var options = {
      host: 'api.textlocal.in', path: '/send?' + data
    };

    return new Promise((resolve, reject) => {
        
        callback = function (response) {
          var str = '';//another chunk of data has been recieved, so append it to `str`
          response.on('data', function (chunk) {
            str += chunk;
          });//the whole response has been recieved, so we just print it out here
          response.on('end', function () {
            //res.json(str);
            resolve("Done");
          });
        }//console.log('hello js'))
        http.request(options, callback).end();//url encode instalation need to use $ npm install urlencode*/
    });
}

let generateOTP = (phone) => {
    
    let currentTime = new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate()).getTime();
    let hash = Number(currentTime) - Number(phone)+"";
    let otp = hash[hash.length-4]+hash[hash.length-3]+hash[hash.length-2]+hash[hash.length-1];
    return otp;
}

const server = app.listen(port, function () {
    console.log('Server listening at http://' + server.address().address + ':' + server.address().port);
});


