const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const {api_id, api_key} = require('./api.json');

const pollEmbed = require('discord.js-poll-embed');
var dictCourses = {};

const client = new Discord.Client();

client.once('ready', () => {
    console.log('Ready');
})

client.on('message', async message =>{
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
    if (message.content.startsWith(prefix +'math'))
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
    if (message.content.startsWith(prefix +'def'))
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
    //Poll feature 
    if (message.content.startsWith(prefix + 'poll'))
    {    
         var question = message.content.substring(6).trim();
         message.channel.send('Enter answer options. Max 10. Type done when finished.');
         //make sure user typing options is same as user who created poll        
         let filter = m => {             
             if (m.author.id == message.author.id)
             {
                 if (m.content.toLowerCase() == 'done')
                 {
                     collector.stop()
                 }
                 else 
                 {
                     return true;
                 }
             }
             else{
                 return false;
             }
         }
         let collector = message.channel.createMessageCollector(filter, {maxMatches:10});
         //get the pollOptions user entered
         let pollOptions = await getPollOptions(collector);
         if (pollOptions.length < 2)
         {
             message.channel.send('Not enough options! You must have at least 2. Please create another poll');
             return;
         }
         //Show user their poll options for confirmation 
         let embed = new Discord.MessageEmbed();
         embed.setTitle(question);
         embed.setDescription(pollOptions.join('\n'));
         let confirm = await message.channel.send(embed);
         await confirm.react('✅');
         await confirm.react('❎');

        //get user's reaction
        let reactionFilter = (reaction, user) => (user.id == message.author.id) && !user.bot;
        let reaction = (await confirm.awaitReactions(reactionFilter, {max:1})).first();
        //Continue with poll
        if  (reaction.emoji.name == '✅' )
        {
            message.channel.send('Poll will begin in 5 seconds. You will have 60 seconds to vote');
            await delay(5000);
            message.channel.send('Vote now');
            let votes = new Map();
            let pollTally = new Discord.Collection(pollOptions.map(o =>[o, 0]));
            let pollFilter = m => !m.bot;
            let voteCollector = message.channel.createMessageCollector(pollFilter, {
                time: 6000
            });
            await processPollResults(voteCollector, pollOptions, votes, pollTally);                     
            let entries = [...pollTally.entries()];
            let embed = new Discord.MessageEmbed();
            let desc = '';
            entries.forEach(entry => desc += entry[0] + ' received ' + entry[1] + ' vote(s) \n');
            embed.setDescription(desc);
            message.channel.send('The results are:', embed);
        }
        //Cancel poll
        else if (reaction.emoji.name =='❎')
        {
            message.channel.send('Poll cancelled');
        }
    }  
})
//Function to get poll options 
function getPollOptions(collector)
{
    return new Promise((resolve, reject) => {
        collector.on('end', collected => resolve(collected.map(m => m.content)));
    });
}
//Timeout delay for start of poll
function delay(time)
{
    return new Promise((resolve, reject) => {
        setTimeout(() =>{
            resolve();
        }, time)
    });
}

//function to process poll results
function processPollResults(voteCollector, pollOptions, votes, pollTally)
{
    return new Promise((resolve, reject) => {
        voteCollector.on('collect', msg =>{
            let option = msg.content.toLowerCase();
            //check if user already voted and if option exists 
            if (!votes.has(msg.author.id) && pollOptions.includes(option))
            {
                votes.set(msg.author.id, msg.content);
                let voteCount = pollTally.get(option);
                pollTally.set(option, ++voteCount);
            }
        });
        voteCollector.on('end', collected =>{
            console.log('Collected '+ collected.size + ' votes.')
            resolve(collected);
        });
    })
}
client.login(token);