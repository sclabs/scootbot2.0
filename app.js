var Botkit = require('botkit');
var request = require("request");

if (!process.env.SCOOTBOT_TOKEN) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({
    debug: false
});

// connect the bot to a stream of messages
var bot = controller.spawn({
    token: process.env.SCOOTBOT_TOKEN
}).startRTM();

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hello(bot, message) {
    bot.api.users.info({user: message.user}, function(err, info){
        bot.reply(message, 'hello @' + info.user.name)
    })
}

function echo(bot, message) {
    if (message.match[2]) {
        bot.reply(message, message.match[2])
    }
}

function flipcoin(bot, message) {
    if (Math.random() < 0.5) {
        bot.reply(message, 'heads');
    }
    else {
        bot.reply(message, 'tails');
    }
}

function rtd(bot, message) {
    var max = 6;
    if (message.match[2]) {
        max = message.match[2];
    }
    bot.reply(message, getRandomIntInclusive(1, max).toString());
}

function pickone(bot, message) {
    var a = message.match[1];
    var b = message.match[2];
    if (Math.random() < 0.5) {
        bot.reply(message, a);
    }
    else {
        bot.reply(message, b);
    }
}

function dota(bot, message) {
    bot.reply(message, 'LEEDLE LEEDLE LEEDLE');
}

function say(bot, message) {
    var userMapping = {
        'tritz': '0AlnL_8vlPlmWdEhJTHE1NVl2T19Ed0tWd20wSlN6dGc',
        'nd': '0AlnL_8vlPlmWdGY4NUF5MjNDcTdPamxjYkdNVEJ5X2c',
        'gilgi': '0AlnL_8vlPlmWdE5uVVBGV2tOaDA5YzdpbHhNQ0dtaWc',
        'kwint': '0AlnL_8vlPlmWdEJ2SzQ1ZEpPUHUxUGhwdUtBMFIzRXc',
        'vindi': '0AlnL_8vlPlmWdDVTZFphVVJFdkdGbmZhbGVnUjZrb1E',
        'sehi': '0AlnL_8vlPlmWdE9fdFNxUVdobWZGTkQtUlZlZFcycXc',
        'mark': '0AlnL_8vlPlmWdDVMbU5pblpWSktWSm4wbHF3b2lOSFE',
        'tk': '1-Wb6wUqoFDKmdTHBIEeFa4zObk1soQRKodcCnm3SlvE',
        'lam': '1vMZlG-8QoeO4y-O5YY7leULJ7vUfRMdR35hHA0hv2rY',
        'zusko': '1F_t5dU33qTKPRo2aJlvnU6VN3-WybgXz-l9ah4RfOXE',
        'space': '10lgnBeHKE3YTeokA5MoM6Qqs73PN8hvL1-yKJVxMM8I',
        'ball': '1SZ5XCkoYRhkI-i1M141UkUxvDpIN_5N4thjnBCWB3NI'
    };
    var twitterMapping = {
        'swift': 'swiftonsecurity',
        'wolf': 'wolfpupy'
    };
    var name = message.match[1];
    var userID = '';
    var baseURL = '';
    if (name in userMapping) {
        baseURL = 'https://script.google.com/macros/s/AKfycbzbYuok-Ihqm7-QepK73x-GW63GHJG7AHUMvNd7ZBbHFuQRrc8/exec?id=';
        userID = userMapping[name];
    }
    else if (name in twitterMapping) {
        baseURL = 'https://script.google.com/macros/s/' +
            'AKfycbxp3dUssGjF44DKknubVoPeunGYMo3YeOFTRajtQimdeIiD1jM/exec?&screen_name=';
        userID = twitterMapping[name];
    }
    request({
        url: baseURL + userID,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            bot.reply(message, body.result[getRandomIntInclusive(0, body.result.length - 1)]);
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function dotabuff(bot, message) {
    var userMapping = {
        'gilgi': 30545806,
        'mark': 60514096,
        'nd': 34814716,
        'tritz': 63826936,
        'sehi': 59311372,
        'vindi': 37784737,
        'kwint': 47374215
    };
    var baseURL = 'https://dotabuff.com/matches/';
    if (message.match[1] == 'yasp' || message.match[1] == 'opendota') {
        baseURL = 'https://opendota.com/matches/';
    }
    if (message.match[3]) {
        var user = message.match[3];
        if (user in userMapping) {
            request({
                url: 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=' +
                    process.env.STEAM_API_KEY + '&account_id=' + userMapping[user],
                json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    bot.reply(message, baseURL +
                        body.result.matches[0].match_id);
                }
                else {
                    bot.reply(message, 'error encountered');
                }
            });
        }
        else {
            bot.reply(message, 'unknown user ' + user);
        }
    }
    else {
        var matchIDs = [];
        var pendingRequests = Object.keys(userMapping).length;
        for (var u in userMapping) {
            if (userMapping.hasOwnProperty(u)) {
                request({
                    url: 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=' +
                        process.env.STEAM_API_KEY + '&account_id=' + userMapping[u],
                    json: true
                }, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        for (var i = 0; i < body.result.matches.length; i++){
                            matchIDs.push(body.result.matches[i].match_id);
                        }
                        if (--pendingRequests == 0) {
                            bot.reply(message, baseURL +
                                matchIDs[getRandomIntInclusive(0, matchIDs.length - 1)]);
                        }
                    }
                    else {
                        bot.reply(message, 'error encountered');
                    }
                });
            }
        }
    }
}

