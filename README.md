# lethd server part

```
npm install

npm run test

cp config.default.yaml configs/config.yours.yaml
ln -s configs/config.yours.yaml config.yaml

npm run start | tail -f leths.log
```

Web server runs at http://localhost:3333, Logging goes to leths.log, see config.default.yaml for configuration docs.