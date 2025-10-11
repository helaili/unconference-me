<script setup lang="ts">
  const runtimeConfig = useRuntimeConfig()
  const title = ref(runtimeConfig.public.eventName || 'Unconference.me');
  const location = ref(runtimeConfig.public.eventLocation || 'Planet Earth');
  const date = ref(runtimeConfig.public.eventDate || 'TBD');

</script>
<template>
  <v-container class="text-center py-8 py-md-16">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 :class="$vuetify.display.smAndDown ? 'text-h3' : 'text-h2'" class="font-weight-bold mb-4 mb-md-6">{{ title }}</h1>
        
        <v-card class="mx-auto pa-4 pa-md-6 mb-6 mb-md-8" max-width="800" elevation="3">
          <div :class="$vuetify.display.smAndDown ? 'text-h6' : 'text-h5'" class="mb-4">
            Join us for great discussions and knowledge sharing!
          </div>
          
          <v-list>
            <v-list-item prepend-icon="mdi-calendar">
              <v-list-item-title :class="$vuetify.display.smAndDown ? 'text-body-1' : 'text-h6'">{{ date }}</v-list-item-title>
            </v-list-item>
            
            <v-list-item prepend-icon="mdi-map-marker">
              <v-list-item-title :class="$vuetify.display.smAndDown ? 'text-body-1' : 'text-h6'">{{ location }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
        
        <v-btn
          color="primary"
          :size="$vuetify.display.smAndDown ? 'large' : 'x-large'"
          to="/login"
          :class="$vuetify.display.smAndDown ? 'text-h6 px-6' : 'text-h6 px-8'"
          block
          max-width="300"
        >
          Join the Discussion
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
