<template>
  <div id="app">
    <nav class="navbar navbar-expand-md navbar-light bg-light">
      <div class="container">
        <router-link to="/"  class="navbar-brand">
          <img alt="UR Logo" src="./assets/logo.png" height="36" class="align-middle mr-2">
          Ether Twin
        </router-link>

        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"/>
        </button>

        <div id="navbar" class="collapse navbar-collapse">
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link to="/" class="nav-link">Twins</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'contracts' }" class="nav-link">Contracts</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
}

@import'~bootstrap/dist/css/bootstrap.css';
</style>
