var Botkit = require('botkit');
var request = require("request");
var exec = require('child_process').exec;
var fs = require('fs');
var deploy = require('./docker.js').deploy;
var p4k = require('pitchfork');


// kill the bot every hour, expecting forever to restart it
setTimeout(() => process.exit(), 1000 * 60 * 60);


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

var steamUserMapping = {
    'gilgi': 30545806,
    'mark': 60514096,
    'nd': 34814716,
    'tritz': 63826936,
    'sehi': 59311372,
    'vindi': 37784737,
    'kwint': 47374215,
    'boomsy': 14046169,
    'janus': 59053168
};
var steamUserReverseMapping = {};
Object.keys(steamUserMapping).forEach(function(userName) {
    steamUserReverseMapping[steamUserMapping[userName]] = userName;
});

var steamMapping = {
    'gilgi': '76561197990811534',
    'vindi': '76561197998050465',
    'kwint': '76561198007639943'
};

var chessLevels = [];
var chessRanks = ['Pawn', 'Knight', 'Bishop', 'Rook'];
for (var i = 0; i < chessRanks.length; i++) {
    for (var j = 0; j < 9; j++) {
        chessLevels.push(chessRanks[i] + ' ' + (j+1));
    }
}
chessLevels.push('King');
chessLevels.push('Queen');

