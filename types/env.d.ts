declare module '@nuxt/schema' {
  interface RuntimeConfig {
    public: {
      eventName: string
      devMode: boolean
      defaultUserName: string
      defaultUserPassword: string
      authUrl: string
    }
  }
}
