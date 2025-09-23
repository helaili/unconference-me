declare module '@nuxt/schema' {
  interface RuntimeConfig {
    public: {
      devMode: boolean
      defaultUserName: string
      defaultUserPassword: string
    }
  }
}
