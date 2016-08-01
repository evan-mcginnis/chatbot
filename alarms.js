var builder = require('botbuilder');
var restify = require('restify');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=876c5524-f66e-461a-b5bb-f122b4d38547&subscription-key=0ae6d51f3a3d49bb9da126e6b86e99ba';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);

// Add intent handlers
dialog.matches('showEntity', [
    function (session, args, next) {
	var managedObject = builder.EntityRecognizer.findEntity(args.entities, 'managedObject');
	if(managedObject) {
	    builder.DialogAction.send("Here are the current %s.", managedObject.entity);
	    next({ response: managedObject.entity });
	}
	else {
	    builder.DialogAction.send("Sorry, I can't find the managedEntity");
	}
    },
    function (session, results) {
	if (results.response) {
	    session.send("Here are the current %s", results.response );
	} else {
	    session.send("OK");
	}
    }
]);

dialog.matches('showStatus', [
    function (session, args, next) {
	var managedObject = builder.EntityRecognizer.findEntity(args.entities, 'managedObject');
	if(managedObject) {
	    var currentState = "Unknown";
	    switch (managedObject.entity) {
		case 'network' :
		    currentState = "The network is just fine";
		    break;
		case 'devices' :
		    currentState = "The devices are just fine";
		    break;
		default :
		    currentState = "I don't know how to check on " + managedObject.entity;
		    break;
	    }
	    next({ response: currentState });
	}
	else {
	    next({ response: "Sorry, I can't find the managedEntity"});
	}
    },
    function (session, results) {
	if (results.response) {
	    session.send( results.response );
	} else {
	    session.send("OK");
	}
    }
]);

dialog.onDefault(builder.DialogAction.send("I'm sorry I didn't understand that. Try queries such as 'show current alarms'"));
