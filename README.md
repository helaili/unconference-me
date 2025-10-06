# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Azure deployment setup
1. Create a resource group in Azure (e.g., `unconference-me`).
2. Configure the the federated identity credentials in the Azure portal for GitHub Actions OIDC. See [this documentation](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect) for details on setting up OIDC with GitHub and Azure. You will create two federated credentials, one for the production environment and one for the staging environment: *Entity type* set to `environment` and *Based on selection* set to `production` and `staging`.
3. Create the following GitHub repository variables:
  - `AZURE_WEBAPP_NAME`: The name of your Azure Web App (e.g., `unconference-me`)
  - `AZURE_RESOURCE_GROUP`: The name of your Azure Resource Group (e.g., `unconference-me`)
4. Create the following GitHub repository secrets:
  - `AZURE_CLIENT_ID`: The Application (client) ID of the Azure AD app
  - `AZURE_TENANT_ID`: The Directory (tenant) ID of the Azure AD app
  - `AZURE_SUBSCRIPTION_ID`: The Subscription ID of your Azure subscription


## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
