var request = require('request');
var exec = require('child_process').exec;


module.exports.deploy = function(username, subdomain, dockerImage, callback) {
    request({
        url: 'https://script.google.com/macros/s/AKfycbwytLZ0GR0ttQq66AgwnYmTc2gvQ4o3pAzfVzsXjHT21skQLXj4/exec?action=check&user=' + username + '&subdomain=' + subdomain,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200 && body && body.result && body.result.message) {
            if (body.result.message === 'authorized') {
                var cmd = 'docker rm --force ' + subdomain;
                console.log(cmd);
                exec(cmd, function(error, stdout, stderr) {
                    var cmd = 'docker pull ' + dockerImage;
                    console.log(cmd);
                    exec(cmd, function(error, stdout, strerr) {
                        var environment = '';
                        if (body.result.env) {
                            for (var i=0; i < body.result.env.length; i++){
                                environment += '-e ' + body.result.env[i] + ' ';
                            }
                        }
                        var volume = '';
                        if (body.result.volume) {
                            volume = '-v /home/scootbot/' + subdomain + ':' + body.result.volume;
                        }
                        var cmd = 'docker run -d ' +
                            '-e VIRTUAL_HOST=' + subdomain + '.gilgi.org ' +
                            '-e LETSENCRYPT_HOST=' + subdomain + '.gilgi.org ' +
                            '-e LETSENCRYPT_EMAIL=admin@gilgi.org ' + environment + volume +
                            ' --name ' + subdomain + ' ' + dockerImage;
                        console.log(cmd);
                        exec(cmd, function(error, stdout, strerr) {
                            callback('deploy successful');
                        });
                    });
                });
            }
            else {
                callback('you are not authorized to deploy to this subdomain');
            }
        }
        else {
            callback('error encountered');
        }
    });
};
