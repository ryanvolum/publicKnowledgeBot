require('dotenv').config();

const request = require('request');
const restify = require('restify');
const builder = require('botbuilder');

const rootQueryString = `https://www.bingapis.com/api/v6/search?responseFilter=knowledge&appId=${process.env.KNOWLEDGE_APP_ID}&screenshotstyle=small&conversation=true`;

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID ? process.env.MICROSOFT_APP_ID : '',
    appPassword: process.env.MICROSOFT_APP_PASSWORD ? process.env.MICROSOFT_APP_PASSWORD : ''
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector);

const getKnowledge = (search, callback) => {
    const queryString = `${rootQueryString}&q=${search}`
    request(queryString, (error, response, body) => {
        if (error) {
            callback(error, null);
        } else {
            const result = JSON.parse(body);
            if (result) {
                callback(null, result);
            }
        }
    });
}

const shortenResponse = (response) => {
    const firstPeriodIndex = response.indexOf('.');
    if (firstPeriodIndex > 150) {
        for (var i = 150; (response[i] === ' ') || (i === 0); i--) {
        }
        return response.substring(0, i - 1);
    } else {
        return response.substring(0, firstPeriodIndex);
    }
}

bot.dialog('/', [
    (session) => {
        if (session.message.text.toLowerCase() === "hi" || session.message.text.toLowerCase() === "hello") {
            session.endDialog("Hey! I'm a robotic head. Ask me about people, places or things");
        } else {
            getKnowledge(session.message.text, (error, result) => {
                if (result && result.entities && result.entities.conversation) {
                    if (result.entities.conversation.spokenText) {
                        session.endDialog(shortenResponse(result.entities.conversation.spokenText));
                    } else if (result.entities.conversation.displayText) {
                        session.endDialog(shortenResponse(result.entities.conversation.displayText));
                    }
                } else if (result) {
                    session.endDialog("I'm not really sure");
                } else {
                    session.endDialog("My brain seems to be broken right now. I'm not getting results from the API");
                }
            })
        }
    }
])