function jukebox(bot, message) {
    if (message.match[3]) {
        request({
            url: 'https://script.google.com/macros/s/AKfycby-RHeBmakw97UVnNGIB0UEwBFiJAydIHfvDupwJgA4kaKHVUg/' +
                'exec?playlist=' + message.match[3],
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var song = body.result[getRandomIntInclusive(0, body.result.length - 1)];
                bot.reply(message, song.track + " by " + song.artist + ": " + song.link);
            }
            else {
                bot.reply(message, 'error encountered');
            }
        });
    }
    else {
        request({
            url: 'https://script.google.com/macros/s/AKfycbydxbcsd0FNJzZBGYczJHyuY7ScKa-dXe36EdvuUt4fdtgiVFk/exec',
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var song = body.result[getRandomIntInclusive(0, body.result.length - 1)];
                bot.reply(message, song.track + " by " + song.artist + " on playlist " + song.playlist + ": " +
                    song.link);
            }
            else {
                bot.reply(message, 'error encountered');
            }
        });
    }
}

function wolfram(bot, message) {
    request({
        url: 'https://script.google.com/macros/s/AKfycbyRab1qtHahFG8jYmWRVETiQJ6ERaJRiAzl6mhpSjg268do14E/exec?query=' +
            message.match[1],
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            bot.reply(message, body.result.join('\n'));
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function aotd(bot, message) {
    request({
        url: 'https://script.google.com/macros/s/AKfycbxZe3OukuZO20ahND9o4mgauaKA7dfFAgjPMFiObc6aYFISO-JQ/' +
            'exec?latest=1',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            bot.reply(message, body.text);
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function aotdThrowback(bot, message) {
    request({
        url: 'https://script.google.com/macros/s/AKfycbxZe3OukuZO20ahND9o4mgauaKA7dfFAgjPMFiObc6aYFISO-JQ/exec',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var album = body.result[getRandomIntInclusive(0, body.result.length - 1)];
            bot.reply(message, album.album + " by " + album.artist + " (selected by " + album.selectedBy + " on " +
                new Date(album.date).toDateString() + "): " + album.link);
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function aotdSpreadsheet(bot, message) {
    bot.reply(message, 'https://docs.google.com/spreadsheets/d/1vA8z1uV6LLDmcSYty8toxYGF1ZcYGdnbQoBzuAqb92U');
}

function aotdSubmit(bot, message) {
    var userMapping = {
        'gilgi': 'gilgi',
        'thelolpatrol': 'nd',
        'tritz': 'tritz',
        'drkwint': 'kwint',
        'sauceboss': 'mark',
        'sc_holiday': 'sehi',
        'vindicator-': 'vindi'
    };
    if (message.match[1] && message.match[2] && message.match[3]) {
        bot.api.users.info({user: message.user}, function (err, info) {
            request({
                url: 'https://script.google.com/macros/s/AKfycbxZe3OukuZO20ahND9o4mgauaKA7dfFAgjPMFiObc6aYFISO-JQ/' +
                'exec?submit=1&user=' + userMapping[info.user.name] + '&album=' + message.match[1] + '&artist=' +
                message.match[2] + '&link=' + message.match[3],
                json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    bot.reply(message, body.text);
                }
                else {
                    bot.reply(message, 'error encountered');
                }
            });
        })
    }
}

function scp(bot, message) {
    bot.reply(message, 'http://www.scp-wiki.net/scp-' + ("000" + getRandomIntInclusive(1, 2257)).slice(-4));
}

function draft(bot, message) {
    var heroList = 'allheroes';
    if (message.match[2]) {
        heroList = message.match[2].split(' ').join('_');
    }
    request({
        url: 'https://script.google.com/macros/s/AKfycbxda9wYE7V3h_XSWgY4EtadDP6TDcT82gpIVejQgLxMfCXjC6rs/' +
            'exec?herolist=' + heroList,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            if (body.result.length) {
                bot.reply(message, body.result[getRandomIntInclusive(0, body.result.length - 1)]);
            }
            else {
                bot.reply(message, 'herolist not found or empty');
            }
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function osu(bot, message) {
    var user = message.match[1];
    var userMapping = {
        'gilgi': 'gilgi',
        'vindi': 'littlegilgi'
    };
    if (user in userMapping) {
        user = userMapping[user];
    }
    request({
        url: 'https://osu.ppy.sh/api/get_user_recent?k=' + process.env.OSU_API_KEY + '&u=' + user + '&limit=1',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200 && body.length) {
            var perfectString = '';
            if (body[0].perfect == 1) {
                perfectString = ' (perfect)';
            }
            bot.reply(message, 'Beatmap: https://osu.ppy.sh/b/' + body[0].beatmap_id +
                '\nScore: ' + body[0].score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                '\nRank: ' + body[0].rank +
                '\nMax Combo: ' + body[0].maxcombo + 'x' + perfectString +
                '\n300/100/50: ' + body[0].count300 + ' / ' +  body[0].count100 + ' / ' + body[0].count50 +
                '\nMisses: ' + body[0].countmiss);
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function osustats(bot, message) {
    var user = message.match[1];
    var userMapping = {
        'gilgi': 'gilgi',
        'vindi': 'littlegilgi'
    };
    if (user in userMapping) {
        user = userMapping[user];
    }
    request({
        url: 'https://osu.ppy.sh/api/get_user?k=' + process.env.OSU_API_KEY + '&u=' + user,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200 && body.length) {
            bot.reply(message, 'User page: https://osu.ppy.sh/u/' + body[0].user_id +
                '\npp: ' + Math.round(body[0].pp_raw) +
                '\nRank: ' + body[0].pp_rank.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                '\nSS/S/A: ' + body[0].count_rank_ss + ' / ' + body[0].count_rank_s + ' / ' + body[0].count_rank_a +
                '\nAccuracy: ' + Math.round(body[0].accuracy * 100) / 100 + '%')
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function wowstats(bot, message) {
    var user = message.match[1];
    var userMapping = {
        'gilgi': '1014711813/Gilgi',
        'vindi': '1014713094/scVindicatoR',
        'kwint': '1014712850/PQman23'
    };
    if (user in userMapping) {
        bot.reply(message, 'https://na.warships.today/player/' + userMapping[user]);
    }
    else {
        bot.reply(message, 'user not recognized')
    }
}

function latex(bot, message) {
    bot.reply(message, {
        'attachments': [
            {
                'fallback': message.match[1],
                'image_url':
                'http://latex.codecogs.com/png.latex?%5Cdpi%7B300%7D%20' + encodeURIComponent(message.match[1])
            }
        ]
    });
}

var z0rstate = 'no';

function z0r(bot, message) {
    if (z0rstate == 'no' && message.match[1] == 'z') {
        bot.reply(message, '0');
        z0rstate = '0';
    }
    else if (z0rstate == '0') {
        if (message.match[1] == 'r') {
            bot.reply(message, 'my z0r chain backboan');
        }
        z0rstate = 'no';
    }
    else {
        z0rstate = 'no';
    }
}

function updateStates(bot, message) {
    z0r(bot, message);
}

var defaultContexts= ['ambient', 'direct_message'];

controller.hears('^!sayhi$', defaultContexts, hello);
controller.hears('^!echo()(.*)', defaultContexts, echo);
controller.hears('^!flipcoin$', defaultContexts, flipcoin);
controller.hears('^!rtd( )?([0-9]+)?$', defaultContexts, rtd);
controller.hears('^!pickone (.*) or (.*)$', defaultContexts, pickone);
controller.hears('^!dota$', defaultContexts, dota);
controller.hears(['^!(.*)say$', '^!8(ball)'], defaultContexts, say);
controller.hears('^!(dotabuff|yasp|opendota)( )?([^\\s\\\\]+)?$', defaultContexts, dotabuff);
controller.hears('^!(jukebox|jb)( )?([^\\s\\\\]+)?$', defaultContexts, jukebox);
controller.hears('^!wolfram (.*)$', defaultContexts, wolfram);
controller.hears('^.*aotd is (.*) by (.*) <(http.*)>.*$', defaultContexts, aotdSubmit);
controller.hears('^!aotd$', defaultContexts, aotd);
controller.hears('^!aotd throwback$', defaultContexts, aotdThrowback);
controller.hears('^!aotd spreadsheet$', defaultContexts, aotdSpreadsheet);
controller.hears('^!scp$', defaultContexts, scp);
controller.hears('^!draft( )?(.*)?$', defaultContexts, draft);
controller.hears('^!osustats (.*)$', defaultContexts, osustats);
controller.hears('^!osu (.*)$', defaultContexts, osu);
controller.hears('^!wowstats (.*)$', defaultContexts, wowstats);
controller.hears('^\\$(.*)\\$$', defaultContexts, latex);
controller.hears('(.*)', ['ambient'], updateStates);
