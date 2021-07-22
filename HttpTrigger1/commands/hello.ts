import {
  SlashCommand,
  CommandOptionType,
  CommandContext,
  SlashCreator,
} from "@sotrx/slash-create";
import { env } from "process";

export class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    let cDesc = {
      name: "hello",
      description: "Says hello to you.",
      guildIDs: ["867048548838539326"],
      options: [
        {
          type: CommandOptionType.STRING,
          name: "food",
          description: "What food do you like?",
        },
      ],
    };
    if (env.COMMANDS_GUILD_ID)
      cDesc = Object.assign(cDesc, { guildIDs: [env.COMMANDS_GUILD_ID] });

    super(creator, cDesc);

    // Not required initially, but required for reloading with a fresh file.
    this.filePath = __filename;
  }

  async run(ctx: CommandContext): Promise<string> {
    return ctx.options.food
      ? `You like ${ctx.options.food}? Nice!`
      : `Hello, ${ctx.user.username}!`;
  }
}
