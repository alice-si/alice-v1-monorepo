# Donations web application

This is the main Alice application hosted at https://donationsapp.alice.si.
Formerly known as alice-web.

## Running and testing

It is currently coupled very tightly with Alice production infrastructure,
so tests cannot be run without secrets for Alice sandbox environments.

## Running for Alice developers
- Copy .envrc file to packages/donations-app
- Then simply run in terminal
```sh
$ cd packages/donations-app
$ yarn dev
```
