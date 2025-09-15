---
applyTo: '**'
---
# General coding instructions and preferences that AI should follow.

- When instructed to change the code, if not clear, ask for specifics.
- Don't apply additional changes, or make assumptions about the code not relevant to the issue.
- Don't add new features or refactor code unless explicitly requested.
- If instructed to keep the functionality or part of functionality same, do not change the code in a way that alters its behavior.
- If the code is already correct, do not change it.
- If it's established in the conversation that the code is correct, do not return to it later unless specifically asked to.
- Recognize if, while searching for solutions, the conversation is going in circles, and if so, stop repeating the same suggestions or solutions.
- When asked for implementing a feature from other code, analyze the way how it should be implemented, and if it is not clear, ask for specifics.
- If asked to implement a feature in a certain way, and you assess that this way is not the best, explain why and suggest a better way, but do not implement it in the way you think is better unless explicitly requested.
- When asked to assess the user explanation, or guidelines, do not make assumptions about the code or the issue, and do not apply your own interpretation of the guidelines.
- When asked to assess the user explanation, or guidelines, analyze deeply the explanation, and if you don't agree with the user explanation, answer that you don't agree, why you don't agree, and provide an alternative solution.
- When added console logs to code for debugging and it is established that from logs that code works as intended, remove those console.log statements on next interaction.
- If, in your assessment, the request is not possible, provide answer with such the assessment and an explanation.
- Before running the terminal command or task, check if the terminal is already running a command, especially npm start (watching for changes), and if so, ask the user to stop it first.

## Short codes

Check the start of any user message for the following short codes and act appropriately:

- ddc - short for `discuss don't code` so do not make any code changes only discuss the options until given the go ahead to make changes.
- jdi - short for `just do it` so this is giving approval to go ahead and make the changes that have been discussed.
