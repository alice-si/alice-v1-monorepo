# Background jobs collection

Formerly known as alice-eth. It is currently coupled very
tightly with Alice production infrastructure, so tests cannot
be run without secrets for Alice sandbox environments.

# Environmental config variables
Please copy .envrc file and configure direnv tool https://direnv.net/

## MacOS direnv configuration
Run this command in terminal
```sh
brew install direnv
```
Then add the following code to the end of your ~/.bash_profile file
```sh
eval "$(direnv hook bash)"
```
