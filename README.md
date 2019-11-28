# ethertwin
The ethertwin prototype orginates from a research approach to share digital twin data over its lifecycle.
To allow the participation of the multiple lifecycle parties without relying on trusted third parties (TTPs), ethertwin relies on a distributed approach by integrating the Ethereum blockchain and the distributed hash table (DHT) Swarm.
On the basis of AutomationML (AML) files that specify assets, a digital twin can be created and shared with the twin's lifecycle parties.
The ethertwin prototype allows to:
- create digital twins
- share each twin  
- upload documents
- update twin specification and documents (versioning)
- create sensor data feeds
- control access of users by lifecycle roles and asset attributes
- list asset components (specification parsing)

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Usage
An exemplary specification for the twin creation can be found at `misc/CandyFactory.aml`, which originates from the [CPS Twinning prototype](https://github.com/sbaresearch/cps-twinning). 

### Research and Citation
Please consider citing our [publication](https://link.springer.com/chapter/10.1007/978-3-030-22479-0_15) if you are using our ethertwin prototype for your research. 