var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");


// app-ID = 19e15fa4-d5e9-4055-9267-18544bb158fa
// azure_key = 72356b52dac945e482fe2e69512e5695

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: '',
    appPassword: '',
    openIdMetadata: ''
});

// Listen for messages from users
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot.
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// var tableName = 'botdata';
// var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
// var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
// This default message handler is invoked if the user's utterance doesn't
// match any intents handled by other dialogs.
var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send('You reached the default message handler. You said \'%s\'.', session.message.text);
});

// bot.set('storage', tableStorage);

// Make sure you add code to validate these fields
var luisAppId = "19e15fa4-d5e9-4055-9267-18544bb158fa";
var luisAPIKey = "72356b52dac945e482fe2e69512e5695";
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

// Add a dialog for each intent that the LUIS app recognizes.
// See https://docs.microsoft.com/en-us/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis
bot.dialog('Greetings',[
  function (session) {
    session.beginDialog('GreetingDialog');
  },
  function (session, results) {
    session.endDialog('This is the end of Greetings Dailog', results.response);
  }
]);

bot.dialog('GreetingDialog',[
    function(session) {
        session.send('Hi ! Welcome to Phoneboi chatbot!');
        builder.Prompts.text(session, 'Please enter your name for more personalised experience');
    },
    function(session, results) {
        session.send('Welcome, %s', results.response);
        // session.send('We will assist you in buying/suggesting phones of your choice \
        // <br/> So, tell us about what you want ?');
        builder.Prompts.text(session,'e.g \'which are the best selling phones currently..\'');
    },
    function(session,results) {
        var user_reply_when_greeted = results.response;
        //taking the results (replies) from session and
        //making a callback--undefined error to getLuisIntent and inside that function\
        var luis_response = getLuisIntent(user_reply_when_greeted,function(result) {
          var intent = result.topScoringIntent.intent;
          var entity_type= result.entities;
          console.log(result);
          console.log('Intent :',intent);
          console.log('Entity type :',entity_type);
          //Trigger dialogs according to the intent of the conversation
          if(intent == 'cheap'){
            session.beginDialog('cheapDialog_2');
          }
          else if(intent == 'high_rated'){
            session.beginDialog(high_ratedDialog2);
          }
          else if(intent == 'phone'){
            session.beginDialog(any_phoneDialog2);
          }
           //else if(intent == 'color'){
          //   beginDialog()
          // }


        });
        // console.log(session.dialogData.intent_class);

        session.endDialog('Thank you for your response');
    }
]).triggerAction({
    matches: 'Greeting'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('You reached the Help intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send('You reached the Cancel intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Cancel'
})

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for Cheap Phones --- intent = cheap
bot.dialog('cheapDialog_2',[
  function(session) {
    session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('cheapDialog');
  }
]).triggerAction({
    matches: 'cheap'
})

// //array for storing all the names of the phones_below_5k
// session.conversationData.sasta_phone= new Array();



bot.dialog('cheapDialog',[
    function(session) {

        session.send('Here are a list of phones which are below Rs.5000');
        //Read phones under 5000 from JSON file
        const fs = require('fs');
        fs.readFile('phones_below_5k.json',(err,data)=>{
          if(err) throw err;
          var obj = JSON.parse(data);
          var main, name_temp;
          //array for storing all the names of the phones_below_5k
          session.conversationData.sasta_phone_names= new Array();
          session.conversationData.sasta_phone_prices= new Array();
          session.conversationData.sasta_phone_ratings= new Array();

          for(main in obj){
            for(name_temp in obj[main]){
              var phone = obj[main][name_temp].name;
              var phone_price = obj[main][name_temp].price;
              var phone_rating = obj[main][name_temp].ratings;
              console.log(phone);
              // session.dialogData.names = phone;
              // session.dialogData.prices = phone_price;
              // session.dialogData.ratings = phone_rating;
              //---------------------------------------------
              //Pushing the phones below 5k in the arrays
              session.conversationData.sasta_phone_names.push(phone);
              session.conversationData.sasta_phone_prices.push(phone_price);
              session.conversationData.sasta_phone_ratings.push(phone_price);


              //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
              // <br/>Ratings: ${session.dialogData.ratings}`);
            }
          }
          //Making the arrays session variables for future use
          sasta_phone_names = session.conversationData.sasta_phone_names;
          sasta_phone_prices = session.conversationData.sasta_phone_prices;
          sasta_phone_ratings = session.conversationData.sasta_phone_ratings;

          //printing protoype of json ka kuch bhi data
          var output = '';
          var i;
          for (i=0; i < sasta_phone_names.length; i++){
            output = output + "<br/>" + sasta_phone_names[i]+"<br/>";
          }
          session.send(output);


          builder.Prompts.text(session, 'What features do you want ?');
        })
      }, function(session,results) {
          var user_reply_when_greeted = results.response;
          //taking the results (replies) from session and
          //making a callback--undefined error to getLuisIntent and inside that function\
          var luis_response = getLuisIntent(user_reply_when_greeted,function(result) {
            var intent = result.topScoringIntent.intent;
            var entity_type= result.entities;
            console.log(result);
            console.log('Intent :',intent);
            console.log('Entity type :',entity_type);
            //Trigger dialogs according to the intent of the conversation
            if(intent == 'cheap'){
              session.beginDialog(cheapDialog_2);
            }
            else if(intent == 'high_rated'){
              session.beginDialog(high_ratedDialog2);
            }
            else if(intent == 'phone'){
              session.beginDialog(any_phoneDialog2);
            }
            else if(intent == 'budget'){
              session.beginDialog(budgetDailog2);
            }
            // else if(intent == 'color'){
            //   beginDialog()
            // }


          });
          // console.log(session.dialogData.intent_class);

          session.endDialog('Thank you for your response');
      }
])



//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for any phones ---intent = phone

bot.dialog('any_phoneDialog2',[
  function(session) {
    // session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('any_phoneDialog');
  }
]).triggerAction({
    matches: 'phone'
})


bot.dialog('any_phoneDialog',[
  function(session) {
    // session.conversationData.x = {};
    builder.Prompts.text(session,"If you could tell me specific requirements like\
    <br/> 1. I want a phone which is black in color <br/> 2. Only high rated phones\
    <br/> 3. I have budget constraints");
  },
  function(session,results) {
    var user_reply_any_phone = results.response;
    var luis_response = getLuisIntent(user_reply_any_phone,function(results) {
      luis_response = results;
    });
    session.log(results);

  }
])



//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for any phones ---intent = phone
bot.dialog('high_ratedDialog2',[
  function(session) {
    // session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('high_ratedDialog');
  }
]).triggerAction({
    matches: 'high_rated'
})


bot.dialog('high_ratedDialog',[
    function(session) {
        //Read phones under 5000 from JSON file
        const fs = require('fs');
        fs.readFile('run_results_high_rated.json',(err,data)=>{
          if(err) throw err;
          var obj = JSON.parse(data);
          var main, name_temp;
          //array for storing all the names of the high rated phones
          session.conversationData.high_rated_phone_names= new Array();
          session.conversationData.high_rated_phone_prices= new Array();
          session.conversationData.high_rated_phone_ratings= new Array();

          for(main in obj){
            for(name_temp in obj[main]){
              var phone = obj[main][name_temp].name;
              var phone_price = obj[main][name_temp].price;
              var phone_rating = obj[main][name_temp].ratings;
              console.log('+++++++++++++++++++++++++++++++++++++++++++++++',phone);
              // session.dialogData.names = phone;
              // session.dialogData.prices = phone_price;
              // session.dialogData.ratings = phone_rating;
              //---------------------------------------------
              //Pushing the phones below 5k in the arrays
              session.conversationData.high_rated_phone_names.push(phone);
              session.conversationData.high_rated_phone_prices.push(phone_price);
              session.conversationData.high_rated_phone_ratings.push(phone_price);
              //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
              // <br/>Ratings: ${session.dialogData.ratings}`);
            }
          }
          //Making the arrays session variables for future use
          high_rated_phone_names = session.conversationData.high_rated_phone_names;
          high_rated_phone_prices = session.conversationData.high_rated_phone_prices;
          high_rated_phone_ratings = session.conversationData.high_rated_phone_ratings;
          console.log('CODE NOT WORKING WHYYYYYYYYYYYYYYYYY',high_rated_phone_names);
          session.send('Here are some options');
          //printing protoype of json ka kuch bhi data
          var output = '';
          var i;
          for (i=0; i < high_rated_phone_names.length; i++){
            output = output + "<br/>" + high_rated_phone_names[i];
          }
          session.send(output);


          builder.Prompts.text(session, 'What features do you want explicitly ?');
        })
      },
      function(session,results) {
        var user_reply_when_greeted = results.response;
        //taking the results (replies) from session and
        //making a callback--undefined error to getLuisIntent and inside that function\
        var luis_response = getLuisIntent(user_reply_when_greeted,function(result) {
          var intent = result.topScoringIntent.intent;
          var entity_type= result.entities;
          console.log(result);
          console.log('Intent :',intent);
          console.log('Entity type :',entity_type);
        });
        session.log(results);
      }
])


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for any phones ---intent = phone
bot.dialog('colorDialog2',[
  function(session) {
    // session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('colorDialog');
  }
]).triggerAction({
    matches: 'color'
})




bot.dialog('colorDialog',[
    function(session) {
        //function variables for concatenating all the data

        var reply= session.message.text;

        if(reply.includes('black')){
          var color_type = 'black';
        }
        if(reply.includes('white')){
          var color_type = 'white';
        }
        if(reply.includes('blue')){
          var color_type = 'blue';
        }
        if(reply.includes('red')){
          var color_type = 'red';
        }
        if(reply.includes('gold')){
          var color_type = 'gold';
        }


        session.send('You choose \'%s\' color.', color_type);
        var all_phone_names,all_phone_prices,all_phone_ratings;
        //Read phones all phones from JSON file
        const fs = require('fs');
        //reading from the high rated phones
        fs.readFile('all_phones_high_to_low.json',(err,data)=>{
          if(err) throw err;
          var obj = JSON.parse(data);
          var main, name_temp;

          //array for storing all the names of the high rated phones
          session.conversationData.all_phone_names= new Array();
          session.conversationData.all_phone_prices= new Array();
          session.conversationData.all_phone_ratings= new Array();

          session.conversationData.colored_phone_names= new Array();
          session.conversationData.colored_phone_prices= new Array();
          session.conversationData.colored_phone_ratings= new Array();

          for(selection1 in obj){
            for(name_temp in obj[selection1]){
              var phone = obj[selection1][name_temp].name;
              var phone_price = obj[selection1][name_temp].price;
              var phone_rating = obj[selection1][name_temp].ratings;
              // session.dialogData.names = phone;
              // session.dialogData.prices = phone_price;
              // session.dialogData.ratings = phone_rating;
              //---------------------------------------------
              //Pushing the phones below 5k in the arrays
              session.conversationData.all_phone_names.push(phone);
              session.conversationData.all_phone_prices.push(phone_price);
              session.conversationData.all_phone_ratings.push(phone_price);
              //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
              // <br/>Ratings: ${session.dialogData.ratings}`);
            }
          }
          // Making the arrays session variables for future use
          all_phone_prices = session.conversationData.all_phone_prices;
          all_phone_names = session.conversationData.all_phone_names;
          all_phone_ratings = session.conversationData.all_phone_ratings;
          console.log('PASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',all_phone_names);

          // var output = '';
          var i;
          for (i=0; i < all_phone_names.length; i++){
            // output = output + "<br/>" + all_phone_names[i];
            var str = (all_phone_names[i]).toString().toLowerCase();

            // console.log('inside the color_loop -----------------',str);
            if (str.indexOf(color_type) >=0) {
              console.log(color_type + " is present in " + all_phone_names[i]);
              session.conversationData.colored_phone_names.push(all_phone_names[i]);
              session.conversationData.colored_phone_prices.push(all_phone_prices[i]);
              session.conversationData.colored_phone_ratings.push(all_phone_ratings[i]);

            }
          }
          //printing protoype of json ka kuch bhi data
          var output = '';
          var i;
          for (i=0; i < session.conversationData.colored_phone_names.length; i++){
            output = output + "<br/>" + session.conversationData.colored_phone_names[i];
          }
          session.send(output);


          // session.send(output);
        })
        //reading the data from the cheap phones

      },
      function(session,results) {
        var user_reply_when_greeted = results.response;
        //taking the results (replies) from session and
        //making a callback--undefined error to getLuisIntent and inside that function\
        var luis_response = getLuisIntent(user_reply_when_greeted,function(result) {
          var intent = result.topScoringIntent.intent;
          var entity_type= result.entities;
          console.log(result);
          console.log('Intent :',intent);
          console.log('Entity type :',entity_type);
        });
        session.log(results);
      }
])

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for RAM ---intent = phone
bot.dialog('ramDialog2',[
  function(session) {
    // session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('ramDialog');
  }
]).triggerAction({
    matches: 'ram'
})

bot.dialog('ramDialog',[
    function(session) {
        //the reply of the user on the console
        var reply= session.message.text;
        var luis_response = getLuisIntent(reply,function(result) {
          var intent = result.topScoringIntent.intent;
          var entity_type= result.entities[0].entity;
          session.conversationData.entity_type = entity_type;
          session.conversationData.intent_class = intent;
          //to check if two parameters are there
          // if(result.entities[1].entity)
          console.log(result);
          console.log('Intent :',intent);
          console.log('Entity type :',entity_type);

          // var entity_reply = session.conversationData.entity_type;
          // session.send('Showing phones below %s', entity_type);
          var all_phone_names,all_phone_prices,all_phone_ratings;
          //Read phones all phones from JSON file
          const fs = require('fs');
          //reading from the high rated phones
          fs.readFile('all_phones_high_to_low.json',(err,data)=>{
            if(err) throw err;
            var obj = JSON.parse(data);
            var main, name_temp;

            //array for storing all the names of the high rated phones
            session.conversationData.all_phone_names= new Array();
            session.conversationData.all_phone_prices= new Array();
            session.conversationData.all_phone_ratings= new Array();

            session.conversationData.ram_phone_names= new Array();
            session.conversationData.ram_phone_prices= new Array();
            session.conversationData.ram_phone_ratings= new Array();

            for(selection1 in obj){
              for(name_temp in obj[selection1]){
                var phone = obj[selection1][name_temp].name;
                var phone_price = obj[selection1][name_temp].price;
                var phone_rating = obj[selection1][name_temp].ratings;
                // session.dialogData.names = phone;
                // session.dialogData.prices = phone_price;
                // session.dialogData.ratings = phone_rating;
                //---------------------------------------------
                //Pushing the phones below 5k in the arrays
                session.conversationData.all_phone_names.push(phone);
                session.conversationData.all_phone_prices.push(phone_price);
                session.conversationData.all_phone_ratings.push(phone_rating);
                //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
                // <br/>Ratings: ${session.dialogData.ratings}`);
              }
            }
            // Making the arrays session variables for future use
            all_phone_prices = session.conversationData.all_phone_prices;
            all_phone_names = session.conversationData.all_phone_names;
            all_phone_ratings = session.conversationData.all_phone_ratings;
            console.log('PASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',all_phone_names,all_phone_ratings);

            // var output = '';
            var i;
            //
            for (i=0; i < all_phone_names.length; i++){
              // output = output + "<br/>" + all_phone_names[i];
              // var str = (all_phone_names[i]).toString().toLowerCase();
              // console.log('inside the color_loop -----------------',str);
              //for phones with ram === entity value
              str = all_phone_names[i].toString().toLowerCase();
              var entity_name_with_space = " " + entity_type;
              var value = str.search(entity_name_with_space);
              if (value>0) {
                console.log(all_phone_names[i] + " have ram equal to " + entity_type );
                session.conversationData.ram_phone_names.push(all_phone_names[i]);
                session.conversationData.ram_phone_prices.push(all_phone_prices[i]);
                session.conversationData.ram_phone_ratings.push(all_phone_ratings[i]);
              }
            }
            console.log('RATINGSSSSS',session.conversationData.ram_phone_ratings);
            //printing protoype of json ka kuch bhi data
            var output = '';
            var i;
            for (i=0; i < session.conversationData.ram_phone_names.length; i++){
              output = output + "<br/> " + session.conversationData.ram_phone_names[i]+
              " Rated : "+ session.conversationData.ram_phone_ratings[i] +
              " Price : "+ session.conversationData.ram_phone_prices[i] + "<br/> ";
            }
            console.log(output);
            session.send(output);

            // session.send(output);
        })
        //reading the data from the cheap phones
        });
      }
    // session.send('By deafult we show a list of best-selling phones under 5000');
])

//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------
//Dialog definition for budget intents ---intent = phone
bot.dialog('budgetDialog2',[
  function(session) {
    // session.send('By deafult we show a list of best-selling phones under 5000');
    session.beginDialog('budgetDialog');
  }
]).triggerAction({
    matches: 'budget'
})


bot.dialog('budgetDialog',[
    function(session) {
        //the reply of the user on the console
        var reply= session.message.text;
        var luis_response = getLuisIntent(reply,function(result) {
          var intent = result.topScoringIntent.intent;
          var entity_type= result.entities[0].entity;
          session.conversationData.entity_type = entity_type;
          session.conversationData.intent_class = intent;
          //to check if two parameters are there
          // if(result.entities[1].entity)
          console.log(result);
          console.log('Intent :',intent);
          console.log('Entity type :',entity_type);

          // var entity_reply = session.conversationData.entity_type;
          session.send('Showing phones below %s', entity_type);
          var all_phone_names,all_phone_prices,all_phone_ratings;
          //Read phones all phones from JSON file
          const fs = require('fs');
          //reading from the high rated phones
          fs.readFile('all_phones_high_to_low.json',(err,data)=>{
            if(err) throw err;
            var obj = JSON.parse(data);
            var main, name_temp;

            //array for storing all the names of the high rated phones
            session.conversationData.all_phone_names= new Array();
            session.conversationData.all_phone_prices= new Array();
            session.conversationData.all_phone_ratings= new Array();

            session.conversationData.budget_phone_names= new Array();
            session.conversationData.budget_phone_prices= new Array();
            session.conversationData.budget_phone_ratings= new Array();

            for(selection1 in obj){
              for(name_temp in obj[selection1]){
                var phone = obj[selection1][name_temp].name;
                var phone_price = obj[selection1][name_temp].price;
                var phone_rating = obj[selection1][name_temp].ratings;
                // session.dialogData.names = phone;
                // session.dialogData.prices = phone_price;
                // session.dialogData.ratings = phone_rating;
                //---------------------------------------------
                //Pushing the phones below 5k in the arrays
                session.conversationData.all_phone_names.push(phone);
                session.conversationData.all_phone_prices.push(phone_price);
                session.conversationData.all_phone_ratings.push(phone_price);
                //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
                // <br/>Ratings: ${session.dialogData.ratings}`);
              }
            }
            // Making the arrays session variables for future use
            all_phone_prices = session.conversationData.all_phone_prices;
            all_phone_names = session.conversationData.all_phone_names;
            all_phone_ratings = session.conversationData.all_phone_ratings;
            console.log('PASSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',all_phone_names);

            // var output = '';
            var i;
            //
            for (i=0; i < all_phone_names.length; i++){
              // output = output + "<br/>" + all_phone_names[i];
              // var str = (all_phone_names[i]).toString().toLowerCase();
              // console.log('inside the color_loop -----------------',str);
              if (all_phone_prices[i] < entity_type) {
                console.log(all_phone_names[i] + " is below " + entity_type );
                session.conversationData.budget_phone_names.push(all_phone_names[i]);
                session.conversationData.budget_phone_prices.push(all_phone_prices[i]);
                session.conversationData.budget_phone_ratings.push(all_phone_ratings[i]);
              }
            }
            //printing protoype of json ka kuch bhi data
            var output = '';
            var i;
            for (i=0; i < session.conversationData.budget_phone_names.length; i++){
              output = output + "<br/>" + session.conversationData.budget_phone_names[i]+
              "Rated : "+ session.conversationData.budget_phone_ratings[i] +
              "Price : "+ session.conversationData.budget_phone_prices[i]; + "<br/>";
            }
            console.log(output);
            session.send(output);

            // session.send(output);
        })
        //reading the data from the cheap phones
        });

      },
      function (session,results) {
      var user_reply = results.response;

      //session.send('%s',user_reply);
      getLuisIntent(user_reply);

    }
])

    // function(session) {
    //     if
    //     //Read phones under 5000 from JSON file
    //     const fs = require('fs');
    //     fs.readFile('phones_below_5k.json',(err,data)=>{
    //       if(err) throw err;
    //       var obj = JSON.parse(data);
    //       var main, name_temp;
    //       //array for storing all the names of the phones_below_5k
    //       var sasta_phone_names = [];
    //       var sasta_phone_prices = [];
    //       var sasta_phone_ratings = [];
    //       for(main in obj){
    //         for(name_temp in obj[main]){
    //           var phone = obj[main][name_temp].name;
    //           var phone_price = obj[main][name_temp].price;
    //           var phone_rating = obj[main][name_temp].ratings;
    //           console.log(phone);
    //           // session.dialogData.names = phone;
    //           // session.dialogData.prices = phone_price;
    //           // session.dialogData.ratings = phone_rating;
    //           //---------------------------------------------
    //           //Pushing the phones below 5k in the arrays
    //           sasta_phone_names.push(phone);
    //           sasta_phone_prices.push(phone_price);
    //           sasta_phone_ratings.push(phone_rating);
    //           //--------------------------------------------- session.send(`\n\n${session.dialogData.names}<br/>Rs.${session.dialogData.prices}\
    //           // <br/>Ratings: ${session.dialogData.ratings}`);
    //         }
    //       }
    //       //Making the arrays session variables for future use
    //       session.dialogData.array_names = sasta_phone_names;
    //       session.dialogData.array_prices = sasta_phone_prices;
    //       session.dialogData.array_ratings = sasta_phone_ratings;
    //       builder.Prompts.text(session, 'What features do you want ?');
    //     })
    //   },
    //   function (session,results) {
    //   var user_reply = results.response;
    //
    //   //session.send('%s',user_reply);
    //   getLuisIntent(user_reply);
    //
    // }

//isMatch function definition
String.prototype.isMatch = function(s){
    return this.match(s)!==null
}





//getLuisIntent function definition here
require('dotenv').config();

var request = require('request');
var querystring = require('querystring');

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
            if (err){
                console.log(err);
                return callback(err);
              }
            else {
                var data = JSON.parse(body);

                callback(data);
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
