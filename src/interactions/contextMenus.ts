import { ContextMenuInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { fetchGuildData } from "../daos/GuildDataDAO";

export async function contextConvertToAnswer(interaction: ContextMenuInteraction): Promise<void> {
	await interaction.deferReply({ ephemeral: true });
	const guild = interaction.guild;

	if (guild) {
		const fetchResult = await fetchGuildData(guild.id);
		const guildData = fetchResult.guildData;

		if (guildData) {
			const message = interaction.options["_hoistedOptions"][0].message as Message;

			if (message) {
				const channel = message.channel;

				if (channel && channel.isThread()) {
					const parent = channel.parentId;

					if (parent && guildData.validChannels.includes(parent)) {
						const author = message.author.id;

						if (interaction.user.id === author) {
							// convert to answer.
							if (message.embeds.length > 0) {
								await interaction.editReply("This message is already an answer.");
							} else {
								const content = message.content;
								const member = await guild.members.fetch(author);

								await channel.send({
									embeds: [
										new MessageEmbed()
											.setTitle("Answer")
											.setAuthor(member.displayName)
											.addField("\u200b", content, true)
											.setFooter("Upvotes: 0 | Downvotes: 0"),
									],
									components: [
										new MessageActionRow().addComponents([
											new MessageButton()
												.setCustomId("upvote")
												.setLabel("Upvote")
												.setStyle("PRIMARY"),
											new MessageButton()
												.setCustomId("downvote")
												.setLabel("Downvote")
												.setStyle("DANGER"),
										]),
									],
								});

								await message.delete();
								await interaction.editReply("Message successfully converted to an answer.");
							}
						} else {
							await interaction.editReply(
								"You are not allowed to convert another member's message to a answer."
							);
						}
					} else {
						await interaction.editReply("This channel is not under valid reputation gainable channel.");
					}
				} else {
					await interaction.editReply("This is not a valid location to convert a message to an answer.");
				}
			}
		} else {
			await interaction.editReply(fetchResult.message);
		}
	} else {
		await interaction.editReply("Failed to fetch guildId from interaction.");
	}

	return;
}

export async function contextConvertToQuestion(interaction: ContextMenuInteraction): Promise<void> {
	await interaction.deferReply({ ephemeral: true });
	const guildId = interaction.guildId;

	if (guildId) {
		const fetchResult = await fetchGuildData(guildId);
		const guildData = fetchResult.guildData;

		if (guildData) {
			const message = interaction.options["_hoistedOptions"][0].message as Message;

			if (message) {
				const channel = message.channelId;

				if (guildData.validChannels.includes(channel)) {
					const author = message.author.id;

					if (interaction.user.id === author) {
						// convert to question.
						if (!message.hasThread) {
							await message.startThread({
								name: message.content.substring(
									0,
									message.content.indexOf("?") || message.content.indexOf(".")
								),
								autoArchiveDuration: 1440,
								reason: `contextConvertToQuestion by ${interaction.user.username}`,
							});

							await interaction.editReply("Successfully converted message to question.");
						} else {
							await interaction.editReply(
								`This message already has an existing question. <#${message.thread?.id}>`
							);
						}
					} else {
						await interaction.editReply(
							"You are not allowed to convert another member's message to a question."
						);
					}
				} else {
					await interaction.editReply("This channel is not a valid reputation gainable channel.");
				}
			}
		} else {
			await interaction.editReply(fetchResult.message);
		}
	} else {
		await interaction.editReply("Failed to fetch guildId from interaction.");
	}

	return;
}

export async function contextAcceptAnswer(interaction: ContextMenuInteraction): Promise<void> {
	await interaction.reply({ ephemeral: true, content: "NYI - contextAcceptAnswer" });
}

export async function contextFlag(interaction: ContextMenuInteraction): Promise<void> {
	await interaction.reply({ ephemeral: true, content: "NYI - contextFlag" });
}
