<template>
  <div>
    <div class="container mt-5">
      <div class="row justify-content-sm-center">
        <div class="col-md-6 col-md-offset-3">
          <h2>Digital Twin Overview</h2>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">
                  ID
                </th>
                <th scope="col">
                  Name
                </th>
                <th scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
            <tr v-for="twin in twins" :key="twin.height">
              <td>
                <router-link :to="{ name: 'block', params: { height: block.height } }">
                  {{ block.height }}
                </router-link>
              </td>
              <td>{{ block.tx_count }}</td>
              <td>{{ new Date(block.time).valueOf() }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Index',
    props: {
      msg: String
    },
    data() {
      return {
        twins: [],
      }
    },
    methods: {
      async loadTwins() {

      }
    }
  }
</script>

<style scoped>
  h3 {
    margin: 40px 0 0;
  }
</style>