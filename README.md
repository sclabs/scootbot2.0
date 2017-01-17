scootbot2.0
===========

custom multi-purpose slack chatbot

Quick start
-----------

1. Clone this repository with

        git clone git://github.com/sclabs/scootbot2.0.git

2. Set the following environment variables, for example in `~/.bashrc`

        export SCOOTBOT_TOKEN=...
        export OSU_API_KEY=...
        export STEAM_API_KEY=...
        export SCOOTBOT_WEBHOOK_SECRET=...
        export SCOOTBOT_TWITCH_CLIENT_ID=...

3. Install core dependencies with

        npm install

4. Test the bot by running it once with

        npm start

5. Install `forever` with

        sudo npm install -g forever

6. Run the bot in the background with

        npm run forever
