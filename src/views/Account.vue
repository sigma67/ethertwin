<template>
  <div class="container mt-5">
    <div class="col">
      <h2>Account Information</h2>
    </div>
    <br/>
    <table class="table table-hover">
      <tbody>
      <tr>
        <td>
          <font-awesome-icon icon="project-diagram" data-placement="left" title="network"/>
        </td>
          <td scope="row">Network</td>
          <td>
            <div>
              <h5 class="m-0">
                <button class="btn btn-info p-1" type="button" data-toggle="collapse" :data-target="'#contracts'"
                        aria-expanded="false" :aria-controls="'contracts'">
                  {{ this.network }}
                </button>
              </h5>
            </div>
            <div class="collapse" :id="'contracts'">
              <div>
                Registry Contract:
                {{ this.$store.state.addresses.ContractRegistryAddress }}<br/>
                Authorization Contract:
                {{ this.$store.state.addresses.AuthorizationAddress }}
              </div>
            </div>
          </td>
      </tr>
      <tr>
        <td>
          <font-awesome-icon icon="address-card" data-placement="left" title="address"/>
        </td>
        <td scope="row">Account</td>
        <td>
          {{ this.account }}
        </td>
      </tr>
      <tr>
        <td>
          <font-awesome-icon :icon="['fab', 'ethereum']"  data-placement="left" title="ethereum balance"/>
        </td>
        <td scope="row">Balance</td>
        <td>
          {{ this.$store.state.balance }} ETH
        </td>
      </tr>
      <tr>
        <td>
          <font-awesome-icon icon="lock-open" data-placement="left" title="unlock key"/>
        </td>
        <td scope="row" style="width:7em;">Public key</td>
        <td>
          <span style="word-wrap: break-word; word-break: break-all;">
            {{ this.pubKey }}
          </span>
        </td>
      </tr>
      <tr>
        <td>
          <font-awesome-icon icon="lock" data-placement="left" title="unlock key"/>
        </td>
        <td scope="row">Private key</td>
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
    import Wallet from 'ethereumjs-wallet'

    export default {
        name: "Account",
        computed: {
            account() {
                return this.$store.state.user.address;
            },
            registered() {
                return this.$store.state.users.includes(this.account)
            }
        },
        data(){
            return{
                balance: 0,
                privateKeyNew: '',
                network: ''
            }
        },
        methods: {
            async savePrivateKey() {
                if(this.privateKeyNew) {
                  try {
                    //check if valid
                    let buffer = Buffer.from(this.privateKeyNew, 'hex');
                    Wallet.fromPrivateKey(buffer);
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

            async register() {
              await this.$store.dispatch('register');
            }
        },
        async beforeMount() {
            this.pubKey = this.$store.state.user.wallet.getPublicKey().toString('hex');
            this.privKey = this.$store.state.user.wallet.getPrivateKey().toString('hex');
            this.network = await window.web3.eth.net.getNetworkType();
            this.$store.dispatch('updateBalance');
            this.$store.dispatch('loadUsers');
        }
    }
</script>

<style scoped>

</style>
