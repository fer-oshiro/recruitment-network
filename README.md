# Back-end para GuildedIn

Esse repositório contempla o back-end e a autenticação para o jogo GuildedIn

## Stack do projeto
- [sst](https://sst.dev/docs/): Para criar o servidor
- [openai](https://beta.openai.com/docs/): Para criar a inteligência artificial

## Rodando o projeto localmente
- Criar um perfil no [openai](https://platform.openai.com/docs/overview) e pegar a chave de acesso
- Salvar chave no AWS Secrets Manager com o nome `prod/recruitment_network` e a chave `openai`
- Criar um perfil na aws e pegar a chave de acesso
- Login na aws usando o comando `aws configure --profile dev`
- Rodar localmente com `npm run dev`
