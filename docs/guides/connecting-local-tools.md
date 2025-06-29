# Connecting Local and Custom Tools

One of the powerful features of this version of Gemini CLI is the ability to connect to custom tool servers using the Model Context Protocol (MCP). This allows you to extend the CLI's capabilities with your own private or specialized tools.

## How it Works

The CLI can be configured to connect to one or more MCP servers at startup. It will contact each server to discover the tools it provides and make them available to the AI model during your conversations.

## Example: Connecting a Local Server

Let's say you have a custom tool server (like the `data-oasis-searcher` from the `eidolon-engine` project) running on your local machine at `http://localhost:3000`.

To connect the CLI to it:

1.  **Create a local settings file:** In the root directory of your `gemini-cli` project, create a directory named `.gemini`, and inside it, a file named `settings.json`.

2.  **Configure the server:** Add the following configuration to your `.gemini/settings.json` file.

    ```json
    {
      "mcpServers": {
        "my_custom_tools": {
          "url": "http://localhost:3000",
          "enabled": true
        }
      }
    }
    ```

    - **`my_custom_tools`**: This is a local alias for your server. If there are name conflicts, the CLI will use this alias as a prefix (e.g., `my_custom_tools__tool_name`).
    - **`url`**: The address of your running MCP server.

3.  **Start the CLI:** The next time you run the CLI, it will automatically connect to your server. You can verify that the tools are available by using the `/mcp` command.

_Note: The `.gemini` directory is ignored by git, so your local server configurations will not be committed to the repository._
