declare module '@nuxt/schema' {
  interface RuntimeConfig {
    public: {
      eventDate: string
      eventLocation: string
      eventName: string
      devMode: boolean
      defaultUserName: string
      defaultUserPassword: string
      authUrl: string
    }
  }
}
