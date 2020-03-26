<template>
  <div class="container mt-5">
    <div class="col">
      <h2>Account Information</h2>
    </div>
    <br/>
    <table class="table table-hover">
      <tbody>
      <tr>
        <td scope="row">Address</td>
        <td>
          <font-awesome-icon icon="address-card" data-placement="left" title="address"/>
        </td>
        <td>
          {{ this.account }}
        </td>
      </tr>
      <tr>
        <td scope="row">Balance</td>
        <td>
          <font-awesome-icon :icon="['fab', 'ethereum']"  data-placement="left" title="ethereum balance"/>
        </td>
        <td>
          {{ this.balance }} ETH
        </td>
      </tr>
      <tr>
        <td scope="row" style="width:7em;">Public key</td>
        <td>          
          <font-awesome-icon icon="key" data-placement="left" title="public key"/>
        </td>
        <td>
          <span style="word-wrap: break-word; word-break: break-all;">
            {{ this.pubKey }}
          </span>
        </td>
      </tr>
      <tr>
        <td scope="row">Private key</td>
        <td>   
          <font-awesome-icon icon="key" data-placement="left" title="private key"/>
        </td>
        <td>
          {{ this.privKey }}
        </td>
      </tr>
      </tbody>
    </table>
    <p v-if="!this.registered && this.balance > 0">
      <button class="btn btn-secondary btn mx-0" type="submit" v-on:click="register()">
        Register
      </button>
      Please register your address for other users<br />
    </p>
    <br/>
    <br/>
    <h5>Update private key</h5>
    <textarea cols="2" class="form-control" type="text"  v-model.lazy="privateKeyNew"/>
    <br/>
    <button class="btn btn-secondary btn" type="submit" v-on:click="savePrivateKey()"> 
      <font-awesome-icon icon="save" data-placement="left" title="save"/>
      save changes
    </button>
  </div>
</template>

<script>
    const ethereumjs = require('ethereumjs-wallet');

    export default {
        name: "Account",
        computed: {
            account() {
                return this.$store.state.user.address;
            }
        },
        data(){
            return{
                balance: 0,
                privateKeyNew: '',
                registered: false
            }
        },
        methods: {
            async savePrivateKey() {
                if(this.privateKeyNew) {
                  try {
                    //check if valid
                    let buffer = Buffer.from(this.privateKeyNew, 'hex');
                    ethereumjs.fromPrivateKey(buffer);
                  } catch (e) {
                    console.log(e);
                    this.$swal.fire({
                      type: "warning",
                      title: "Error: Private key does not satisfy the curve requirements (i.e. it is invalid)"
                    });
                    return;
                  }
                }
                localStorage.setItem('privateKey', this.privateKeyNew);
                this.$router.push('/');
                location.reload()//refresh site
            },

            async checkRegistered(){
              let users = await this.$store.dispatch('loadUsers');
              users = users.map(u => u.toLowerCase());
              this.registered = users.includes(this.account)
            },

            async register() {
              await this.$store.state.contracts.Authorization.register({from: this.account});
              await this.checkRegistered()
            }
        },
        async beforeMount() {
             this.pubKey = this.$store.state.user.wallet.getPublicKey().toString('hex');
             this.privKey = this.$store.state.user.wallet.getPrivateKey().toString('hex');
             let balanceTenEightteen = await window.web3.eth.getBalance(this.account);
             this.balance = (balanceTenEightteen/Math.pow(10,18));

             this.checkRegistered()
        }
    }
</script>

<style scoped>

</style>
