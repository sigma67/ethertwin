nohup ganache-cli -p 7545 -e 500000 -h "0.0.0.0" - -i 66 -m "athlete thought wild chef tennis skirt horror always advice distance donate strike" --db ganache > ganache.log 2>&1&
sleep 5
nohup node agent.js > agent.log 2>&1&
