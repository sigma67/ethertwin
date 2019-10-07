
export default {
    web3Provider(state, web3Provider){
        state.web3Provider = web3Provider;
    },
    contracts(state, contracts){
        state.contracts = contracts;
    },
    addresses(state, payload){
        let result = payload.addresses;
        state.addresses = result;
        if (payload.callback) payload.callback(state)
    },
    account(state, account){
        state.user.address = account;
    },
    addTwin(state, twin){
        state.twins.push(twin);
    },
    twins(state, twins){
        state.twins = twins;
    },
    removeTwin(state, twinAddress){
        state.twins = state.twins.filter(function(v){
          return v.address !== twinAddress;
        });
    },
    setIsDeviceAgent(state, value){
      state.user.isDeviceAgent = value;
    }
}