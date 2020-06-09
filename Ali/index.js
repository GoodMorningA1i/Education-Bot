// require the discord.js module & variables for prefix and token
const Discord = require('discord.js');
const {prefix, token} = require('./config.json');

// create a new Discord client
const client = new Discord.Client();

//More variables
var dictCourses = {}

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

//Display messages in the terminal below
client.on('message', message => {
    console.log(message.content);
})

client.on('message', message => {

    //help command (to view a list of all the commands)
    if (message.content.startsWith(`${prefix}educationbot`)) {
        var commands = 'Here are a list of commands that you can use with the Education Bot: \n - !newcourse Your_Course_Name \n - !addmark Your_Course_Name, Your_Grade, Weight \
        \n - !delcourse Your_Course_Name \n - !courses \n - !math num_1 operation num_2 \n - !def Your_word \n - !poll Your_question'
        message.channel.send(commands)
    }

    //Reminder system (it uses a timer, rather than a specific date)
    if (message.content.startsWith(`${prefix}reminder`)) {
        
        try {
            // Variables
            var returntime;
            var time_unit;
            split_msg = message.content.split(' ');
            //message.channel.send('Message recieved from ' + message.author.id + ' at ' + Date.now().toString());

            // Sets the return time
            time_unit = split_msg[1].substring((split_msg[1].length - 1), (split_msg[1].length))
            returntime = split_msg[1].substring(0, (split_msg[1].length - 1))

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
            if (split_msg[2] != null) {
                client.setTimeout(function () {
                    message.channel.send(split_msg[2]);
                }, returntime)
            }
            else {
                message.channel.send("An error has occured, please make sure the command in this format: !reminder {time} {message}");
            }

        }

        //Checks for exceptions
		catch (e) {
			message.channel.send("An error has occured, please make sure the command in this format: !reminder {time} {message}");
			console.error(e.toString());
		}

    }

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

})


// login to Discord with your app's token
client.login(token);