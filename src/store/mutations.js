
export default {
    contracts(state, contracts){
        state.contracts = contracts;
    },
    addresses(state, payload){
        let result = payload.addresses;
        state.addresses = result;
        if (payload.callback) payload.callback(state)
    },
    account(state, account){
        state.user.wallet = account;
        state.user.address = account.getAddressString();
    },
    addTwin(state, twin){
        state.twins.push(twin);
    },
    addTwinComponents(state, data){
        state.twins[data.twin].components = data.components;
        state.twins[data.twin].aml = data.aml;
    },
    selectTwin(state, id){
        state.selectedTwin = id;
    },
    users(state, users){
        state.users = users;
    },
    twins(state, twins){
        state.twins = twins;
    },
    removeTwin(state, twinAddress){
        state.twins = state.twins.filter(function(v){
          return v.address !== twinAddress;
        });
    },
    setSpecificationAbi(state, ABI){
        state.specificationAbi = ABI;
    },
    spinner(state, status){
        state.spinner = status;
    }
}