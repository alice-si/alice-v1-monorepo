exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: [
    './specs/single.js'
  ],
  params: {
    host: 'http://localhost:8080',
    user: 'tester@alice.si',
    password: 'Tester123'
  },
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['--window-size=1600,1200']
    }
  }
};