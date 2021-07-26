# Discord Serverless bot template

[![Deploy to Azure](https://img.shields.io/badge/Deploy%20To-Azure-blue?logo=microsoft-azure)](https://portal.azure.com/?WT.mc_id=dotnet-0000-frbouche#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FSoTrx%2Fazure-serverless-discord-bot%2Fmaster%2Fdeploy.json)

This project is a tutorial about about to build a serverless discord bot on Azure. Although Azure Functions will be used in this example, the concepts should apply to any Cloud provider having a FaaS offer (AWS Lambdas, GCP Cloud Functions...)

This bot is fairly simple and only has two commands :

- hello : A greeting command
- button : Displaying a clickable button

## Deploying the example bot

### Creating a new Discord app

First, a discord application must be created.

- Go to to [Discord Developers Portal Applications Page](https://discord.com/developers/applications).
- Create a new application. Take not of the **application ID**, **application public key**, and **application bot token** (in the bot section, creating a new bot).

Next, the code can be deployed to Azure.

### Deploying the code to Azure

You can use the **deploy to Azure** button to deploy the function directly in your subscription. Fill the **application ID**, **application public key**, and **application bot token** when prompted. 

You can also provide a **guild id**. Providing a guild id allows for an immediate syncing of the commands with that particular guild. When a guild id isn't provided, the commands will be synced will all the guilds, but this process can **take up to an hour**. 

In any case, copy the function URL. It should follow this pattern :

    https://[function-app-name].azurewebsites.net/api/[function-name]

### Linking Discord to the Function

- Go back on On the application's page, fill the "Interactions endpoint URL" input with the retrieved Function URL.
- Invite your application to your server using this URL: `https://discord.com/oauth2/authorize?client_id=[client-id]&scope=applications.commands`
- You're ready to go!

## Debugging

To debug the bot locally, and to not deploy the bot every time a change is made to the code, we can use a local interactions enpoint URL, forwarded to the Internet with ngrok.

Either go the the [ngrok website](https://ngrok.com/download) or use a package manager to install ngrok.

Once it's done, just execute `npm start` to run the function, and then `npm run forward` to start forwarding your local port 7071 to the internet with ngrok. This will give you a https://\*.ngrok.io URL that you can copy paste into the [Discord Developers Portal Applications Page](https://discord.com/developers/applications) "Interactions endpoint URL".

Beware that ngrok sessions expires after 2 hours, you'll need to restart the `npm run forward` command.

## Background

### Discord Interaction

Recently, the way Discord bot are made changed. The classic way to build a bot is to use a fake user, watching for specific messages on the chat and reacting to them. Although pretty straightforward, this model is stateful by design, and does not really translate well in a serverless model.

But a new way to interact with bots has been released : Interactions.

Interactions are basically webhooks. Instead of the bot watching for new messages, you can directly query the bot using **slash commands**. Each time a slash command is inputted, Discord send a POST request to a **gateway endpoint**. The bot simply listen for calls to its gateway and answer it.

This model allow for a broader set of interactions. Instead on just relying on a CLI, the bot could be notified of a [click on a reactive component](https://discord.com/developers/docs/interactions/message-components).

Of course, this new method is not meant to completely replace the old "user bot" way. Some bots (i.e music bot) can't use interactions to play music, as they need to join a Voice Channel.

### Serverless

Using interactions, we can create a stateless bot. This stateless bot doesn't need any sharding, as the function itself can scale up and down.

## How it works

The [slash-create](https://github.com/Snazzah/slash-create) library, used for this bot, act as a middleware, sugar-coating all the webhooks part.

If you take a look at the `index.ts` file, no function is defined or exported.

```js
const creator = new SlashCreator({
  applicationID: env.BOT_APP_ID,
  publicKey: env.BOT_APP_PUBLIC_KEY,
  token: env.BOT_APP_TOKEN,
});

await creator
  // This is where the function is actually created.
  .withServer(new AzureFunctionServer(module.exports))
  .registerCommandsIn(join(__dirname, "commands"));

if (env.COMMANDS_GUILD_ID !== undefined)
  creator.syncCommandsIn(env.COMMANDS_GUILD_ID);
else creator.syncCommands();
```

What's really going on is that the _AzureFunctionServer_ class is exporting the actual function used (hence why it requires the module.exports). If we take a look at this class:

```ts
class AzureFunctionServer extends Server {
  private _handler?: RequestHandler;

  constructor(moduleExports: any, target = "interactions") {
    super({ alreadyListening: true });
    // The function is exported here
    moduleExports[target] = this._onRequest.bind(this);
  }

  // Here is the exported HTTP Trigger Azure Function
  private _onRequest(context: Context, req: HttpRequest) {
    // Removed some lines here
    // When a new interactions comes, check if there is a handler and passthrough the response
    this._handler!(
      {
        headers: req.headers,
        body: req.body,
        request: req,
        response: context.res,
      },
      async (response) => {
        /* ... */
      }
    );
  }
  // Removed some lines here
}
```


## Going forward

This project focuses the simplest implementation. For long running operations or complex workloads, Durable Functions would be a better solution.
