import { SlashCommandSubcommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { addBalanceXP } from '../../../handlers/account-manager';
import { ResultEmbed } from '../roulette';

export const lineSubcommand = new SlashCommandSubcommandBuilder()
    .setName('line')
    .setDescription('Play a line roulette, pay 5:1')
    .addNumberOption(options => options.setName('bet')
        .setRequired(true)
        .setDescription('The amount of chips you want to bet'))
    .addStringOption(options => options.setName('guess')
        .setRequired(true)
        .setDescription('The numbers you want to bet on')
        .addChoices([
            ['1 2 3 4 5 6', '1 2 3 4 5 6'],
            ['4 5 6 7 8 9', '4 5 6 7 8 9'],
            ['7 8 9 10 11 12', '7 8 9 10 11 12'],
            ['10 11 12 13 14 15', '10 11 12 13 14 15'],
            ['13 14 15 16 17 18', '13 14 15 16 17 18'],
            ['16 17 18 19 20 21', '16 17 18 19 20 21'],
            ['19 20 21 22 23 24', '19 20 21 22 23 24'],
            ['22 23 24 25 26 27', '22 23 24 25 26 27'],
            ['25 26 27 28 29 30', '25 26 27 28 29 30'],
            ['28 29 30 31 32 33', '28 29 30 31 32 33'],
            ['31 32 33 34 35 36', '31 32 33 34 35 36'],
        ]));

export const lineRun = (interaction: CommandInteraction, bet: number, rndNumber: number) => {
    const guess = interaction.options.getString('guess') || '';
    const result = guess.split(' ').includes(rndNumber.toString());
    if (result) {
        addBalanceXP(interaction.user.id, bet * 6, bet * 5);

        interaction.editReply({ embeds: [ResultEmbed('win', rndNumber, guess, bet, bet * 5)] });
    } else {
        interaction.editReply({ embeds: [ResultEmbed('lose', rndNumber, guess, bet, -bet)] });
    }
};