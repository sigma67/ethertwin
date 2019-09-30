
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
    setIsDeviceAgent(state, value){
      state.user.isDeviceAgent = value;
    }
}