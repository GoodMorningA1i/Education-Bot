//require modules and files
const Discord = require('discord.js');
const {prefix, token} = require('./config.json');
const {api_id, api_key} = require('./api.json');

//create a new Discord client
const client = new Discord.Client();

//Intializing variables
const pollEmbed = require('discord.js-poll-embed');
var dictCourses = {};
reminder_to_reminderInfo = {};
reminder_num = 0;
date_to_availability = {};
goals = {};
goal_num = 0;

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
                time: 60000
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
    // Covid-19 help feature    
    if (message.content.startsWith(prefix + 'covid'))
    {
        message.channel.send('Here are some resources to keep up to date with Covid-19 \n'
        + 'WHO: https://www.who.int/emergencies/diseases/novel-coronavirus-2019 \n' +
        'IABC: https://www.iabc.com/covid-19-resources/ \n' +
        'John Hopkins University: https://coronavirus.jhu.edu/');
    }
    //help command (to view a list of all the commands)
    if (message.content.startsWith(`${prefix}educationbot`)) {
        var commands = 'Here are a list of commands that you can use with the Education Bot: \n - !newcourse Your_Course_Name \n - !addmark Your_Course_Name, Your_Grade, Weight \
        \n - !delcourse Your_Course_Name \n - !courses \n - !math num_1 operation num_2 \n - !def Your_word \n - !poll Your_question \n - !addreminder {time} {message} \n - !reminders \
        \n - !addschedule {weekday - i.e. Monday} {time - i.e. 2-5pm} \n - !viewschedule \n - !addgoal {message} \n - !goals \n - !delgoal {num}'
        message.channel.send(commands)
    }

    //Reminder system (it uses a timer, rather than a specific date)
    if (message.content.startsWith(`${prefix}addreminder`)) {
        
        try {
            // Variables
            var today = new Date();
            var curr_time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            var returntime;
            var time_unit;
            split_msg = message.content.split(' ');
            //message.channel.send('Message recieved from ' + message.author.id + ' at ' + Date.now().toString());

            // Sets the return time
            time_unit = split_msg[1].substring((split_msg[1].length - 1), (split_msg[1].length));
            returntime = split_msg[1].substring(0, (split_msg[1].length - 1));


            // Putting things into a dictionary
            key_name = 'Reminder ' + reminder_num;
            reminder_to_reminderInfo[key_name] = [curr_time, split_msg[1], ''];

            //Building the message
            split_msg.shift();
            split_msg.shift();

            var content = split_msg.join();
            content = content.replace(/,/g, " ");

            //Adding message to the dictionary
            reminder_to_reminderInfo[key_name][2] = content;
            message.channel.send(reminder_to_reminderInfo.length);
            reminder_num += 1;


            // Based off the time unit, sets the time
            switch (time_unit) {
                
                //For seconds
                case 's':
                    returntime = returntime * 1000;
                    break;

                //For minutes
                case 'm':
                    returntime = returntime * 1000 * 60;
                    break;

                //For hours
                case 'h':
                    returntime = returntime * 1000 * 60 * 60;
                    break;

                // For days
                case 'd':
                    returntime = returntime * 1000 * 60 * 60 * 24;
                    break;

                //Default is in seconds
                default:
                    returntime = returntime * 1000;
                    break;
            }

            // Returns the message after the timer ends
            client.setTimeout(function () {

                //Sending message to discord after the timer runs out   
                message.channel.send(content);
                delete reminder_to_reminderInfo[key_name] //My best shot at deleting reminders

            }, returntime)

        }

        //Checks for exceptions
		catch (e) {
			message.channel.send("An error has occured, please make sure the command in this format: !reminder {time} {message}");
			console.error(e.toString());
		}
    }

    //Display all the reminders
    if (message.content.startsWith(`${prefix}reminders`)) {


        for (var key in reminder_to_reminderInfo) {
            message.channel.send('- ' + key + ' (Reminder set time: ' + reminder_to_reminderInfo[key][0] + ' & Reminder time: ' + reminder_to_reminderInfo[key][1] + ') - Message: ' + reminder_to_reminderInfo[key][2])
        }
    }


    // //Remove reminders
    // if (message.content.startsWith(`${prefix}delreminder`)) {

    //     msg = message.content.split(' ')
    //     var reminder_number = msg[1] + ' ' + msg[2];
    //     message.channel.send(reminder_number);
    //     message.channel.send(reminder_to_reminderInfo.length);
        
    //     if (reminder_to_reminderInfo.hasOwnProperty(reminder_num)) {
    //         delete reminder_to_reminderInfo[reminder_num];
    //         message.channel.send(reminder_num + ' has been removed.')
    //     }
    //     else {
    //         message.channel.send("Please enter an existing reminder number.")
    //     }

    // }

    //Add Student and Teacher Availabilities
    if (message.content.startsWith(`${prefix}addschedule`)) {
        content = message.content.split(' ');
        date = content[1];
        timing = content[2];

        date_to_availability[date] = timing;
    }


    //View Student and Teacher Availabilities
    if (message.content.startsWith(`${prefix}viewschedule`)) {
        for (var key in date_to_availability) {
            message.channel.send('- ' + key + ': ' + date_to_availability[key] + '\n');
        }
    }

    //Adding goals to a list
    if (message.content.startsWith(`${prefix}addgoal`)) {
        msg = message.content.split(' ');
        
        msg.shift();
        var content = msg.join();
        content = content.replace(/,/g, " ");

        goals[goal_num] = content;
        goal_num += 1;
    }

    //View goals to a list
    if (message.content.startsWith(`${prefix}goals`)) {
        for (var key in goals) {
            message.channel.send(key + ') ' + goals[key] + '\n');
        }
    }

    //Delete a goal to a list
    if (message.content.startsWith(`${prefix}delgoal`)) {
        num = message.content.split(' ')[1];
        if (goals.hasOwnProperty(num)) {
            delete goals[num];
            message.channel.send("Goal " + num + " has been deleted.")
        } 
        else {
            message.channel.send('Please enter an appropriate goal number.');
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