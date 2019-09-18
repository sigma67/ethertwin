<template>
  <div class="home">
    <Index msg="test"/>
  </div>
</template>

<script>
// @ is an alias to /src
import Index from '@/components/Index.vue'

export default {
  name: 'home',
  components: { Index }
}
</script>
