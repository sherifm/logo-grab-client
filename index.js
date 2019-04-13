const request     = require('request');
const fs          = require('fs');
const csv         = require('csv-parser');
const csvWriter   = require('csv-write-stream');
//rate limit one request per second. Otherwsie 
const throttle    = require('promise-ratelimit')(4000); 

function getDetections(imageUrl){
  const options = {
    url:  'https://api.logograb.com/detect',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-DEVELOPER-KEY': 'tki5oobnno20l1kilj9th8432ckddnhp785fbs00',
    },
    body:  "mediaUrl="+imageUrl
  };

  return new Promise(function(resolve, reject){
    request.post('https://api.logograb.com/detect', options, function (err, res, body){
      if (res.statusCode==200 && body) {
        resolve (JSON.parse(body).data.detections)
      } else {
        reject(body)
      }
    })
  })
}

const detectionWriter = csvWriter()
const errorWriter = csvWriter()
detectionWriter.pipe(fs.createWriteStream("detections.csv"))
errorWriter.pipe(fs.createWriteStream("error_log.csv"))

fs.createReadStream("frame_urls_100_sample.csv")
  .pipe(csv())
  .on('data', function(row){
    throttle().then(function(){
      const getDetectionsPromise = getDetections(row.imageUrl)
      getDetectionsPromise.then(function(detections){
        detectionWriter.write({name: row.imageUrl, detections: JSON.stringify(detections)})
      }, function(err) {
        errorWriter.write({name: row.imageUrl, error: JSON.stringify(err)})
      }) 
    })
  })
  .on('end',function(){
      //some final operation
  });  