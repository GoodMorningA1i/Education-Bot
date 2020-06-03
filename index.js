const Discord = require('discord.js');
const {prefix, token} = require('./config.json');

var dictCourses = {};

const client = new Discord.Client();
//
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
    if (message.content.startsWith(prefix+'courses'))
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
    if (message.content.startsWith(prefix +'addmark'))
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
})
client.login(token);