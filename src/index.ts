import { ApplicationCommandData, ApplicationCommandPermissionData, Client, Intents, Permissions } from "discord.js";
import { readFileSync } from "fs";
import { connect } from "mongoose";
import { createGuildData } from "./daos/GuildDataDAO";
import {
	contextAcceptAnswer,
	contextConvertToAnswer,
	contextConvertToQuestion,
	contextFlag,
} from "./interactions/contextMenus";
import { slashCommandSet, slashCommandUpdate, slashCommandView } from "./interactions/slashCommands";

function main(client: Client, dbUri: string) {
	client.once("ready", () => {
		console.log("Client logged in.");

		const context_convert_to_answer = { name: "Convert to Answer", type: 3 };
		const context_convert_to_question = { name: "Convert to Question", type: 3 };
		const context_accept_answer = { name: "Accept Answer", type: 3 };
		const context_flag = { name: "Flag", type: 3 };

		const slash_command_update: ApplicationCommandData = {
			name: "update",
			description: "Toggle a valid channel (up to 5) for this guild.",
			options: [
				{
					type: "CHANNEL",
					name: "channel-1",
					description: "Channel to toggle",
					required: true,
				},
				{
					type: "CHANNEL",
					name: "channel-2",
					description: "Channel to toggle",
				},
				{
					type: "CHANNEL",
					name: "channel-3",
					description: "Channel to toggle",
				},
				{
					type: "CHANNEL",
					name: "channel-4",
					description: "Channel to toggle",
				},
				{
					type: "CHANNEL",
					name: "channel-5",
					description: "Channel to toggle",
				},
			],
			defaultPermission: false,
		};

		const slash_command_view: ApplicationCommandData = {
			name: "view",
			description: "View valid channels in mentioned format.",
		};

		const slash_command_set: ApplicationCommandData = {
			name: "set",
			description: "Set the reportChannel",
			options: [
				{
					type: "CHANNEL",
					name: "reportchannel",
					description: "The channel flagged messages get sent to.",
					required: true,
				},
			],
			defaultPermission: false,
		};

		const command_application_payload = [
			context_convert_to_answer,
			context_convert_to_question,
			context_accept_answer,
			context_flag,
			slash_command_update,
			slash_command_view,
			slash_command_set,
		];

		client.guilds
			.fetch()
			.then(guilds => {
				guilds.forEach(oauthGuild => {
					oauthGuild
						.fetch()
						.then(guild => {
							const commands = guild.commands;
							if (commands) {
								commands
									.set(command_application_payload)
									.then(commandData => {
										const slash_command_update = commandData.find(
											commandObject => commandObject.name === "update"
										);
										const slash_command_set = commandData.find(
											commandObject => commandObject.name === "set"
										);

										if (slash_command_update && slash_command_set) {
											const permissibleRoles: ApplicationCommandPermissionData[] = [];

											guild.roles
												.fetch()
												.then(roles => {
													roles.forEach(role => {
														if (role.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
															permissibleRoles.push({
																id: role.id,
																type: "ROLE",
																permission: true,
															});
														}
													});
												})
												.then(() => {
													commands.permissions
														.set({
															fullPermissions: [
																{
																	id: slash_command_update.id,
																	permissions: permissibleRoles,
																},
																{
																	id: slash_command_set.id,
																	permissions: permissibleRoles,
																},
															],
														})
														.catch(console.warn.bind(console));
												})
												.catch(console.warn.bind(console));
										} else {
											console.error("Could not find slash_command_update");
										}
									})
									.catch(console.warn.bind(console));
							}
						})
						.catch(console.warn.bind(console));
				});
			})
			.catch(console.warn.bind(console));
	});

	/**
	 	Needed Events

		messageCreate
		- question inference

		interactionCreate
		- buttons
		  + upvote
		  + downvote
		- context_menus
		  + convert_to_answer
		  + convert_to_question
		  + accept_answer
		  + flag
		    * spam
		    * broad
			* other
	*/

	client.on("messageCreate", () => {
		console.log("Message received.");

		// check if message is in valid channel for guild
	});

	client.on("interactionCreate", async interaction => {
		if (interaction.isCommand()) {
			if (interaction.commandName === "update") {
				await slashCommandUpdate(interaction);
			} else if (interaction.commandName === "view") {
				await slashCommandView(interaction);
			} else if (interaction.commandName === "set") {
				await slashCommandSet(interaction);
			} else {
				interaction
					.reply({ ephemeral: true, content: "Invalid interactionData received." })
					.catch(console.error.bind(console));
			}
		} else if (interaction.isContextMenu()) {
			if (interaction.commandName === "Convert to Answer") {
				await contextConvertToAnswer(interaction);
			} else if (interaction.commandName === "Convert to Question") {
				await contextConvertToQuestion(interaction);
			} else if (interaction.commandName === "Accept Answer") {
				await contextAcceptAnswer(interaction);
			} else if (interaction.commandName === "Flag") {
				await contextFlag(interaction);
			} else {
				interaction
					.reply({ ephemeral: true, content: "Invalid interactionData received." })
					.catch(console.error.bind(console));
			}
		}
	});

	client.on("guildCreate", guild => {
		createGuildData(guild.id).catch(console.warn.bind(console));
	});

	// Connect to the database.
	connect(dbUri, {
		ssl: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).catch(console.warn.bind(console));
}

try {
	const { token, dbUri } = JSON.parse(readFileSync("token.json", "utf-8")) as { token: string; dbUri: string };

	if (token.length === 0) {
		throw new Error("Invalid token provided. Please be sure that `token.json` contains your bot token.");
	}

	const client = new Client({
		intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
	});

	client
		.login(token)
		.then(() => main(client, dbUri))
		.catch(console.error.bind(console));
} catch (e) {
	console.error(e);
}
