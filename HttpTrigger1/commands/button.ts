import {
  SlashCommand,
  ComponentType,
  ButtonStyle,
  SlashCreator,
  CommandContext,
  ComponentContext,
} from "@sotrx/slash-create";
import { env } from "process";

export class ButtonCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    let cDesc = {
      name: "button",
      description: "Show some buttons.",
      guildIDs: ["867048548838539326"],
    };
    if (env.COMMANDS_GUILD_ID)
      cDesc = Object.assign(cDesc, { guildIDs: [env.COMMANDS_GUILD_ID] });
    super(creator, cDesc);
    // Not required initially, but required for reloading with a fresh file.
    this.filePath = __filename;
  }

  async run(ctx: CommandContext): Promise<void> {
    // There is a 3 seconds windows to answer to an interactions.
    // Deferring the response sends an acknowledge, informing Discord that we are going
    // to answer
    await ctx.defer();

    await ctx.send("here is some buttons", {
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.PRIMARY,
              label: "button",
              custom_id: "example_button",
              emoji: {
                name: "👌",
              },
            },
          ],
        },
      ],
    });

    /**
     * This function handles component contexts within a command, so you
     * can use the previous context aswell.
     */
    ctx.registerComponent(
      "example_button",
      async (btnCtx: ComponentContext) => {
        await btnCtx.editParent("You clicked the button!");
      }
    );
  }
}
