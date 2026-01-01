## Phython-Pinecone Assistant, Development by Isabel

> Get started with Pinecone Assistant manually or with no-code tools.

<Tabs>
  <Tab title="Manual">
    Use a Pinecone SDK to create an assistant, upload documents, and chat with the assistant.

    <Tip>
      To get started in your browser, use the [Assistant Quickstart colab notebook](https://colab.research.google.com/github/pinecone-io/examples/blob/master/docs/assistant-quickstart.ipynb).
    </Tip>

    ## 1. Install an SDK

    The Pinecone [Python SDK](/reference/sdks/python/overview) and [Node.js SDK](/reference/sdks/node/overview) provide convenient programmatic access to the [Assistant API](/reference/api/latest/assistant/).

    <CodeGroup>
      ```shell Python theme={null}
      pip install pinecone
      pip install pinecone-plugin-assistant
      ```

      ```shell JavaScript theme={null}
      npm install @pinecone-database/pinecone
      ```
    </CodeGroup>

    ## 2. Get an API key

    You need an API key to make calls to your assistant.

    Create a new API key in the [Pinecone console](https://app.pinecone.io/organizations/-/keys), or use the widget below to generate a key. If you don't have a Pinecone account, the widget will sign you up for the free [Starter plan](https://www.pinecone.io/pricing/).

    <div style={{minWidth: '450px', minHeight:'152px'}}>
      <div id="pinecone-connect-widget">
        <div class="connect-widget-skeleton">
          <div class="skeleton-content" />
        </div>
      </div>
    </div>

    Your generated API key:

    ```shell  theme={null}
    "{{YOUR_API_KEY}}"
    ```

    ## 3. Create an assistant

    [Create an assistant](/reference/api/latest/assistant/create_assistant), as in the following example:

    <CodeGroup>
      ```python Python theme={null}
      from pinecone import Pinecone

      pc = Pinecone(api_key="{{YOUR_API_KEY}}")

      assistant = pc.assistant.create_assistant(
          assistant_name="example-assistant", 
          instructions="Use American English for spelling and grammar.", # Description or directive for the assistant to apply to all responses.
          region="us", # Region to deploy assistant. Options: "us" (default) or "eu".
          timeout=30 # Maximum seconds to wait for assistant status to become "Ready" before timing out.
      )
      ```

      ```javascript JavaScript theme={null}
      import { Pinecone } from '@pinecone-database/pinecone'

      const pc = new Pinecone({ apiKey: "{{YOUR_API_KEY}}" });

      const assistant = await pc.createAssistant({
        name: 'example-assistant',
        instructions: 'Use American English for spelling and grammar.', // Description or directive for the assistant to apply to all responses.
        region: 'us'
      });
      ```
    </CodeGroup>

    ## 4. Upload a file to the assistant

    With Pinecone Assistant, you can upload documents, ask questions, and receive responses that reference your documents. This is known as retrieval-augmented generation (RAG).

    For this quickstart, [download a sample 10-k filing file](https://s22.q4cdn.com/959853165/files/doc_financials/2023/ar/Netflix-10-K-01262024.pdf) to your local device.

    Next, [upload the file](/reference/api/latest/assistant/upload_file) to your assistant:

    <CodeGroup>
      ```python Python theme={null}
      # Get the assistant.
      assistant = pc.assistant.Assistant(
          assistant_name="example-assistant", 
      )

      # Upload a file.
      response = assistant.upload_file(
          file_path="/path/to/file/Netflix-10-K-01262024.pdf",
          metadata={"company": "netflix", "document_type": "form 10k"},
          timeout=None
      )
      ```

      ```javascript JavaScript theme={null}
      const assistantName = 'example-assistant';
      const assistant = pc.Assistant(assistantName);

      await assistant.uploadFile({
        path: '/Users/jdoe/Downloads/example_file.txt'
      });
      ```
    </CodeGroup>

    ## 5. Chat with the assistant

    With the sample file uploaded, you can now [chat with the assistant](/reference/api/latest/assistant/chat_assistant). Ask the assistant questions about your document. It returns either a JSON object or a text stream.

    The following example requests a default response to the message, "Who is the CFO of Netflix?":

    <CodeGroup>
      ```python Python theme={null}
      from pinecone_plugins.assistant.models.chat import Message

      msg = Message(role="user", content="Who is the CFO of Netflix?")
      resp = assistant.chat(messages=[msg])

      print(resp)
      ```

      ```javascript JavaScript theme={null}
      const chatResp = await assistant.chat({
        messages: [{ role: 'user', content: 'Who is the CFO of Netflix?' }],
        model: 'gpt-4o'
      });

      console.log(chatResp);
      ```
    </CodeGroup>

    The example above returns a response like the following:

    ```
    {
        'id': '0000000000000000163008a05b317b7b', 
        'model': 'gpt-4o-2024-05-13', 
        'usage': {
            'prompt_tokens': 9259, 
            'completion_tokens': 30, 
            'total_tokens': 9289
            }, 
            'message': {
                'content': 'The Chief Financial Officer (CFO) of Netflix is Spencer Neumann.', 
                'role': '"assistant"'
                }, 
                'finish_reason': 'stop', 
                'citations': [
                    {
                        'position': 63, 
                        'references': [
                            {
                                'pages': [78, 72, 79], 
                                'file': {
                                    'name': 'Netflix-10-K-01262024.pdf', 
                                    'id': '76a11dd1...', 
                                    'metadata': {
                                        'company': 'netflix', 
                                        'document_type': 'form 10k'
                                        }, 
                                        'created_on': '2024-12-06T01:29:07.369208590Z', 
                                        'updated_on': '2024-12-06T01:29:50.923493799Z', 
                                        'status': 'Available', 
                                        'percent_done': 1.0, 
                                        'signed_url': 'https://storage.googleapis.com/...', 
                                        "error_message": null, 
                                        'size': 1073470.0
                                    }
                                }
                            ]
                        }
                    ]
                }
    ```

    <Warning>
      [`signed_url`](https://cloud.google.com/storage/docs/access-control/signed-urls) provides temporary, read-only access to the relevant file. Anyone with the link can access the file, so treat it as sensitive data. Expires in one hour.
    </Warning>

    ## 6. Clean up

    When you no longer need the `example-assistant`, [delete the assistant](/reference/api/latest/assistant/delete_assistant):

    <Warning>
      Deleting an assistant also deletes all files uploaded to the assistant.
    </Warning>

    <CodeGroup>
      ```python Python theme={null}
      pc.assistant.delete_assistant(
          assistant_name="example-assistant", 
      )
      ```

      ```javascript JavaScript theme={null}
      await pc.deleteAssistant('example-assistant');
      ```
    </CodeGroup>

    ## Next steps

    * Learn more about [Pinecone Assistant](/guides/assistant/overview)
    * Learn about [additional assistant features](https://www.pinecone.io/learn/assistant-api-deep-dive/)
    * [Evaluate](/guides/assistant/evaluate-answers) the assistant's responses
    * View a [sample app](/examples/sample-apps/pinecone-assistant) that uses Pinecone Assistant
  </Tab>

  <Tab title="n8n">
    Create an [n8n](https://docs.n8n.io/choose-n8n/) workflow that downloads files via HTTP and lets you chat with them using Pinecone Assistant and OpenAI.

    ## 1. Get API keys

    Your n8n workflow will need API keys for Pinecone and OpenAI.

    <Steps>
      <Step title="Get a Pinecone API key">
        Create a new API key in the [Pinecone console](https://app.pinecone.io/organizations/-/keys), or use the widget below to generate a key. If you don't have a Pinecone account, the widget will sign you up for the free [Starter plan](https://www.pinecone.io/pricing/).

        <div style={{minWidth: '450px', minHeight:'152px'}}>
          <div id="pinecone-connect-widget">
            <div class="connect-widget-skeleton">
              <div class="skeleton-content" />
            </div>
          </div>
        </div>

        Your generated API key:

        ```shell  theme={null}
        "{{YOUR_API_KEY}}"
        ```
      </Step>

      <Step title="Get an OpenAI API key">
        Create a new API key in the [OpenAI console](https://platform.openai.com/api-keys).
      </Step>
    </Steps>

    ## 2. Create an assistant

    [Create an assistant](https://app.pinecone.io/organizations/-/projects/-/assistant) in the Pinecone console:

    * Name your assistant `n8n-assistant`.
    * Create it in the `United States` region.

    ## 3. Set up n8n

    <Steps>
      <Step title="Create a new workflow">
        In your n8n account, [create a new workflow](https://docs.n8n.io/workflows/create/).
      </Step>

      <Step title="Import a workflow template">
        Copy this workflow template URL:

        ```shell  theme={null}
        https://raw.githubusercontent.com/pinecone-io/n8n-templates/refs/heads/main/quickstart/assistant-quickstart.json
        ```

        Paste the URL into the workflow editor and then click **Import** to add the workflow.
      </Step>

      <Step title="Add credentials to the workflow">
        * Add your Pinecone credentials:
          * In the **Upload file to assistant** node, select **PineconeApi** > **Create new credential** and paste in your Pinecone API key.
          * In the **Pinecone Assistant**, select **Credential for Bearer Auth** > **Create new credential** and paste in your Pinecone API key.

        * Add your OpenAI credentials:
          * In the **OpenAI Chat Model**, select **Credential to connect with** > **Create new credential** and paste in your OpenAI API key.
      </Step>

      <Step title="Activate the workflow">
        The workflow is configured to download recent Pinecone release notes and upload them to your assistant. Click **Execute workflow** to start the workflow.

        <Tip>
          You can add your own files to the workflow by changing the URLs in the **Set file urls** node.
        </Tip>
      </Step>
    </Steps>

    ## 4. Chat with your docs

    Once the workflow is activated, ask it for the latest changes to Pinecone Assistant:

    ```
    What's new in Pinecone Assistant?
    ```

    ## Next steps

    * Modify the workflow to your own use case:
      * Change the urls in **Set file urls** node to use your own files.
      * Customize the system message on the **AI Agent** node to your use case.
      * To help manage token consumption, change the `top_k` value of results returned from your assistant by adding "and should set a top\_k of 3" to the system message.
    * Use n8n, Pinecone Assistant, and OpenAI to [chat with your Google Drive documents](https://n8n.io/workflows/9942-rag-powered-document-chat-with-google-drive-openai-and-pinecone-assistant/).
    * Learn more about [Pinecone Assistant](/guides/assistant/overview).
    * Get help in the [Pinecone Discord community](https://discord.gg/tJ8V62S3sH) or the [Pinecone Forum](https://community.pinecone.io/).
  </Tab>
</Tabs>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.pinecone.io/llms.txt
