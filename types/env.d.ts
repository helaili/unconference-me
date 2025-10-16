declare module '@nuxt/schema' {
  interface RuntimeConfig {
    public: {
      eventDate: string
      eventLocation: string
      eventName: string
      devMode: boolean
      authUrl: string
    }
  }
}
