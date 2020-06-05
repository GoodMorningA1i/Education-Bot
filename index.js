const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const {api_id, api_key} = require('./api.json');

const pollEmbed = require('discord.js-poll-embed');
var dictCourses = {};

const client = new Discord.Client();

client.once('ready', () => {
    console.log('Ready');
})

client.on('message', message =>{
    //Add a new course to dictionary
    if (message.content.startsWith(prefix +'newcourse')) 
    {     
        var potential = message.content.trim().split(/\s/).filter(Boolean);            
        //Make sure duplicate courses not added as well
        if (dictCourses.hasOwnProperty(potential[1]))
        {
            message.channel.send('Error! Please enter a new course');           
        }
        else{           
            dictCourses[potential[1]] = [0, 0, 0];
            message.channel.send('Your course has been added');
        }
    }
    //Display all the courses for this student with current marks
    else if (message.content.startsWith(prefix+'courses'))
    {
        if (Object.keys(dictCourses).length == 0)
        {
            message.channel.send('You have no courses at the moment');
        }
        else{
            for (var key in dictCourses)
            {
                message.channel.send(key + ': \t' + dictCourses[key][0].toString());
            }
        }      
    }
    //Add a mark to an existing course
    else if (message.content.startsWith(prefix +'addmark'))
    {
        var potential = message.content.trim().split(/\s*[\s,]\s*/).filter(Boolean);    
        if (dictCourses.hasOwnProperty(potential[1]))        
        {
            if (dictCourses[potential[1]][1] == 100)
            {
                message.channel.send('Your final mark in ' + potential[1]+ ' is ' + dictCourses[potential[1]][0].toString());
            }
            //Make sure total weight does not exceed 100%
            else if (dictCourses[potential[1]][1] + parseInt(potential[3]) <=100)
            {
                dictCourses[potential[1]][1] += parseInt(potential[3]);
                dictCourses[potential[1]][2] += parseInt(potential[2]) * parseInt(potential[3])               
                dictCourses[potential[1]][0] = (dictCourses[potential[1]][2] / dictCourses[potential[1]][1]).toFixed(2);
                message.channel.send('Your mark in ' +potential[1]+ ' has been updated');
            }  
            else{
                message.channel.send('Please enter a valid weight');
            }
        }
        else{
            message.channel.send('Please enter an existing course!');
        }
      
    }
    //Delete a course 
    else if (message.content.startsWith(prefix +'delcourse'))
    {
        var potential = message.content.trim().split(/\s/).filter(Boolean);    
        if (dictCourses.hasOwnProperty(potential[1]))
        {
            delete dictCourses[potential[1]];
            message.channel.send(potential[1] + ' has been deleted');
        }    
        else{
            message.channel.send('Please enter an existing course!');
        }
    }
    //Math Mode Feature
    else if (message.content.startsWith(prefix +'math'))
    {
        var potential = message.content.trim().split(/\s/).filter(Boolean); 
        //Decide which simple computation to carry out
        if (potential[2] == '+')
        {
            var answer = parseInt(potential[1]) + parseInt(potential[3]);
            message.channel.send(answer.toString());
        }
        else if (potential[2] == '-')
        {
            var answer = parseInt(potential[1]) - parseInt(potential[3]);
            message.channel.send(answer.toString());
        }
        else if (potential[2] == '*')
        {
            var answer = parseInt(potential[1]) * parseInt(potential[3]);
            message.channel.send(answer.toString());
        }
        else if (potential[2] == '/')
        {
            if (parseInt(potential[3]) != 0)
                {
                var answer = parseInt(potential[1]) / parseInt(potential[3]);
                message.channel.send(answer.toString());
                }
            else
            {
                message.channel.send('Cannot divide by 0');
            }
        }
        else 
        {
            message.channel.send('Please enter an expression in the correct format');
        }
    }
    //Dictionary Feature
    else if (message.content.startsWith(prefix +'def'))
    {
        var potential = message.content.trim().split(/\s/).filter(Boolean); 
        
        const http = require("https");        
        const wordId = potential[1];
        const fields = 'definitions';
        const strictMatch = "false";

        const options = {
            host: 'od-api.oxforddictionaries.com',
            port: '443',
            path: '/api/v2/entries/en-gb/' + wordId + '?fields=' + fields + '&strictMatch=' + strictMatch,
            method: "GET",
            headers: {
              'app_id': api_id,
              'app_key': api_key
            }
          };
       
        http.get(options, (resp) => {
            let body = '';
            resp.on('data', (d) => {
                body += d;
            });
            resp.on('end', () => {
                let parsed = JSON.parse(body);
                try {
                    message.channel.send(parsed.results[0].lexicalEntries[0].entries[0].senses[0].definitions[0]);
                } catch (error) {
                    message.channel.send('Please enter a valid word');
                }
                
            });
        });

    }
    else if (message.content.startsWith(prefix +'poll'))
    {    
         
        pollEmbed('Who are you', 'Poll #1', ['Jonathan', 'Jack']);
    }
})
client.login(token);