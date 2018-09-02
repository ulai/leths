# lethd server part

```
npm install

npm run test

cp config.default.yaml configs/config.yours.yaml
ln -s configs/config.yours.yaml config.yaml

npm run start
```

Web server runs at http://localhost:3333, logging goes to leths.log, see config.default.yaml for configuration docs.

# cli

Set time servers `./cli.js uci system.ntp.server=,system.ntp.server='fe80::b908:c314:cfbd:7a4a%enp1s0' '/etc/init.d/sysntpd reload'`

# pm2
```
pm2 startup
pm2 start leths.js
pm2 save
```
