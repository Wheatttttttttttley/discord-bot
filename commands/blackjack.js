const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { Game } = require('./blackjack-class/Game.js');
const { AccountManager } = require('../src/account-manager.js');

const sleep = require('util').promisify(setTimeout);

const data = new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Start a game of blackjack!')
    .addNumberOption(option =>
        option.setName('bet')
            .setRequired(true)
            .setDescription('The amount of money you want to bet.'));

function warningEmbed(title = 'ALERT', description = 'Something went wrong. Please contact me!') {
    return { embeds: [new MessageEmbed().setTitle(`:warning: ${title} :warning:`).setDescription(`**${description}**`).setColor(0xE74C3C)] };
}

async function execute(interaction) {
    // Check if bot has permission to edit the message
    if (!interaction.guild.me.permissionsIn(interaction.channel).has('MANAGE_MESSAGES')) {
        interaction.reply(warningEmbed('PERMISSION ALERT', 'Gob doesn\'t have ability to *"MANAGE_MESSAGES"*. Please try again!'));
        return;
    }

    const playerBet = interaction.options.getNumber('bet');
    // Check if bet is valid
    if (!Number.isInteger(playerBet) || playerBet < 0) {
        interaction.reply(warningEmbed('INVALID BET ALERT', 'Bet must be a *non-negative integer*'));
        return;
    }

    await AccountManager.getAccount(interaction.user.id)
        .then(player => {
            // Check if player exists
            if (!player) {
                interaction.reply(warningEmbed('ACCOUNT ALERT', 'Gob can\'t find your account. Please try again!'));
                return;
            }

            // Check if player has enough money
            if (player.balance < playerBet) {
                interaction.reply(warningEmbed('NOT ENOUGH MONEY ALERT', 'You don\'t have enough money!'));
                return;
            }
        })
        .then(async () => {
            AccountManager.updateBalance(interaction.user.id, -playerBet);

            // Create game
            const game = new Game(interaction, playerBet);
            const result = await game.gameRunner();
            await sleep(500);

            const resultEmbed = game.cardAndPointsEmbed();

            // Result of game
            switch (result) {
            case 'Win':
                AccountManager.updateBalance(interaction.user.id, playerBet * 2);

                resultEmbed.addField(':tada: WIN :tada:', `***You won ${ game.bet }!***`)
                    .setColor(0x57F287);
                break;
            case 'Blackjack':
                AccountManager.updateBalance(interaction.user.id, playerBet * 2.5);

                resultEmbed.addField(':tada: BLACKJACK :tada:', `***You got blackjack! You won ${ Math.ceil(game.bet * 1.5) }!***`)
                    .setColor(0x57F287);
                break;
            case 'Draw':
                AccountManager.updateBalance(interaction.user.id, playerBet * 1.0);

                resultEmbed.addField(':neutral_face: DRAW :neutral_face:', '***You got your bet back!***')
                    .setColor(0x99AAB5);
                break;
            case 'Lose':
                resultEmbed.addField(':sob: LOSE :sob:', `***You lost ${game.bet}$!***`)
                    .setColor(0xE74C3C);
                break;
            case 'Timeout':
                resultEmbed.addField(':sob: TIMEOUT :sob:', `***You didn't react in time! You lost ${game.bet}!***`)
                    .setColor(0xE74C3C);
                break;
            }

            await game.sendEmbed(resultEmbed);
            AccountManager.updateRole(interaction.channel, interaction.user);
        });
}

module.exports = {
    data: data,
    execute: execute,
};