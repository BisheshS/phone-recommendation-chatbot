require('dotenv').config();

var request = require('request');
var querystring = require('querystring');
var Promise = require('promise');

// var reply = 'I want phones from 15000 to 5000'

var reply = 'I want phones with 6gb ram'

var luis_response = getLuisIntent(reply,function(result) {
  var data_result = JSON.parse(result);
  var intent = data_result.topScoringIntent.intent;
  var entity_type= data_result.entities[0].entity;
  console.log(data_result);
  console.log('Intent :',intent);
  console.log('Entity type :',entity_type);
});


function getLuisIntent(utterance,callback) {
    console.log(`------------Inside the intent function---------------`)
    var endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable
    // to df67dcdb-c37d-46af-88e1-8b97951ca1c2, which is the ID
    // of a public sample application.
    var luisAppId = "19e15fa4-d5e9-4055-9267-18544bb158fa";

    // Set the LUIS_SUBSCRIPTION_KEY environment variable
    // to the value of your Cognitive Services subscription key
    var queryParams = {
        "subscription-key": "72356b52dac945e482fe2e69512e5695",
        "timezoneOffset": "0",
        "verbose":  true,
        "q": utterance
    }

    var luisRequest =
        endpoint + luisAppId +
        '?' + querystring.stringify(queryParams);

    request(luisRequest,
        function (err,
            response, body) {
            if (err)
                console.log(err);
            else {
                var data = JSON.parse(body);

                callback(body);
                // top_intent = ${data.topScoringIntent.intent};
                //
                // return []
                // console.log(`Query: ${data.query}`);
                // console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                // console.log('Intents:');
                // console.log(data.intents);
                // console.log(data.entities);
            }
        });
}
