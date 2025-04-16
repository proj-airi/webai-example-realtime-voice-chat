# Start contributing to [webai-realtime-voice-chat](https://github.com/moeru-ai/airi)

Hello! Thank you for your interest in contributing to this project. This guide will help you get started.

## Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js 23+](https://nodejs.org/en/download/)
- [corepack](https://github.com/nodejs/corepack)
- [pnpm](https://pnpm.io/installation)

<details>
<summary>Windows setup</summary>

1. Open PowerShell
2. Install [`scoop`](https://scoop.sh/)

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
   ```

3. Install `git`, `node` through `scoop`

   ```powershell
   scoop install git nodejs
   ```

4. Install `pnpm` through `corepack`

   ```powershell
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

</details>

<details>
<summary>macOS setup</summary>

0. Open Terminal, (or iTerm2, Ghostty, Kitty, etc.)
1. Install `git`, `node` through `brew`

   ```shell
   brew install git node
   ```

2. Install `pnpm` through `corepack`

   ```shell
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

</details>

<details>
<summary>Linux setup</summary>

0. Open Terminal
1. Follow [nodesource/distributions: NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions?tab=readme-ov-file#table-of-contents) to install `node`
2. Follow [Git](https://git-scm.com/downloads/linux) to install `git`
3. Install `pnpm` through `corepack`

   ```shell
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

</details>

## If you have already contributed to this project before

> [!WARNING]
>
> If you haven't clone this repository, skip this section.

Make sure your local repository is up to date with the upstream repository:

```shell
git fetch -all
git checkout main
git pull upstream main --rebase
```

If you have a working branch, to make your branch up to date with the upstream repository:

```shell
git checkout <your-branch-name>
git rebase main
```

## Fork this project

Click on the **Fork** button on the top right corner of the [moeru-ai/airi](https://github.com/moeru-ai/airi) page.

## Clone

```shell
git clone https://github.com/<your-github-username>/airi.git
cd airi
```

## Create your working branch

```shell
git checkout -b <your-branch-name>
```

## Install dependencies

```shell
corepack enable
pnpm install
```

> [!NOTE]
>
> We would recommend to install [@antfu/ni](https://github.com/antfu-collective/ni) to make your script simpler.
>
> ```shell
> corepack enable
> npm i -g @antfu/ni
> ```
>
> Once installed, you can
>
> - use `ni` for `pnpm install`, `npm install` and `yarn install`.
> - use `nr` for `pnpm run`, `npm run` and `yarn run`.
>
> You don't need to care about the package manager, `ni` will help you choose the right one.

## Choose the application you want to develop on

### VAD demo

```shell
pnpm -F @proj-airi/vad dev
```

> [!NOTE]
>
> For [@antfu/ni](https://github.com/antfu-collective/ni) users, you can
>
> ```shell
> nr -F @proj-airi/vad dev
> ```

### VAD + ASR / STT demo

```shell
pnpm -F @proj-airi/vad-asr dev
```

> [!NOTE]
>
> For [@antfu/ni](https://github.com/antfu-collective/ni) users, you can
>
> ```shell
> nr -F @proj-airi/vad-asr dev
> ```

### VAD + ASR / STT + LLM Chat demo

```shell
pnpm -F @proj-airi/vad-asr-chat dev
```

> [!NOTE]
>
> For [@antfu/ni](https://github.com/antfu-collective/ni) users, you can
>
> ```shell
> nr -F @proj-airi/vad-asr-chat dev
> ```

## Commit

### Before commit

> [!CAUTION]
>
> Please make sure lint (static checkers) and TypeScript compilers are satisfied:
>
> ```shell
> pnpm packages:stub && pnpm lint && pnpm typecheck
> ```

> [!NOTE]
>
> If you have [@antfu/ni](https://github.com/antfu-collective/ni) installed, you can use `nr` to run the commands:
>
> ```shell
> nr packages:stub && nr lint && nr typecheck
> ```

### Commit

```shell
git add .
git commit -m "<your-commit-message>"
```

### Push to your fork repository

```shell
git push origin <your-branch-name> -u
```

You should be able to browse the branch on your fork repository.

> [!NOTE]
>
> If this is your first time contributing with this project, you need to add the upstream repository too:
>
> ```shell
> git remote add upstream https://github.com/proj-airi/webai-realtime-voice-chat.git
> ```

## Creating Pull Request

Navigate to [proj-airi/webai-realtime-voice-chat](https://github.com/proj-airi/webai-realtime-voice-chat) page, click on the **Pull requests** tab, and click on the **New pull request** button, click on the **Compare across forks** link, and select your fork repository.

Review the changes, and click on the **Create pull request** button.

## Whooo-ya! You made it!

Congratulations! You made your first contribution to this project. You can now wait for the maintainers to review your pull request.
