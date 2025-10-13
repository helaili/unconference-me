// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'light'
    },
    display: {
      mobileBreakpoint: 'sm',
      thresholds: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    defaults: {
      VBtn: {
        class: 'text-none', // Removes uppercase transformation for better mobile readability
        style: 'min-height: 44px;', // Ensure minimum touch target size
      },
      VCard: {
        elevation: 2,
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VSelect: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VTextarea: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VListItem: {
        style: 'min-height: 48px;', // Ensure minimum touch target size for list items
      },
      VExpansionPanelTitle: {
        style: 'min-height: 48px;', // Ensure minimum touch target size
      },
      VAppBarNavIcon: {
        style: 'min-width: 44px; min-height: 44px;', // Ensure minimum touch target size
      },
    },
  })
  app.vueApp.use(vuetify)
})
