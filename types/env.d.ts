declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // Server-side only config
    cosmosdb: {
      connectionString?: string
      database: string
    }
    appEnv: string
    logLevel: string
    
    // Public config available on both client and server
    public: {
      eventDate: string
      eventLocation: string
      eventName: string
      devMode: boolean
      authUrl: string
    }
  }
}
