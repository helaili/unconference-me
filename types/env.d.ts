declare module '@nuxt/schema' {
  interface RuntimeConfig {
    appEnv: string
    cosmosdb: {
      connectionString?: string
      database: string
    }
    public: {
      eventDate: string
      eventLocation: string
      eventName: string
      devMode: boolean
      authUrl: string
    }
  }
}