var dotaHeroList = JSON.parse(fs.readFileSync('heroes.json', 'utf8'));
var dotaHeroIdToName = {};
for (var i = 0; i < dotaHeroList.length; i++) {
    dotaHeroIdToName[dotaHeroList[i].id] = dotaHeroList[i].localized_name;
}
var dotaHeroNameToId = {};
for (var i = 0; i < dotaHeroList.length; i++) {
    dotaHeroNameToId[dotaHeroList[i].localized_name] = dotaHeroList[i].id;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Credit: https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
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
    var options = message.match[1].split(' or ');
    bot.reply(message, options[getRandomIntInclusive(0, options.length - 1)]);
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
        'boomsy': '17P2RqkHeC9CV2lq_gz9nY1sqXDxKdErUzFYaOSovvA8',
        'janus': '1FOuCjnKH83dv37lyQXJ4eOOClat0Zr39mWLj7HTMU2M',
        'space': '10lgnBeHKE3YTeokA5MoM6Qqs73PN8hvL1-yKJVxMM8I',
        'ball': '1SZ5XCkoYRhkI-i1M141UkUxvDpIN_5N4thjnBCWB3NI'
    };
    var twitterMapping = {
        'swift': 'swiftonsecurity',
        'wolf': 'wolfpupy',
        'wint': 'dril'
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
    var baseURL = 'https://dotabuff.com/matches/';
    if (message.match[1] == 'yasp' || message.match[1] == 'opendota') {
        baseURL = 'https://opendota.com/matches/';
    }
    if (message.match[3]) {
        var user = message.match[3];
        if (user in steamUserMapping) {
            request({
                url: 'https://api.opendota.com/api/players/' + steamUserMapping[user] + '/matches?limit=1',
                json: true
            }, function (error, response, body) {
                wonOrLost = body[0].player_slot >>> 7 ^ body[0].radiant_win ? 'won' : 'lost';
                pogOrKekw = wonOrLost == 'won' ? ':pogchamp:' : ':kekw:';
                if (!error && response.statusCode === 200) {
                    bot.reply(message, user + ' ' + wonOrLost + ' as ' +
                              dotaHeroIdToName[body[0].hero_id] + ' going ' +
                              body[0].kills + '/' + body[0].deaths + '/' + body[0].assists +
                              ' ' + pogOrKekw +
                              ' ' + baseURL + body[0].match_id);
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
        var pendingRequests = Object.keys(steamUserMapping).length;
        for (var u in steamUserMapping) {
            if (steamUserMapping.hasOwnProperty(u)) {
                request({
                    url: 'https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=' +
                        process.env.STEAM_API_KEY + '&account_id=' + steamUserMapping[u],
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

function resolveHeroNickname(nickname, callback) {
    // url we will need
    var heroNicknameTsvUrl = 'https://docs.google.com/spreadsheets/d/1z4rUK2tZkgqCWt-c5bShvm1ynZJDMrcC8W1gDW9rYcM/pub?gid=0&single=true&output=tsv';

    request({url: heroNicknameTsvUrl}, function (error, response, body) {
        // construct nicknameMap
        var nicknameMap = {};
        var lines = body.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var pieces = line.split('\t');
            if (pieces.length > 1) {
                var nicknames = pieces[1].split(',');
                for (var j = 0; j < nicknames.length; j++) {
                    nicknameMap[nicknames[j].toLowerCase().trim()] = pieces[0].trim();
                }
            }
            nicknameMap[pieces[0].toLowerCase().trim()] = pieces[0].trim();
        }

        // lookup
        if (nickname in nicknameMap) {
            return callback(nicknameMap[nickname]);
        }
        else {
            return callback(null);
        }
    })
}

function resolveHeroNameToId(name, callback) {
    // short-circuit
    if (!name) {
        return callback(null);
    }

    if (name in dotaHeroNameToId) {
        return callback(dotaHeroNameToId[name]);
    }
    else {
        return callback(null);
    }
}

function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}

function promiseRequest(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

async function getStats(userId, heroId) {
    var statsUrl = 'https://api.opendota.com/api/players/' + userId + '/wl?hero_id=' + heroId;
    var stats = await promiseRequest({url: statsUrl, json: true});
    var a = 3;
    var b = 7;
    return {
        'userId': userId,
        'heroId': heroId,
        'win': stats.win,
        'lose': stats.lose,
        'totalGames': stats.win + stats.lose,
        'percentage': Math.floor(100 * (stats.win / (stats.win + stats.lose))),
        'powerRank': Math.floor(100 * ((stats.win + a) / ((stats.win + a) + (stats.lose + b))))
    };
}

function yaspstats(bot, message) {
    // extract information from message
    var userString = message.match[1];
    var heroString = message.match[2];

    resolveHeroNickname(heroString, function(heroname) {resolveHeroNameToId(heroname, function(heroId) {
        var userId = 0;
        if (userString === 'powerrank') {
            userId = null;
        } else if (userString in steamUserMapping) {
            userId = steamUserMapping[userString];
        }
        else {
            bot.reply(message, 'failed to resolve user name');
            return;
        }

        console.log(heroId);

        // hit the yasp API
        if (heroId) {
            if (userId) {
                getStats(userId, heroId).then(function (stats) {
                    bot.reply(message, stats.win + '-' + stats.lose + ' (' + stats.percentage + '%)');
                }).catch(function (err) {
                    console.log(err);
                });
            } else {
                var promiseList = [];
                Object.keys(steamUserMapping).forEach(function(userName) {
                    promiseList.push(getStats(steamUserMapping[userName], heroId));
                });
                Promise.all(promiseList).then(function(stats) {
                    sortedStats = sortByKey(stats, 'powerRank').filter(function (stat) {return stat.totalGames > 0;});
                    var messagePieces = [];
                    for (var i = 0; i < sortedStats.length; i++) {
                        messagePieces.push(
                            (i+1).toString() + '. ' + steamUserReverseMapping[sortedStats[i].userId] + ' (' +
                            sortedStats[i].win + '-' +  sortedStats[i].lose + ', ' + sortedStats[i].percentage + '%)')
                    }
                    bot.reply(message, messagePieces.join('\n'));
                }).catch(function(err) {
                    console.log(err);
                })
            }
        }
        else {
            bot.reply(message, 'failed to resolve hero name');
        }
    })});
}


async function chessStats() {
    userNames = [];
    userIds = [];
    scores = [];
    for (userName in steamMapping) {
        if (steamMapping.hasOwnProperty(userName)){
            userNames.push(userName);
            userIds.push(steamMapping[userName]);
        }
    }
    var promiseList = []
    for (var i = 0; i < userNames.length; i++) {
        var statsUrl = 'http://www.autochess-stats.com/backend/api/dacprofiles/' + userIds[i];
        promiseList.push(promiseRequest({url: statsUrl, json: true}));
    }
    data = [];
    stats = await Promise.all(promiseList);
    for (var i = 0; i < stats.length; i++) {
        data.push({
            name: userNames[i],
            score: parseInt(stats[i].dacProfile.score),
            rank: parseInt(stats[i].dacProfile.rank)
        });
    }
    return data
}


function chess(bot, message) {
    chessStats().then(function(data) {
        sortedStats = sortByKey(data, 'score')
        var messagePieces = [];
            for (var i = 0; i < sortedStats.length; i++) {
                messagePieces.push(
                    (i+1).toString() + '. ' +
                    sortedStats[i].name + ' (' +
                    chessLevels[sortedStats[i].rank-1] + ', ' +
                    sortedStats[i].score + ' MMR)')
            }
            bot.reply(message, messagePieces.join('\n'));
    });
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
        if (!error && response.statusCode === 200 && body && body.result) {
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
        'vindicator-': 'vindi',
        'boomsy': 'boomsy'
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

function pitchfork(bot, message) {
    request({
        url: 'https://script.google.com/macros/s/AKfycbxZe3OukuZO20ahND9o4mgauaKA7dfFAgjPMFiObc6aYFISO-JQ/' +
            'exec?latest=1',
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var s = new p4k.Search(body.text.substring(24).split(' (selected by ')[0].split(' by ').join(' '));
            s.on('ready', function(results) {
                bot.reply(message, results[0].attributes.album + ' by ' + results[0].attributes.artist + ': ' + results[0].attributes.score);
            });
        }
        else {
            bot.reply(message, 'error encountered');
        }
    });
}

function scp(bot, message) {
    var n = getRandomIntInclusive(1, 4999)
    console.log(n);
    var s = n.toString();
    console.log(s);
    if (s.length < 3) {
        s = ('00' + s).slice(-3);
    }
    console.log(s);
    console.log('http://www.scp-wiki.net/scp-' + s);
    if (n > 4126) {
        console.log('checking');
        request('http://www.scp-wiki.net/scp-' + s, function (error, response, body) {
            if (!error || response.statusCode == 404) {
                console.log('failed, trying again');
                scp(bot, message);
                return;
            }
        });
    }
    bot.reply(message, 'new bot says: http://www.scp-wiki.net/scp-' + s);
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
        'kwint': '1014712850/PQman23',
        'tritz': '1022611617/manlytomb'
    };
    if (user in userMapping) {
        bot.reply(message, 'https://na.warships.today/player/' + userMapping[user]);
        bot.reply(message, {
            'attachments': [
                {
                    'title_url': 'https://na.warships.today/player/' + userMapping[user],
                    'fallback': 'world of warships stats for ' + user,
                    'image_url': 'http://na.warshipstoday.com/signature/' + userMapping[user].split('/')[0] +
                    '/dark.png'
                }
            ]
        });
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
        if (Math.random() < 0.5) {
            bot.reply(message, '0');
            z0rstate = '0';
        }
        else {
            z0rstate = 'z';
        }
    }
    else if (z0rstate == 'z') {
        if (message.match[1] == '0') {
            z0rstate = '0';
        }
        else {
            z0rstate = 'no';
        }
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

var prevMessage = null;

function antiTritz(bot, message) {
    if (prevMessage && prevMessage.user == 'U1UV8B8UC' && Math.random() < 0.5) {
        bot.api.reactions.add({'name': 'antitritz', 'channel': prevMessage.channel, 'timestamp': prevMessage.ts});
    }
}

function updateStates(bot, message) {
    if (message.channel == 'C1V01CFLM') {
        z0r(bot, message);
        prevMessage = message;
        //antiTritz(bot, message);  historical landmark: antiTritz used to fire on every message
    }
}

function debugState(bot, message) {
    // declare stateString
    var stateString = '';

    // add z0rstate
    stateString += 'z0rstate: ' + z0rstate + '\n';

    // add prevMessage
    if (prevMessage) {
        stateString += 'prevMessage: "' + prevMessage.text + '" sent by: ' + prevMessage.user + '\n';
    }

    // reply to the !debug request with stateString
    bot.reply(message, stateString);
}

function twitch(bot, message) {
    var channels = ['scootscanoe', 'manlytomb', 'arteezy', 'sing_sing', 'sumaildoto', 'wagamamatv', 'purgegamers'];
    channels.forEach(function(channel) {
        request({
            headers: {
                'Accept': 'application/vnd.twitchtv.v3+json',
                'Client-ID': process.env.SCOOTBOT_TWITCH_CLIENT_ID
            },
            url: 'https://api.twitch.tv/kraken/streams/' + channel,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                if (body.stream) {
                    bot.reply(message, {
                        "attachments": [
                            {
                                'fallback': channel + ' is live with ' + body.stream.viewers + ' viewers',
                                'title': channel,
                                'title_link': 'https://twitch.tv/' + channel,
                                'text': 'live with ' + body.stream.viewers + ' viewers',
                                'thumb_url': body.stream.channel.logo,
                                'image_url': body.stream.preview.large
                            }
                        ]
                    });
                }
            }
            else {
                bot.reply(message, 'error encountered');
            }
        });
    });
}

function eve(bot, message) {
    bot.api.users.info({user: message.user}, function(err, info){
        request({
            url: 'https://script.google.com/macros/s/AKfycby3FMW3ajTZVeHcNcoS5fu4ivuN23naxgSNd_mlCkAmt2yGuyUL/exec?handle=' + info.user.name + '&command=' + message.match[1],
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200 && body && body.result && body.result.message) {
                bot.reply(message, body.result.message);
            }
            else {
                bot.reply(message, 'error encountered');
            }
        });
    })
}

function cathy(bot, message) {
    bot.reply(message, 'Secretary of State, Catherine Durant');
}

var cloudHelpMessage = `
\`!cloud status\`: shows you the output of \`docker ps\`

\`!cloud register <subdomain>\`: registers a subdomain to a user

\`!cloud deploy <subdomain> <repo>/<image>:<tag>\`:

   - checks if user is authorized to deploy to \`<subdomain>\`
   - \`docker rm --force <subdomain>\`
   - \`docker pull <repo>/<image>:<tag>\`
   - \`docker run -e VIRTUAL_HOST=<subdomain>.gilgi.org -d <repo>/<image>:<tag> -n <subdomain>\`

\`!cloud help\`: prints this help message
`

function cloudHelp(bot, message) {
    bot.reply(message, cloudHelpMessage);
}

function cloudStatus(bot, message) {
    exec('docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"', function(error, stdout, stderr) {
        bot.reply(message, "```" + stdout + "```");
    });
}

function cloudRegister(bot, message) {
    var subdomain = message.match[1];
    bot.api.users.info({user: message.user}, function(err, info){
        request({
            url: 'https://script.google.com/macros/s/AKfycbwytLZ0GR0ttQq66AgwnYmTc2gvQ4o3pAzfVzsXjHT21skQLXj4/exec?action=register&user=' + info.user.name + '&subdomain=' + subdomain,
            json: true
        }, function (error, response, body) {
            if (!error && response.statusCode === 200 && body && body.result && body.result.message) {
                bot.reply(message, body.result.message);
            }
            else {
                bot.reply(message, 'error encountered');
            }
        });
    });
}

function cloudDeploy(bot, message) {
    var subdomain = message.match[1];
    var dockerImage = message.match[2];
    bot.api.users.info({user: message.user}, function(err, info){
        deploy(info.user.name, subdomain, dockerImage, function(msg) { bot.reply(message, msg) });
    });
}

function sylvanas(bot, message) {
    // I have no time for games! BWUHHH
    bot.reply(message, 'https://www.youtube.com/watch?v=578a2SdwuSI');
}

function createTarotDeck() {
    var majorArcana = ['The Fool', 'The Magician', 'The High Priestess',
        'The Empress', 'The Emperor', 'The Hierophant', 'The Lovers',
        'The Chariot', 'Strength', 'The Hermit', 'Wheel of Fortune',
        'Justice', 'The Hanged Man', 'Death', 'Temperance', 'The Devil',
        'The Tower', 'The Star', 'The Moon', 'The Sun', 'Judgement',
        'The World'];
    var suits = ['Wands', 'Pentacles', 'Cups', 'Swords'];
    var numbers = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
        'Eight', 'Nine', 'Ten', 'Page', 'Knave', 'Queen', 'King'];
    var minorArcana = [];
    for (var i = 0; i < suits.length; i++) {
        for (var j = 0; j < numbers.length; j++) {
            if (Math.random() < 0.5) {
                minorArcana.push('Inverse ' + numbers[j] + ' of ' + suits[i]);
            }
            else {
                minorArcana.push(numbers[j] + ' of ' + suits[i]);
            }
        }
    }
    return shuffleArray(majorArcana.concat(minorArcana));
}

function tarot(bot, message) {
    bot.reply(message, createTarotDeck().slice(0, 3).join(', '));
}

var defaultContexts= ['ambient', 'direct_message'];

controller.hears('^!sayhi$', defaultContexts, hello);
controller.hears('^!echo()(.*)', defaultContexts, echo);
controller.hears('^!flipcoin$', defaultContexts, flipcoin);
controller.hears('^!rtd( )?([0-9]+)?$', defaultContexts, rtd);
controller.hears('^!pickone (.*or.*)$', defaultContexts, pickone);
controller.hears('^!dota$', defaultContexts, dota);
controller.hears(['^!(.*)say$', '^!8(ball)'], defaultContexts, say);
controller.hears('^!yaspstats ([^\\s\\\\]+) (.*)$', defaultContexts, yaspstats);
controller.hears('^!(dotabuff|yasp|opendota)( )?([^\\s\\\\]+)?$', defaultContexts, dotabuff);
controller.hears('^!(jukebox|jb)( )?([^\\s\\\\]+)?$', defaultContexts, jukebox);
controller.hears('^!wolfram (.*)$', defaultContexts, wolfram);
controller.hears('^.*aotd is (.*) by (.*) <(http.*)>.*$', defaultContexts, aotdSubmit);
controller.hears('^.*album of the day is (.*) by (.*) <(http.*)>.*$', defaultContexts, aotdSubmit);
controller.hears('^!aotd$', defaultContexts, aotd);
controller.hears('^!aotd throwback$', defaultContexts, aotdThrowback);
controller.hears('^!aotd spreadsheet$', defaultContexts, aotdSpreadsheet);
controller.hears('^!scp$', defaultContexts, scp);
controller.hears('^!draft( )?(.*)?$', defaultContexts, draft);
controller.hears('^!osustats (.*)$', defaultContexts, osustats);
controller.hears('^!osu (.*)$', defaultContexts, osu);
controller.hears('^!wowstats (.*)$', defaultContexts, wowstats);
controller.hears('^!twitch', defaultContexts, twitch);
controller.hears('^!antitritz$', defaultContexts, antiTritz);
controller.hears('^!eve (.*)$', defaultContexts, eve);
controller.hears('^!cathy$', defaultContexts, cathy);
controller.hears('^!cloud help$', defaultContexts, cloudHelp);
controller.hears('^!cloud status$', defaultContexts, cloudStatus);
controller.hears('^!cloud register (.*)$', defaultContexts, cloudRegister);
controller.hears('^!cloud deploy (.*) (.*)$', defaultContexts, cloudDeploy);
controller.hears('^!sylvanas$', defaultContexts, sylvanas);
controller.hears('^!tarot$', defaultContexts, tarot);
controller.hears('^!chess$', defaultContexts, chess);
controller.hears('^!p4k$', defaultContexts, pitchfork);
controller.hears('^!debug$', 'direct_message', debugState);
controller.hears('^\\$(.*)\\$$', defaultContexts, latex);
controller.hears('(.*)', ['ambient'], updateStates);

module.exports.deploy = deploy;
