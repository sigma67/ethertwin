let ROLES = {
    DEVICEAGENT: 0,
    MANUFACTURER: 1,
    OWNER: 2,
    DISTRIBUTOR: 3,
    MAINTAINER: 4
  };

export default {
  install(Vue) {

    Vue.prototype.$utils = {
      enum2String(enumVal) {
        switch (enumVal) {
          case ROLES.DEVICEAGENT:
            return "Device Agent";
          case ROLES.MANUFACTURER:
            return "Manufacturer";
          case ROLES.OWNER:
            return "Owner";
          case ROLES.DISTRIBUTOR:
            return "Distributor";
          case ROLES.MAINTAINER:
            return "Maintainer";
          default:
            return null;
        }
      },

      date(timestamp){
        let locale = window.navigator.language;
        return new Date(timestamp*1000).toLocaleString(locale);
      },

      swarmHashToBytes(hash){
        return window.utils.hexToBytes("0x" + hash);
      },

      hexToSwarmHash(hex){
        return hex.substr(2, hex.length)
      }
    }
  }
}
