const Discord = require('discord.js')
const Azure = require('./Util/Azure.js')
const config = require('./Config.json')
const commandsHandler = require('./Handlers/Commands.js')
const eventsHandler = require('./Handlers/Events.js')
const OPTIONS = { 
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "GUILD_VOICE_STATES", "DIRECT_MESSAGE_REACTIONS", "GUILD_INVITES"],
    failIfNotExists: false
}

let mainBot
for(let botID in config.bots){
    if(config.beta) {
        if(botID != config.betaBotID) continue
    }
    let bot = new Azure(OPTIONS)
    if(!mainBot) mainBot = bot

    commandsHandler(bot)
    eventsHandler(bot)

    bot.login(config.bots[botID])
}

Array.prototype.chunk = function(len){
    let chunks = []
    let i = 0
    let n = this.length
    while (i < n) {
      chunks.push(this.slice(i, i += len));
    }
    return chunks
}


if(!config.beta){
    process.on('unhandledRejection', (reason, promise) => {
        if(reason.message == 'Missing Permissions')
            return console.log('Additional permissions required for', reason.path, reason.method)
        
        if(reason.message == 'Invalid Form Body') console.log(reason.requestData.json.embeds)
        console.error('ERROR', reason, promise)
        
        const parsedErr = parseError(reason)
        
        const e = new Discord.MessageEmbed()
            .setTitle('Unhandled Promise Rejection')
            .setDescription(` \`\`\`\n${reason.message}\`\`\` Info: \`\`\`\nMethod: ${reason.method}\nPath: ${reason.path}\nCode: ${reason.code}\nStatus: ${reason.httpStatus} \`\`\` `)
            .setFooter({ text: `Location: ${parsedErr.file}` })
            .setColor('RED')
            
        mainBot.errorChat?.send({ embeds: [e] }).catch(err => null)
    })
}

function parseError(err){
    if(!err.stack) return err

    let stack = err.stack.split('\n').map(s => s.trim())
    let message = stack.shift()
    stack = stack.filter(s => s.startsWith('at') && (!s.includes('node_modules') && !s.includes('internal/process')))
    let file = stack.length ? stack[0].split(/\\|\//).pop().replace(/\(|\)/g, '') : 'Unknown'
    
    let errorMessage = err.message
    if(errorMessage.includes('Require stack'))
        errorMessage = errorMessage.split('Require stack:')[0].trim()

    return { message, file, stack };
}
