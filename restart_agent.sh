kill $(ps aux  |  grep 'agent.js' |  grep -v grep | awk '{print $2}')
sleep 2
nohup node ethertwin/agent.js > ethertwin/agent.log 2>&1&
